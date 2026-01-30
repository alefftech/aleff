/**
 * [ADAPTER:MEGAAPI] MegaAPI Provider Implementation
 *
 * Implements WhatsAppProvider interface for MegaAPI Starter.
 * This is the "Prisma adapter" for MegaAPI.
 */

import type {
  WhatsAppProvider,
  ProviderConfig,
  ProviderInfo,
  ProviderFactory,
} from "../../whatsapp-core/src/types/provider.js";
import type {
  MessageResult,
  MediaResult,
  SendTextOptions,
  SendMediaOptions,
  SendLocationOptions,
  ContactInfo,
} from "../../whatsapp-core/src/types/messages.js";
import type { PresenceType, ReadReceiptOptions } from "../../whatsapp-core/src/types/presence.js";
import type {
  InstanceStatus,
  QRCodeResult,
  QRCodeFormat,
  WhatsAppCheckResult,
} from "../../whatsapp-core/src/types/instance.js";
import type {
  GroupListResult,
  GroupInfo,
  GroupCreateOptions,
  GroupCreateResult,
} from "../../whatsapp-core/src/types/groups.js";

import { MegaAPIClient } from "./api.js";
import { logger } from "./logger.js";

// =============================================================================
// [UTIL:MESSAGEID] Extract messageId from nested API response
// =============================================================================

/**
 * [FIX:MESSAGEID] MegaAPI returns different response structures:
 * - { messageId: "..." }
 * - { data: { messageId: "..." } }
 * - { data: { id: "..." } }
 *
 * This helper normalizes all formats.
 */
function extractMessageId(result: any): string | undefined {
  return result?.messageId || result?.data?.messageId || result?.data?.id;
}

// =============================================================================
// [PROVIDER:INFO] Provider metadata
// =============================================================================

const PROVIDER_INFO: ProviderInfo = {
  id: "megaapi",
  name: "MegaAPI Starter",
  version: "1.0.0",
  features: {
    presence: true,
    readReceipts: true,
    groups: true,
    media: true,
    reactions: false, // Not supported in Starter
    messageDelete: true,
    pairingCode: false, // Not supported in Starter
  },
};

// =============================================================================
// [CLASS:ADAPTER] MegaAPI Provider
// =============================================================================

class MegaAPIProvider implements WhatsAppProvider {
  readonly info = PROVIDER_INFO;
  private client: MegaAPIClient;

  constructor(config: ProviderConfig) {
    this.client = new MegaAPIClient({
      apiHost: config.apiHost,
      instanceKey: config.instanceKey,
      apiToken: config.apiToken,
    });

    logger.info(
      { apiHost: config.apiHost, instanceKey: config.instanceKey },
      "provider_initialized"
    );
  }

  // ===========================================================================
  // [NAMESPACE:INSTANCE] Instance management
  // ===========================================================================

  instance = {
    getStatus: async (): Promise<InstanceStatus> => {
      try {
        const result = await this.client.getInstanceStatus();
        return {
          state: result.state === "open" ? "open" : "close",
          phoneNumber: result.phoneNumber,
          isAuthenticated: result.state === "open",
          providerInfo: result,
        };
      } catch (error: any) {
        logger.error({ error: error.message }, "get_status_failed");
        return {
          state: "unknown",
          isAuthenticated: false,
        };
      }
    },

    getQRCode: async (format: QRCodeFormat = "base64"): Promise<QRCodeResult> => {
      const result = await this.client.getQRCode(format === "image" ? "image" : "base64");
      return {
        data: result.qrcode || result.data || "",
        format,
        valid: true,
      };
    },

    logout: async (): Promise<void> => {
      await this.client.logout();
      logger.info({}, "instance_logged_out");
    },

    restart: async (): Promise<void> => {
      await this.client.restart();
      logger.info({}, "instance_restarted");
    },

    isOnWhatsApp: async (phoneNumber: string): Promise<WhatsAppCheckResult> => {
      const result = await this.client.isOnWhatsApp(phoneNumber);
      return {
        phoneNumber,
        exists: result.exists ?? result.numberExists ?? false,
        jid: result.jid,
      };
    },
  };

  // ===========================================================================
  // [NAMESPACE:MESSAGES] Message operations
  // ===========================================================================

  messages = {
    sendText: async (
      to: string,
      text: string,
      options?: SendTextOptions
    ): Promise<MessageResult> => {
      try {
        const recipient = this.client.normalizeJid(to);
        const messageData: Record<string, unknown> = {
          to: recipient,
          text,
          linkPreview: options?.linkPreview ?? false,
        };

        if (options?.quotedMessageId) {
          messageData.quotedMessageId = options.quotedMessageId;
        }

        const result = await this.client.sendMessage("text", messageData);
        const messageId = extractMessageId(result);

        logger.info(
          { to: recipient, messageId },
          "text_sent"
        );

        return {
          success: true,
          messageId,
        };
      } catch (error: any) {
        logger.error({ to, error: error.message }, "text_send_failed");
        return { success: false, error: error.message };
      }
    },

    sendMediaUrl: async (
      to: string,
      url: string,
      type: "image" | "audio" | "video" | "document",
      options?: SendMediaOptions
    ): Promise<MediaResult> => {
      try {
        const recipient = this.client.normalizeJid(to);
        const messageData: Record<string, unknown> = {
          to: recipient,
          url,
          type,
        };

        if (options?.caption) messageData.caption = options.caption;
        if (options?.fileName) messageData.fileName = options.fileName;
        if (options?.mimeType) messageData.mimeType = options.mimeType;
        if (options?.ptt && type === "audio") messageData.ptt = true;
        if (options?.quotedMessageId) messageData.quotedMessageId = options.quotedMessageId;

        const result = await this.client.sendMessage("mediaUrl", messageData);
        const messageId = extractMessageId(result);

        logger.info(
          { to: recipient, messageId, type },
          "media_sent"
        );

        return {
          success: true,
          messageId,
        };
      } catch (error: any) {
        logger.error({ to, type, error: error.message }, "media_send_failed");
        return { success: false, error: error.message };
      }
    },

    sendLocation: async (
      to: string,
      latitude: number,
      longitude: number,
      options?: SendLocationOptions
    ): Promise<MessageResult> => {
      try {
        const recipient = this.client.normalizeJid(to);
        const messageData: Record<string, unknown> = {
          to: recipient,
          latitude,
          longitude,
        };

        if (options?.name) messageData.name = options.name;
        if (options?.address) messageData.address = options.address;

        const result = await this.client.sendMessage("location", messageData);
        const messageId = extractMessageId(result);

        logger.info(
          { to: recipient, messageId },
          "location_sent"
        );

        return {
          success: true,
          messageId,
        };
      } catch (error: any) {
        logger.error({ to, error: error.message }, "location_send_failed");
        return { success: false, error: error.message };
      }
    },

    sendContact: async (
      to: string,
      contact: ContactInfo
    ): Promise<MessageResult> => {
      try {
        const recipient = this.client.normalizeJid(to);
        const messageData = {
          to: recipient,
          contactName: contact.fullName,
          contactNumber: contact.phoneNumber,
          contactOrg: contact.organization,
        };

        const result = await this.client.sendMessage("contact", messageData);
        const messageId = extractMessageId(result);

        logger.info(
          { to: recipient, messageId },
          "contact_sent"
        );

        return {
          success: true,
          messageId,
        };
      } catch (error: any) {
        logger.error({ to, error: error.message }, "contact_send_failed");
        return { success: false, error: error.message };
      }
    },

    forwardMessage: async (
      to: string,
      messageId: string,
      fromChatId: string
    ): Promise<MessageResult> => {
      try {
        const recipient = this.client.normalizeJid(to);
        const fromJid = this.client.normalizeJid(fromChatId);

        const result = await this.client.sendMessage("forward", {
          to: recipient,
          messageId,
          fromChatId: fromJid,
        });
        const resultMessageId = extractMessageId(result);

        logger.info(
          { to: recipient, messageId: resultMessageId },
          "message_forwarded"
        );

        return {
          success: true,
          messageId: resultMessageId,
        };
      } catch (error: any) {
        logger.error({ to, error: error.message }, "forward_failed");
        return { success: false, error: error.message };
      }
    },

    replyMessage: async (
      to: string,
      text: string,
      quotedMessageId: string
    ): Promise<MessageResult> => {
      return this.messages.sendText(to, text, { quotedMessageId });
    },

    deleteMessage: async (
      chatId: string,
      messageId: string
    ): Promise<void> => {
      await this.client.deleteMessage(chatId, messageId, true);
      logger.info({ chatId, messageId }, "message_deleted");
    },

    deleteMessageForMe: async (
      chatId: string,
      messageId: string
    ): Promise<void> => {
      await this.client.deleteMessage(chatId, messageId, false);
      logger.info({ chatId, messageId }, "message_deleted_for_me");
    },
  };

  // ===========================================================================
  // [NAMESPACE:PRESENCE] Presence operations
  // ===========================================================================

  presence = {
    sendPresence: async (
      chatId: string,
      type: PresenceType
    ): Promise<void> => {
      // Map to MegaAPI presence types
      const megaApiType =
        type === "composing"
          ? "composing"
          : type === "recording"
            ? "recording"
            : "paused";

      await this.client.sendPresence(chatId, megaApiType);
      logger.debug({ chatId, type }, "presence_sent");
    },

    markAsRead: async (
      chatId: string,
      options?: ReadReceiptOptions
    ): Promise<void> => {
      await this.client.markAsRead(chatId, options?.messageId);
      logger.debug({ chatId, messageId: options?.messageId }, "marked_as_read");
    },
  };

  // ===========================================================================
  // [NAMESPACE:GROUPS] Group operations
  // ===========================================================================

  groups = {
    list: async (): Promise<GroupListResult> => {
      const result = await this.client.listGroups();
      const groups = result.groups || result.data || [];

      return {
        groups: groups.map((g: any) => ({
          id: g.id || g.jid,
          name: g.subject || g.name,
          participantCount: g.participants?.length || 0,
          isAdmin: g.isAdmin || false,
        })),
        total: groups.length,
      };
    },

    getInfo: async (groupId: string): Promise<GroupInfo> => {
      const result = await this.client.getGroupInfo(groupId);
      const data = result.data || result;

      return {
        id: data.id || groupId,
        name: data.subject || data.name,
        description: data.desc,
        owner: data.owner,
        participants: (data.participants || []).map((p: any) => ({
          id: p.id || p.jid,
          name: p.name,
          role: p.admin ? (p.admin === "superadmin" ? "superadmin" : "admin") : "member",
        })),
        isAdmin: data.isAdmin || false,
      };
    },

    create: async (options: GroupCreateOptions): Promise<GroupCreateResult> => {
      const result = await this.client.createGroup(
        options.name,
        options.participants
      );

      return {
        groupId: result.groupId || result.id,
        inviteLink: result.inviteLink,
      };
    },

    addParticipants: async (
      groupId: string,
      participants: string[]
    ): Promise<void> => {
      await this.client.addGroupParticipants(groupId, participants);
      logger.info({ groupId, count: participants.length }, "participants_added");
    },

    removeParticipants: async (
      groupId: string,
      participants: string[]
    ): Promise<void> => {
      await this.client.removeGroupParticipants(groupId, participants);
      logger.info({ groupId, count: participants.length }, "participants_removed");
    },

    leave: async (groupId: string): Promise<void> => {
      await this.client.leaveGroup(groupId);
      logger.info({ groupId }, "left_group");
    },
  };

  // ===========================================================================
  // [NAMESPACE:WEBHOOK] Webhook operations
  // ===========================================================================

  webhook = {
    getConfig: async (): Promise<{ url?: string }> => {
      const result = await this.client.getWebhookConfig();
      return { url: result.webhookUrl || result.url };
    },

    configure: async (url: string): Promise<void> => {
      await this.client.configureWebhook(url);
      logger.info({ url }, "webhook_configured");
    },
  };
}

// =============================================================================
// [FACTORY:PROVIDER] Provider factory function
// =============================================================================

export const createMegaAPIProvider: ProviderFactory = (
  config: ProviderConfig
): WhatsAppProvider => {
  return new MegaAPIProvider(config);
};

export { MegaAPIProvider };
