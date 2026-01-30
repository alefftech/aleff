/**
 * [TYPES:WEBHOOK] Webhook payload types (normalized)
 *
 * Provider-agnostic webhook types. Each provider adapter normalizes
 * their specific format to this standard format.
 */

import type { MessageKey, MessageType, MediaType } from "./messages.js";

// =============================================================================
// [TYPE:WEBHOOK_EVENT] Normalized webhook event types
// =============================================================================

export type WebhookEventType =
  | "message"           // New message received
  | "message_ack"       // Message acknowledgment (sent, delivered, read)
  | "message_revoke"    // Message deleted
  | "presence"          // Presence update
  | "group_update"      // Group info changed
  | "connection"        // Connection state changed
  | "unknown";

// =============================================================================
// [TYPE:MESSAGE_ACK] Message acknowledgment states
// =============================================================================

export type MessageAckStatus =
  | "pending"    // Sent to server
  | "sent"       // Delivered to server
  | "delivered"  // Delivered to recipient
  | "read"       // Read by recipient
  | "played";    // Played (for audio/video)

// =============================================================================
// [TYPE:NORMALIZED_MESSAGE] Normalized incoming message
// =============================================================================

export interface NormalizedMessage {
  /** Unique message identifier */
  messageKey: MessageKey;
  /** Sender info */
  from: string;
  fromName?: string;
  /** Message type */
  type: MessageType;
  /** Text content (for text messages or captions) */
  text?: string;
  /** Media info (for media messages) */
  media?: {
    type: MediaType;
    url?: string;
    mimeType?: string;
    fileName?: string;
    fileSize?: number;
  };
  /** Location info (for location messages) */
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  /** Contact info (for contact messages) */
  contact?: {
    name: string;
    phoneNumber: string;
  };
  /** Quoted message (if reply) */
  quotedMessage?: {
    messageId: string;
    text?: string;
  };
  /** Message timestamp */
  timestamp: number;
  /** Whether this is from a group */
  isGroup: boolean;
  /** Group ID if from group */
  groupId?: string;
  /** Channel identifier */
  channel: "whatsapp";
  /** Raw provider payload (for debugging) */
  raw?: unknown;
}

// =============================================================================
// [TYPE:NORMALIZED_EVENT] Normalized webhook event
// =============================================================================

export interface NormalizedWebhookEvent {
  /** Event type */
  type: WebhookEventType;
  /** Event timestamp */
  timestamp: number;
  /** Message data (for message events) */
  message?: NormalizedMessage;
  /** Ack data (for ack events) */
  ack?: {
    messageId: string;
    status: MessageAckStatus;
  };
  /** Connection data (for connection events) */
  connection?: {
    state: "open" | "close";
    phoneNumber?: string;
  };
  /** Provider ID */
  provider: string;
  /** Raw provider payload */
  raw?: unknown;
}
