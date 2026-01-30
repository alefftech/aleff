/**
 * [PLUGIN:WHATSAPP-MEGAAPI] MegaAPI Provider Adapter
 *
 * Implements WhatsAppProvider interface for MegaAPI Starter.
 * Registers the "megaapi" provider with whatsapp-core.
 *
 * Environment Variables:
 * - MEGAAPI_API_HOST: API host (default: apistart01.megaapi.com.br)
 * - MEGAAPI_INSTANCE_KEY: Instance key
 * - MEGAAPI_TOKEN: API token (Bearer)
 * - MEGAAPI_WEBHOOK_TOKEN: Webhook validation token (optional)
 * - MEGAAPI_ALLOW_FROM: Comma-separated allowlist (optional, empty = public)
 *
 * @version 1.0.0
 */

import type { MoltbotPluginApi } from "clawdbot/plugin-sdk";
import { logger } from "./src/logger.js";
import { createMegaAPIProvider } from "./src/adapter.js";
import {
  normalizeMegaAPIWebhook,
  validateMegaAPIWebhookToken,
  isAllowedSender,
} from "./src/webhook-normalizer.js";

// Import from whatsapp-core (sibling plugin)
import { getWhatsAppClient } from "../whatsapp-core/index.js";

// =============================================================================
// [CONFIG:ENV] Read configuration from environment
// =============================================================================

function getConfig() {
  return {
    apiHost: process.env.MEGAAPI_API_HOST || "apistart01.megaapi.com.br",
    instanceKey: process.env.MEGAAPI_INSTANCE_KEY || "",
    apiToken: process.env.MEGAAPI_TOKEN || "",
    webhookToken: process.env.MEGAAPI_WEBHOOK_TOKEN || "",
    allowFrom: process.env.MEGAAPI_ALLOW_FROM
      ? process.env.MEGAAPI_ALLOW_FROM.split(",").map((n) => n.trim())
      : [],
  };
}

// =============================================================================
// [PLUGIN:DEFINITION]
// =============================================================================

const plugin = {
  id: "whatsapp-megaapi",
  name: "WhatsApp MegaAPI",
  description: "MegaAPI Starter adapter for WhatsApp provider abstraction",

  register(api: MoltbotPluginApi) {
    const config = getConfig();

    // [VALIDATION:CONFIG] Check required config
    if (!config.apiToken || !config.instanceKey) {
      logger.warn(
        {
          hasToken: !!config.apiToken,
          hasInstanceKey: !!config.instanceKey,
        },
        "megaapi_not_configured"
      );
      // Don't throw - plugin can still be loaded, just won't work
      return;
    }

    // [REGISTER:PROVIDER] Register with whatsapp-core
    const client = getWhatsAppClient();
    client.registerProvider("megaapi", createMegaAPIProvider);

    // [ACTIVATE:PROVIDER] Activate this provider
    client.useProvider("megaapi", {
      apiHost: config.apiHost,
      instanceKey: config.instanceKey,
      apiToken: config.apiToken,
      webhookToken: config.webhookToken,
    });

    logger.info(
      {
        apiHost: config.apiHost,
        instanceKey: config.instanceKey,
        allowlistSize: config.allowFrom.length,
        publicChannel: config.allowFrom.length === 0,
        version: "1.0.0",
      },
      "plugin_registered"
    );

    // [INFO:WEBHOOK] Log webhook configuration info
    logger.info(
      {
        webhookConfigured: !!config.webhookToken,
        message: "Configure webhook in MegaAPI dashboard: https://your-domain/hooks/megaapi",
      },
      "webhook_info"
    );

    // [HOOK:MESSAGE] Hook into message_received for webhook processing
    if (api.onHook) {
      api.onHook("webhook_received", async (event: any) => {
        // Check if this is for us
        if (event.hookId !== "megaapi") {
          return;
        }

        // [SECURITY:TOKEN] Validate webhook token
        if (!validateMegaAPIWebhookToken(event.token, config.webhookToken)) {
          logger.warn({}, "webhook_unauthorized");
          return { status: 401, body: { error: "Unauthorized" } };
        }

        // [NORMALIZE:PAYLOAD] Normalize the webhook payload
        const normalized = normalizeMegaAPIWebhook(event.payload);
        if (!normalized) {
          return { status: 200, body: { status: "ignored" } };
        }

        // [SECURITY:ALLOWLIST] Check allowlist for messages
        if (normalized.message) {
          if (!isAllowedSender(normalized.message.from, config.allowFrom)) {
            logger.info(
              { from: normalized.message.from },
              "message_rejected_allowlist"
            );
            return { status: 200, body: { status: "rejected_allowlist" } };
          }
        }

        // [EMIT:EVENT] Emit normalized event for further processing
        if (api.emit) {
          await api.emit("whatsapp:message", normalized);
        }

        logger.info(
          {
            type: normalized.type,
            from: normalized.message?.from,
          },
          "webhook_processed"
        );

        return { status: 200, body: { status: "ok" } };
      });
    }
  },
};

export default plugin;

// [EXPORT:PUBLIC] Re-export for direct imports
export { createMegaAPIProvider } from "./src/adapter.js";
export { MegaAPIClient } from "./src/api.js";
export {
  normalizeMegaAPIWebhook,
  validateMegaAPIWebhookToken,
  isAllowedSender,
} from "./src/webhook-normalizer.js";
