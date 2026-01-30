/**
 * [CHANNEL:MEGAAPI] WhatsApp Channel Plugin for MegaAPI
 *
 * Minimal channel plugin that registers "whatsapp" channel with
 * direct delivery mode using MegaAPI HTTP API.
 *
 * This OVERRIDES the bundled WhatsApp gateway-based channel,
 * enabling outbound replies via MegaAPI instead of WhatsApp Web.
 */

import type { ChannelPlugin } from "../../../../src/channels/plugins/types.plugin.js";
import { getChatChannelMeta } from "../../../../src/channels/registry.js";
import { megaapiOutbound } from "./outbound.js";
import { logger } from "./logger.js";

// =============================================================================
// [META:CHANNEL] Channel metadata - use existing WhatsApp meta + override
// =============================================================================

// Get base WhatsApp meta from registry (has all required fields)
const baseMeta = getChatChannelMeta("whatsapp");

// Override with MegaAPI-specific details
const channelMeta = {
  ...baseMeta,
  selectionLabel: "WhatsApp (MegaAPI)",
  detailLabel: "WhatsApp MegaAPI",
  blurb: "WhatsApp via MegaAPI HTTP API (no WhatsApp Web QR needed).",
};

// =============================================================================
// [CAPABILITIES:CHANNEL] What this channel supports
// =============================================================================

const channelCapabilities = {
  chatTypes: ["direct", "group"] as const,
  media: true,
  polls: true,
  reactions: false, // MegaAPI Starter doesn't support reactions
  threads: false,
  nativeCommands: false,
};

// =============================================================================
// [CONFIG:ADAPTER] Minimal config adapter
// =============================================================================

/**
 * Minimal config adapter - we use env vars, not moltbot.json.
 * Returns a single "default" account that's always enabled.
 */
const configAdapter = {
  listAccountIds: (): string[] => {
    // Check if MegaAPI is configured
    const hasConfig = !!(
      process.env.MEGAAPI_TOKEN && process.env.MEGAAPI_INSTANCE_KEY
    );
    return hasConfig ? ["default"] : [];
  },

  resolveAccount: (
    _cfg: any,
    accountId?: string | null
  ): { accountId: string; enabled: boolean } | null => {
    const hasConfig = !!(
      process.env.MEGAAPI_TOKEN && process.env.MEGAAPI_INSTANCE_KEY
    );

    if (!hasConfig) {
      return null;
    }

    return {
      accountId: accountId || "default",
      enabled: true,
    };
  },

  isConfigured: (): boolean => {
    return !!(process.env.MEGAAPI_TOKEN && process.env.MEGAAPI_INSTANCE_KEY);
  },
};

// =============================================================================
// [PAIRING:ADAPTER] Allow-list normalization for /approve command
// =============================================================================

const pairingAdapter = {
  idLabel: "whatsappNumber",

  /**
   * Normalize allowFrom entries to consistent JID format.
   * Accepts: E.164 numbers, JIDs, or raw phone numbers.
   */
  normalizeAllowEntry: (entry: string): string => {
    const trimmed = entry.trim();

    // Already a JID
    if (trimmed.includes("@")) {
      return trimmed;
    }

    // Clean to digits only
    const cleaned = trimmed.replace(/\D/g, "");
    if (cleaned.length >= 10 && cleaned.length <= 15) {
      return `${cleaned}@s.whatsapp.net`;
    }

    // Return as-is if can't normalize (will fail validation elsewhere)
    return trimmed;
  },
};

// =============================================================================
// [PLUGIN:CHANNEL] Channel plugin definition
// =============================================================================

export const whatsappMegaapiChannel: ChannelPlugin = {
  id: "whatsapp",
  meta: channelMeta,
  capabilities: channelCapabilities,
  config: configAdapter,
  pairing: pairingAdapter,
  outbound: megaapiOutbound,

  // No gateway adapter - we use direct mode
  // No setup adapter - configuration via env vars
  // No security adapter - use default behavior
  // No status adapter - could add health check later
};

// =============================================================================
// [EXPORT:LOG] Log channel definition for debugging
// =============================================================================

logger.debug(
  {
    channelId: whatsappMegaapiChannel.id,
    deliveryMode: megaapiOutbound.deliveryMode,
    capabilities: channelCapabilities,
  },
  "channel_defined"
);
