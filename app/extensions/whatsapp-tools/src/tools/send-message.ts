/**
 * [TOOL:SEND_MESSAGE] Send text message via WhatsApp
 *
 * Uses the abstracted WhatsApp client - works with any provider.
 */

import { getWhatsAppClient } from "../../../whatsapp-core/index.js";
import { logger } from "../logger.js";

export function createSendMessageTool() {
  return {
    name: "send_whatsapp_message",
    description:
      "Send text message via WhatsApp. Use this for regular text communication with clients.",
    parameters: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "WhatsApp number (format: 5511999999999)",
        },
        message: {
          type: "string",
          description: "Text message to send",
        },
        linkPreview: {
          type: "boolean",
          description: "Enable link preview (default: false)",
        },
      },
      required: ["to", "message"],
    },
    async execute(_toolCallId: string, args: any) {
      try {
        const client = getWhatsAppClient();

        if (!client.isConfigured()) {
          return {
            success: false,
            error: "WhatsApp provider not configured",
          };
        }

        const result = await client.messages.sendText(args.to, args.message, {
          linkPreview: args.linkPreview ?? false,
        });

        logger.info(
          {
            to: args.to,
            messageId: result.messageId,
            messageLength: args.message.length,
            provider: client.getProviderInfo()?.id,
          },
          "message_sent"
        );

        return {
          success: result.success,
          messageId: result.messageId,
          to: args.to,
          error: result.error,
        };
      } catch (error: any) {
        logger.error(
          { to: args.to, error: error.message },
          "message_send_failed"
        );

        return {
          success: false,
          error: error.message,
        };
      }
    },
  };
}

export function createReplyMessageTool() {
  return {
    name: "reply_whatsapp_message",
    description:
      "Reply to a specific WhatsApp message (quote). Use this to respond to a particular message.",
    parameters: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "WhatsApp number or group JID",
        },
        message: {
          type: "string",
          description: "Reply text message",
        },
        quotedMessageId: {
          type: "string",
          description: "ID of the message to quote/reply to",
        },
      },
      required: ["to", "message", "quotedMessageId"],
    },
    async execute(_toolCallId: string, args: any) {
      try {
        const client = getWhatsAppClient();

        if (!client.isConfigured()) {
          return {
            success: false,
            error: "WhatsApp provider not configured",
          };
        }

        const result = await client.messages.replyMessage(
          args.to,
          args.message,
          args.quotedMessageId
        );

        logger.info(
          {
            to: args.to,
            messageId: result.messageId,
            quotedId: args.quotedMessageId,
          },
          "reply_sent"
        );

        return {
          success: result.success,
          messageId: result.messageId,
          to: args.to,
          error: result.error,
        };
      } catch (error: any) {
        logger.error(
          { to: args.to, error: error.message },
          "reply_send_failed"
        );

        return {
          success: false,
          error: error.message,
        };
      }
    },
  };
}
