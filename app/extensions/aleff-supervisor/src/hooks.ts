/**
 * [HOOKS:INTERCEPT] Message interception for supervisor control
 *
 * Implements hooks to:
 * - Block outgoing messages when channel is STOPPED or TAKEOVER
 * - Notify supervisor of incoming messages
 * - Allow supervisor messages to bypass blocks
 */

import { getChannelState, isChannelBlocked, isChannelTakeover } from "./state.js";
import { notifyIncomingMessage, isSupervisorConfigured } from "./notify.js";
import { logger } from "./logger.js";

// =============================================================================
// [TYPE:EVENT] Event types for hooks
// =============================================================================

export interface MessageSendingEvent {
  to: string;
  content: string;
  messageId?: string;
  [key: string]: unknown;
}

export interface MessageReceivedEvent {
  from: string;
  content: string;
  messageId?: string;
  timestamp?: number;
  [key: string]: unknown;
}

export interface HookContext {
  channelId: string;
  userId?: string;
  accountId?: string;
  conversationId?: string;
  isSupervisor?: boolean;
  [key: string]: unknown;
}

// =============================================================================
// [HOOK:MESSAGE_SENDING] Intercept outgoing messages
// =============================================================================

/**
 * [HOOK:MESSAGE_SENDING] Intercept outgoing messages
 *
 * Returns:
 * - true: Allow the message to be sent
 * - false: Block the message
 *
 * Blocking rules:
 * - STOPPED: Block all bot responses
 * - TAKEOVER: Block all bot responses (supervisor responds manually)
 * - isSupervisor: Always allow supervisor messages
 */
export async function onMessageSending(
  event: MessageSendingEvent,
  ctx: HookContext
): Promise<boolean> {
  const channelId = ctx.channelId?.toLowerCase() || "unknown";
  const state = getChannelState(channelId);

  // [SECURITY:BYPASS] Supervisor messages always go through
  if (ctx.isSupervisor) {
    logger.debug(
      { channelId, state, isSupervisor: true },
      "message_allowed_supervisor"
    );
    return true;
  }

  // [STATE:CHECK] Block if channel is stopped or taken over
  if (isChannelBlocked(channelId)) {
    logger.info(
      {
        channelId,
        state,
        to: event.to,
        blocked: true,
        contentLength: event.content?.length ?? 0,
      },
      "message_blocked_by_supervisor"
    );
    return false;
  }

  // [STATE:RUNNING] Allow message
  logger.debug(
    { channelId, state, to: event.to },
    "message_allowed"
  );
  return true;
}

// =============================================================================
// [HOOK:MESSAGE_RECEIVED] Notify supervisor of incoming messages
// =============================================================================

/**
 * [HOOK:MESSAGE_RECEIVED] Notify supervisor of incoming messages
 *
 * Always notifies the supervisor of incoming messages from child channels.
 * This allows the supervisor to see all activity even when the bot is responding.
 */
export async function onMessageReceived(
  event: MessageReceivedEvent,
  ctx: HookContext
): Promise<void> {
  const channelId = ctx.channelId?.toLowerCase() || "unknown";
  const state = getChannelState(channelId);

  // [NOTIFY:ALWAYS] Supervisor always gets notified (if configured)
  if (isSupervisorConfigured()) {
    try {
      await notifyIncomingMessage(
        channelId,
        event.from,
        event.content?.substring(0, 500) ?? "", // [SECURITY:TRUNCATE]
        state
      );
    } catch (error: any) {
      logger.error(
        { channelId, from: event.from, error: error.message },
        "notify_supervisor_failed"
      );
    }
  }

  logger.debug(
    { channelId, from: event.from, state, notified: isSupervisorConfigured() },
    "supervisor_notified"
  );
}

// =============================================================================
// [HOOK:HELPERS] Helper functions for hooks
// =============================================================================

/**
 * [HOOK:CHECK_BLOCKED] Check if a channel is currently blocked
 */
export function checkChannelBlocked(channelId: string): {
  blocked: boolean;
  state: string;
  reason?: string;
} {
  const normalized = channelId?.toLowerCase() || "unknown";
  const state = getChannelState(normalized);
  const blocked = isChannelBlocked(normalized);

  let reason: string | undefined;
  if (state === "STOPPED") {
    reason = "Canal pausado pelo supervisor";
  } else if (state === "TAKEOVER") {
    reason = "Supervisor assumiu controle manual";
  }

  return { blocked, state, reason };
}

/**
 * [HOOK:IS_TAKEOVER] Check if supervisor has taken over
 */
export function checkTakeover(channelId: string): boolean {
  return isChannelTakeover(channelId?.toLowerCase() || "unknown");
}
