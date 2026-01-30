/**
 * [PLUGIN:WHATSAPP-MEGAAPI] MegaAPI Provider Adapter
 *
 * Implements WhatsAppProvider interface for MegaAPI Starter.
 * Registers the "megaapi" provider with whatsapp-core.
 * Registers "whatsapp" channel with direct delivery mode.
 *
 * Environment Variables:
 * - MEGAAPI_API_HOST: API host (default: apistart01.megaapi.com.br)
 * - MEGAAPI_INSTANCE_KEY: Instance key
 * - MEGAAPI_TOKEN: API token (Bearer)
 * - MEGAAPI_WEBHOOK_TOKEN: Webhook validation token (optional)
 * - MEGAAPI_ALLOW_FROM: Comma-separated allowlist (optional, empty = public)
 *
 * @version 1.1.0
 */

import type { MoltbotPluginApi } from "clawdbot/plugin-sdk";
import { logger } from "./src/logger.js";
import { createMegaAPIProvider } from "./src/adapter.js";
import { whatsappMegaapiChannel } from "./src/channel.js";
import { setMegaAPIRuntime } from "./src/runtime.js";
import {
  handleMegaAPIWebhookRequest,
  getMegaAPIWebhookPath,
  getMegaAPIWebhookPaths,
} from "./src/webhook-handler.js";

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

    // [RUNTIME:SET] Store runtime reference for monitor module
    setMegaAPIRuntime(api.runtime);

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
        version: "1.1.0",
      },
      "provider_registered"
    );

    // [CHANNEL:OUTBOUND] Register WhatsApp channel with direct delivery
    // This OVERRIDES the bundled gateway-based whatsapp channel
    api.registerChannel({ plugin: whatsappMegaapiChannel });

    logger.info(
      {
        channelId: whatsappMegaapiChannel.id,
        deliveryMode: "direct",
        note: "Overrides bundled gateway-based whatsapp channel",
      },
      "channel_registered"
    );

    // [REGISTER:HTTP] Register HTTP handler for webhooks
    // This routes incoming webhooks through the dispatch pipeline so all hooks
    // (message_received, before_agent_dispatch, message_sent) fire correctly.
    api.registerHttpHandler(handleMegaAPIWebhookRequest);

    const webhookPaths = getMegaAPIWebhookPaths();
    logger.info(
      {
        webhookPaths,
        webhookConfigured: !!config.webhookToken,
        message: `Configure webhook in MegaAPI dashboard: https://your-domain${webhookPaths[0]}`,
      },
      "webhook_handler_registered"
    );
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
export { whatsappMegaapiChannel } from "./src/channel.js";
export { megaapiOutbound } from "./src/outbound.js";
