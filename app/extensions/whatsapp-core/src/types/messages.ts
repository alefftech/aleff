/**
 * [TYPES:MESSAGES] Message types for WhatsApp abstraction
 *
 * Provider-agnostic message types that any WhatsApp provider must implement.
 */

// =============================================================================
// [TYPE:MESSAGE_TYPES] Message content types
// =============================================================================

export type MessageType =
  | "text"
  | "image"
  | "audio"
  | "video"
  | "document"
  | "sticker"
  | "ptt"        // Push-to-talk (voice note)
  | "location"
  | "contact"
  | "reaction";

export type MediaType = "image" | "audio" | "video" | "document" | "ptt" | "sticker";

// =============================================================================
// [TYPE:MESSAGE_KEY] Unique message identifier
// =============================================================================

export interface MessageKey {
  /** Remote JID (e.g., 5511999999999@s.whatsapp.net) */
  remoteJid: string;
  /** Unique message ID */
  id: string;
  /** Whether message was sent by us */
  fromMe: boolean;
}

// =============================================================================
// [TYPE:SEND_OPTIONS] Options for sending messages
// =============================================================================

export interface SendTextOptions {
  /** Enable link preview */
  linkPreview?: boolean;
  /** Message ID to quote/reply to */
  quotedMessageId?: string;
}

export interface SendMediaOptions {
  /** Caption for media */
  caption?: string;
  /** File name for documents */
  fileName?: string;
  /** MIME type (auto-detected if not provided) */
  mimeType?: string;
  /** Message ID to quote/reply to */
  quotedMessageId?: string;
  /** Send as voice note (audio only) */
  ptt?: boolean;
}

export interface SendLocationOptions {
  /** Location name */
  name?: string;
  /** Address */
  address?: string;
}

// =============================================================================
// [TYPE:CONTACT] Contact information
// =============================================================================

export interface ContactInfo {
  /** Contact's full name */
  fullName: string;
  /** Phone number with country code */
  phoneNumber: string;
  /** Organization/company */
  organization?: string;
}

// =============================================================================
// [TYPE:RESULTS] Operation results
// =============================================================================

export interface MessageResult {
  /** Whether operation succeeded */
  success: boolean;
  /** Message ID if successful */
  messageId?: string;
  /** Error message if failed */
  error?: string;
}

export interface MediaResult extends MessageResult {
  /** URL of uploaded media (if applicable) */
  mediaUrl?: string;
}
