/**
 * [PLUGIN:WHATSAPP-CORE] WhatsApp Core Plugin
 *
 * Provider-agnostic abstraction layer for WhatsApp integrations.
 * This plugin provides:
 * - Type definitions for any WhatsApp provider
 * - Client singleton for cross-plugin access
 * - Presence manager for typing indicators
 *
 * Does NOT register any tools - that's done by whatsapp-tools plugin.
 * Does NOT implement any provider - that's done by adapter plugins.
 *
 * @version 1.0.0
 */

import type { MoltbotPluginApi } from "clawdbot/plugin-sdk";
import { logger } from "./src/logger.js";
import { getWhatsAppClient } from "./src/client/singleton.js";

const plugin = {
  id: "whatsapp-core",
  name: "WhatsApp Core",
  description: "Provider-agnostic WhatsApp abstraction layer",

  register(api: MoltbotPluginApi) {
    // [INIT:CLIENT] Initialize client singleton
    const client = getWhatsAppClient();

    logger.info(
      {
        registeredProviders: client.listProviders(),
        version: "1.0.0",
      },
      "plugin_registered"
    );

    // [NOTE] This plugin only sets up infrastructure.
    // Actual provider registration happens when adapter plugins load.
    // Tool registration happens when whatsapp-tools plugin loads.
  },
};

export default plugin;

// [EXPORT:PUBLIC] Re-export public API for other plugins
export * from "./src/index.js";
