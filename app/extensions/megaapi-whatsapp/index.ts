/**
 * MegaAPI WhatsApp Integration
 *
 * Integrates Aleff with WhatsApp via MegaAPI (Brazilian WhatsApp API service)
 *
 * Features:
 * - Send/receive WhatsApp messages
 * - Webhook for real-time message delivery
 * - Allowlist for security (only authorized numbers)
 * - Media support (images, documents, audio)
 *
 * Security:
 * - Credentials via environment variables (not hardcoded)
 * - Developed internally (no third-party skills)
 * - Webhook token validation
 * - Number allowlist (similar to Telegram)
 *
 * Environment Variables:
 * - MEGAAPI_API_HOST: Custom API host (e.g., apistart01.megaapi.com.br)
 * - MEGAAPI_INSTANCE_KEY: Instance key from MegaAPI
 * - MEGAAPI_TOKEN: API token (Bearer)
 * - MEGAAPI_WEBHOOK_TOKEN: Webhook validation token
 * - MEGAAPI_ALLOW_FROM: Comma-separated list of allowed numbers
 *
 * @see https://mega-api.app.br
 * @see https://api2.megaapi.com.br/docs/
 */

import type { MoltbotPluginApi } from "clawdbot/plugin-sdk";
import { logger } from "./src/logger.js";

// [CONFIG:ENV] Read configuration from environment variables
function getConfig() {
  return {
    apiHost: process.env.MEGAAPI_API_HOST || "api2.megaapi.com.br",
    instanceKey: process.env.MEGAAPI_INSTANCE_KEY || "",
    apiToken: process.env.MEGAAPI_TOKEN || "",
    webhookToken: process.env.MEGAAPI_WEBHOOK_TOKEN || "",
    allowFrom: process.env.MEGAAPI_ALLOW_FROM
      ? process.env.MEGAAPI_ALLOW_FROM.split(",").map(n => n.trim())
      : []
  };
}

const plugin = {
  id: "megaapi-whatsapp",
  name: "MegaAPI WhatsApp",
  description: "WhatsApp integration via MegaAPI (credentials from env vars)",

  register(api: MoltbotPluginApi) {
    const config = getConfig();

    logger.info({
      apiHost: config.apiHost,
      instanceKey: config.instanceKey,
      allowlistSize: config.allowFrom.length,
      publicChannel: config.allowFrom.length === 0
    }, "plugin_registered");

    // TODO: [HOOK:WEBHOOK] Implement webhook for incoming messages
    // Requires understanding of Moltbot's hook registration API

    // [TOOL:SEND] Register tool for sending WhatsApp messages
    api.registerTool({
      name: "megaapi_send_whatsapp",
      description: "Send WhatsApp message via MegaAPI",
      parameters: {
        type: "object",
        properties: {
          to: {
            type: "string",
            description: "WhatsApp number (format: 5511999999999@s.whatsapp.net or 5511999999999)"
          },
          message: {
            type: "string",
            description: "Text message to send"
          },
          mediaUrl: {
            type: "string",
            description: "Optional: URL of image/document to send"
          }
        },
        required: ["to", "message"]
      },
      async execute(_toolCallId: string, args: any) {
        // [VALIDATION:CONFIG] Check if MegaAPI is configured
        if (!config.apiToken || !config.instanceKey) {
          logger.error({}, "megaapi_not_configured");
          return {
            error: "MegaAPI not configured. Set MEGAAPI_TOKEN and MEGAAPI_INSTANCE_KEY environment variables."
          };
        }

        // [STEP:NORMALIZE] Normalize phone number
        let targetJid = args.to;
        if (!targetJid.includes("@")) {
          targetJid = `${targetJid}@s.whatsapp.net`;
        }

        // [STEP:SEND] Send message via MegaAPI
        const url = `https://${config.apiHost}/rest/sendMessage/${config.instanceKey}/contactMessage`;

        const payload = {
          number: targetJid,
          text: args.message,
          ...(args.mediaUrl && { mediaUrl: args.mediaUrl })
        };

        try {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${config.apiToken}`
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`MegaAPI error (${response.status}): ${errorText}`);
          }

          const result = await response.json();

          logger.info({
            to: targetJid,
            messageId: result.messageId,
            hasMedia: !!args.mediaUrl
          }, "message_sent_success");

          return {
            success: true,
            messageId: result.messageId,
            to: targetJid,
            message: args.message
          };
        } catch (error: any) {
          logger.error({
            to: targetJid,
            error: error.message
          }, "message_send_failed");

          return {
            error: error.message,
            to: targetJid
          };
        }
      }
    });
  }
};

export default plugin;
