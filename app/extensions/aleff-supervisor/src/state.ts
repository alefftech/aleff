/**
 * [STATE:CHANNELS] Channel state management for supervisor
 *
 * Manages the state of supervised channels (RUNNING, STOPPED, TAKEOVER).
 * Currently uses in-memory Map, can migrate to Redis/PostgreSQL later.
 */

import { logger } from "./logger.js";

// =============================================================================
// [TYPE:STATE] Channel state types
// =============================================================================

export type ChannelState = "RUNNING" | "STOPPED" | "TAKEOVER";

export interface ChannelStatus {
  state: ChannelState;
  updatedAt: number;
  updatedBy: string;
}

// =============================================================================
// [STATE:STORE] In-memory state storage
// =============================================================================

// [STATE:STORE] In-memory state (can migrate to Redis/PostgreSQL later)
const channelStates = new Map<string, ChannelStatus>();

// =============================================================================
// [STATE:GETTERS] State retrieval functions
// =============================================================================

/**
 * [STATE:GET] Get the current state of a channel
 * Returns RUNNING as default if channel not found
 */
export function getChannelState(channelId: string): ChannelState {
  return channelStates.get(channelId)?.state ?? "RUNNING";
}

/**
 * [STATE:GET_FULL] Get full status object for a channel
 */
export function getChannelStatus(channelId: string): ChannelStatus | undefined {
  return channelStates.get(channelId);
}

// =============================================================================
// [STATE:SETTERS] State modification functions
// =============================================================================

/**
 * [STATE:SET] Set the state of a channel
 */
export function setChannelState(
  channelId: string,
  state: ChannelState,
  updatedBy: string
): void {
  const previous = channelStates.get(channelId)?.state ?? "RUNNING";

  channelStates.set(channelId, {
    state,
    updatedAt: Date.now(),
    updatedBy,
  });

  logger.info(
    { channelId, previous, state, updatedBy },
    "channel_state_changed"
  );
}

// =============================================================================
// [STATE:LIST] List all channels
// =============================================================================

/**
 * [STATE:LIST] Get all registered channels and their statuses
 */
export function listChannels(): Map<string, ChannelStatus> {
  return new Map(channelStates);
}

/**
 * [STATE:LIST_ARRAY] Get all channels as an array for easier iteration
 */
export function listChannelsArray(): Array<{ id: string } & ChannelStatus> {
  return Array.from(channelStates.entries()).map(([id, status]) => ({
    id,
    ...status,
  }));
}

// =============================================================================
// [STATE:HELPERS] Utility functions
// =============================================================================

/**
 * [STATE:IS_BLOCKED] Check if a channel should block bot responses
 */
export function isChannelBlocked(channelId: string): boolean {
  const state = getChannelState(channelId);
  return state === "STOPPED" || state === "TAKEOVER";
}

/**
 * [STATE:IS_TAKEOVER] Check if supervisor has taken over a channel
 */
export function isChannelTakeover(channelId: string): boolean {
  return getChannelState(channelId) === "TAKEOVER";
}
