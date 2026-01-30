/**
 * [TYPES:PROVIDER] WhatsApp Provider Interface
 *
 * The main contract that any WhatsApp provider must implement.
 * Similar to Prisma's approach - define once, implement per adapter.
 *
 * Usage:
 * - MegaAPI implements WhatsAppProvider
 * - Evolution API implements WhatsAppProvider
 * - WhatsApp Cloud implements WhatsAppProvider
 *
 * Switching providers = change 1 line of config, zero code changes.
 */

import type {
  MessageResult,
  MediaResult,
  SendTextOptions,
  SendMediaOptions,
  SendLocationOptions,
  ContactInfo,
} from "./messages.js";
import type { PresenceType, PresenceOptions, ReadReceiptOptions } from "./presence.js";
import type {
  InstanceStatus,
  QRCodeResult,
  QRCodeFormat,
  PairingCodeResult,
  WhatsAppCheckResult,
} from "./instance.js";
import type {
  GroupListResult,
  GroupInfo,
  GroupCreateOptions,
  GroupCreateResult,
} from "./groups.js";

// =============================================================================
// [TYPE:PROVIDER_CONFIG] Provider configuration
// =============================================================================

export interface ProviderConfig {
  /** API host/base URL */
  apiHost: string;
  /** Instance/session key */
  instanceKey: string;
  /** API token/key */
  apiToken: string;
  /** Webhook token for validation */
  webhookToken?: string;
  /** Additional provider-specific config */
  extra?: Record<string, unknown>;
}

// =============================================================================
// [TYPE:PROVIDER_INFO] Provider metadata
// =============================================================================

export interface ProviderInfo {
  /** Unique provider ID (e.g., "megaapi", "evolution") */
  id: string;
  /** Human-readable name */
  name: string;
  /** Provider version */
  version: string;
  /** Supported features */
  features: ProviderFeatures;
}

export interface ProviderFeatures {
  /** Supports typing indicators */
  presence: boolean;
  /** Supports read receipts */
  readReceipts: boolean;
  /** Supports group management */
  groups: boolean;
  /** Supports media messages */
  media: boolean;
  /** Supports reactions */
  reactions: boolean;
  /** Supports message deletion */
  messageDelete: boolean;
  /** Supports pairing code (alternative to QR) */
  pairingCode: boolean;
}

// =============================================================================
// [TYPE:PROVIDER] Main Provider Interface
// =============================================================================

export interface WhatsAppProvider {
  /** Provider information */
  readonly info: ProviderInfo;

  // ===========================================================================
  // [NAMESPACE:INSTANCE] Instance/connection management
  // ===========================================================================

  instance: {
    /** Get current connection status */
    getStatus(): Promise<InstanceStatus>;

    /** Get QR code for authentication */
    getQRCode(format?: QRCodeFormat): Promise<QRCodeResult>;

    /** Get pairing code (alternative to QR) */
    getPairingCode?(phoneNumber: string): Promise<PairingCodeResult>;

    /** Logout/disconnect instance */
    logout(): Promise<void>;

    /** Restart instance */
    restart(): Promise<void>;

    /** Check if phone number is on WhatsApp */
    isOnWhatsApp(phoneNumber: string): Promise<WhatsAppCheckResult>;
  };

  // ===========================================================================
  // [NAMESPACE:MESSAGES] Message operations
  // ===========================================================================

  messages: {
    /** Send text message */
    sendText(
      to: string,
      text: string,
      options?: SendTextOptions
    ): Promise<MessageResult>;

    /** Send media from URL */
    sendMediaUrl(
      to: string,
      url: string,
      type: "image" | "audio" | "video" | "document",
      options?: SendMediaOptions
    ): Promise<MediaResult>;

    /** Send media from base64 */
    sendMediaBase64?(
      to: string,
      base64: string,
      type: "image" | "audio" | "video" | "document",
      options?: SendMediaOptions
    ): Promise<MediaResult>;

    /** Send location */
    sendLocation(
      to: string,
      latitude: number,
      longitude: number,
      options?: SendLocationOptions
    ): Promise<MessageResult>;

    /** Send contact card */
    sendContact(to: string, contact: ContactInfo): Promise<MessageResult>;

    /** Forward message to another chat */
    forwardMessage(
      to: string,
      messageId: string,
      fromChatId: string
    ): Promise<MessageResult>;

    /** Reply to a message (quote) */
    replyMessage(
      to: string,
      text: string,
      quotedMessageId: string
    ): Promise<MessageResult>;

    /** Delete message */
    deleteMessage(chatId: string, messageId: string): Promise<void>;

    /** Delete message for me only */
    deleteMessageForMe?(chatId: string, messageId: string): Promise<void>;

    /** Send reaction to message */
    sendReaction?(
      chatId: string,
      messageId: string,
      emoji: string
    ): Promise<void>;
  };

  // ===========================================================================
  // [NAMESPACE:PRESENCE] Presence/typing indicators
  // ===========================================================================

  presence: {
    /** Send presence update (typing, recording, etc.) */
    sendPresence(
      chatId: string,
      type: PresenceType,
      options?: PresenceOptions
    ): Promise<void>;

    /** Mark chat/message as read */
    markAsRead(chatId: string, options?: ReadReceiptOptions): Promise<void>;
  };

  // ===========================================================================
  // [NAMESPACE:GROUPS] Group management
  // ===========================================================================

  groups: {
    /** List all groups */
    list(): Promise<GroupListResult>;

    /** Get group info */
    getInfo(groupId: string): Promise<GroupInfo>;

    /** Create new group */
    create(options: GroupCreateOptions): Promise<GroupCreateResult>;

    /** Add participants to group */
    addParticipants(groupId: string, participants: string[]): Promise<void>;

    /** Remove participants from group */
    removeParticipants(groupId: string, participants: string[]): Promise<void>;

    /** Leave group */
    leave(groupId: string): Promise<void>;

    /** Get invite link */
    getInviteLink?(groupId: string): Promise<string>;
  };

  // ===========================================================================
  // [NAMESPACE:WEBHOOK] Webhook configuration
  // ===========================================================================

  webhook: {
    /** Get current webhook configuration */
    getConfig(): Promise<{ url?: string; events?: string[] }>;

    /** Configure webhook URL */
    configure(url: string, events?: string[]): Promise<void>;
  };
}

// =============================================================================
// [TYPE:PROVIDER_FACTORY] Factory for creating providers
// =============================================================================

export type ProviderFactory = (config: ProviderConfig) => WhatsAppProvider;
