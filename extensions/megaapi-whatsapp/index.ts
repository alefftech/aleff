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
 * - Developed internally (no third-party skills)
 * - Webhook token validation
 * - Number allowlist (similar to Telegram)
 *
 * @see https://mega-api.app.br
 * @see https://api2.megaapi.com.br/docs/
 */

import type { MoltbotPluginApi } from "clawdbot/plugin-sdk";

interface MegaAPIConfig {
  apiKey: string;
  instanceKey: string;
  webhookUrl?: string;
  webhookToken?: string;
  allowFrom?: string[];
}

const plugin = {
  id: "megaapi-whatsapp",
  name: "MegaAPI WhatsApp",
  description: "WhatsApp integration via MegaAPI",

  configSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      apiKey: { type: "string" },
      instanceKey: { type: "string" },
      webhookUrl: { type: "string" },
      webhookToken: { type: "string" },
      allowFrom: {
        type: "array",
        items: { type: "string" }
      }
    },
    required: ["apiKey", "instanceKey"]
  },

  register(api: MoltbotPluginApi) {
    console.log("[megaapi-whatsapp] Plugin registered");

    // Register webhook endpoint
    if (api.registerHook) {
      api.registerHook({
        path: "/megaapi",
        method: "POST",
        handler: async (req: any) => {
          const config = api.runtime.config.plugins?.entries?.["megaapi-whatsapp"]?.config as MegaAPIConfig;

          // Validate webhook token
          const token = req.headers["x-webhook-token"] || req.query.token;
          if (config.webhookToken && token !== config.webhookToken) {
            return { status: 401, body: { error: "Unauthorized" } };
          }

          // Check allowlist
          const from = req.body?.data?.key?.remoteJid;
          if (config.allowFrom && config.allowFrom.length > 0) {
            if (!config.allowFrom.includes(from)) {
              console.log(`[megaapi-whatsapp] Message from ${from} rejected (not in allowlist)`);
              return { status: 200, body: { status: "ignored" } };
            }
          }

          // Process incoming message
          console.log("[megaapi-whatsapp] Received message:", {
            from,
            messageId: req.body?.data?.key?.id,
            type: req.body?.data?.message?.type
          });

          // TODO: Forward to Moltbot message handling
          // This requires deeper integration with Moltbot's message router

          return { status: 200, body: { status: "ok" } };
        }
      });
    }

    // Register tool for sending messages
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
      handler: async (args: any) => {
        const config = api.runtime.config.plugins?.entries?.["megaapi-whatsapp"]?.config as MegaAPIConfig;

        if (!config.apiKey || !config.instanceKey) {
          return { error: "MegaAPI not configured. Add apiKey and instanceKey to moltbot.json" };
        }

        // Normalize phone number
        let targetJid = args.to;
        if (!targetJid.includes("@")) {
          targetJid = `${targetJid}@s.whatsapp.net`;
        }

        // Send message via MegaAPI
        const url = `https://api2.megaapi.com.br/rest/sendMessage/${config.instanceKey}/contactMessage`;

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
              "Authorization": `Bearer ${config.apiKey}`
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`MegaAPI error (${response.status}): ${errorText}`);
          }

          const result = await response.json();

          return {
            success: true,
            messageId: result.messageId,
            to: targetJid,
            message: args.message
          };
        } catch (error: any) {
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
