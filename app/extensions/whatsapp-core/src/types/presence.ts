/**
 * [TYPES:PRESENCE] Presence/typing indicator types
 *
 * Provider-agnostic presence types for typing indicators, read receipts, etc.
 */

// =============================================================================
// [TYPE:PRESENCE] Presence state types
// =============================================================================

export type PresenceType =
  | "composing"    // Typing...
  | "recording"    // Recording audio...
  | "paused"       // Stopped typing
  | "available"    // Online
  | "unavailable"; // Offline

// =============================================================================
// [TYPE:PRESENCE_OPTIONS] Options for presence operations
// =============================================================================

export interface PresenceOptions {
  /** Duration in ms to show presence (for keep-alive) */
  duration?: number;
}

export interface ReadReceiptOptions {
  /** Specific message ID to mark as read (optional, marks all if not provided) */
  messageId?: string;
}
