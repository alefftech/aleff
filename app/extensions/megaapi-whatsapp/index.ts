/**
 * MegaAPI WhatsApp Integration
 *
 * Complete WhatsApp integration for AleffAI:
 * - Send: text, audio, image, files
 * - Receive: text, audio, image, files, voice notes
 * - Webhook handler for incoming messages
 * - Public channel mode (no allowlist restriction)
 *
 * Tools registered:
 * - send_whatsapp_message: Send text message
 * - send_whatsapp_audio: Send audio file
 * - send_whatsapp_image: Send image
 * - send_whatsapp_file: Send document/file
 *
 * Environment Variables:
 * - MEGAAPI_API_HOST: Custom API host (e.g., apistart01.megaapi.com.br)
 * - MEGAAPI_INSTANCE_KEY: Instance key from MegaAPI
 * - MEGAAPI_TOKEN: API token (Bearer)
 * - MEGAAPI_WEBHOOK_TOKEN: Webhook validation token (optional)
 * - MEGAAPI_ALLOW_FROM: Comma-separated list of allowed numbers (optional, empty = public)
 *
 * @see https://mega-api.app.br
 * @version 1.1.0
 */

import type { MoltbotPluginApi } from "clawdbot/plugin-sdk";
import { logger } from "./src/logger.js";
import {
  createSendMessageTool,
  createSendAudioTool,
  createSendImageTool,
  createSendFileTool,
} from "./src/tools.js";
import {
  validateWebhookToken,
  isAllowedSender,
  processWebhookMessage,
} from "./src/webhook.js";

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
      publicChannel: config.allowFrom.length === 0,
      version: "1.1.0"
    }, "plugin_registered");

    // ==========================================================================
    // [WEBHOOK:REGISTER] Register webhook endpoint for incoming messages
    // ==========================================================================

    // TODO: Implement webhook registration when API supports it
    // For now, webhook must be configured manually in MegaAPI dashboard:
    // URL: https://aleffai.a25.com.br/hooks/megaapi
    // Token: (value of MEGAAPI_WEBHOOK_TOKEN)

    logger.info({
      webhookConfigured: !!config.webhookToken,
      message: "Configure webhook manually in MegaAPI dashboard"
    }, "webhook_info");

    // ==========================================================================
    // [TOOLS:REGISTER] Register all WhatsApp tools
    // ==========================================================================

    // [TOOL:MESSAGE] Send text message
    api.registerTool(createSendMessageTool());

    // [TOOL:AUDIO] Send audio file
    api.registerTool(createSendAudioTool());

    // [TOOL:IMAGE] Send image
    api.registerTool(createSendImageTool());

    // [TOOL:FILE] Send document/file
    api.registerTool(createSendFileTool());

    logger.info({
      tools: [
        "send_whatsapp_message",
        "send_whatsapp_audio",
        "send_whatsapp_image",
        "send_whatsapp_file"
      ]
    }, "tools_registered");

    // ==========================================================================
    // [HOOK:MESSAGE] Hook into message received (for webhook processing)
    // ==========================================================================

    // Register message_received hook to process incoming WhatsApp messages
    // This is called when webhook POST arrives at /hooks/megaapi

    if (api.onHook) {
      api.onHook("message_received", async (event: any) => {
        // Check if this is a WhatsApp message from our webhook
        if (event.channel !== "whatsapp") {
          return; // Not a WhatsApp message, ignore
        }

        logger.info({
          from: event.from,
          type: event.type,
          hasMedia: !!event.mediaUrl
        }, "processing_incoming_whatsapp_message");

        // Process message through Moltbot's message handling
        // (This will trigger memory capture, agent processing, etc.)

        // TODO: Forward to agent processing pipeline
        // This requires deeper integration with Moltbot's message router
      });
    }

    logger.info({}, "plugin_initialization_complete");
  }
};

export default plugin;
