/**
 * [OUTBOUND:MEGAAPI] WhatsApp Outbound via MegaAPI
 *
 * Implements ChannelOutboundAdapter for direct mode delivery.
 * This replaces the bundled WhatsApp gateway-based outbound with
 * MegaAPI HTTP API calls.
 */

import type { ChannelOutboundAdapter } from "../../../../src/channels/plugins/types.adapters.js";
import { getWhatsAppClient } from "../../whatsapp-core/index.js";
import { logger } from "./logger.js";

// =============================================================================
// [UTIL:NORMALIZE] JID normalization
// =============================================================================

/**
 * Normalize E.164 or raw number to full WhatsApp JID format.
 * - Already a JID → return as-is
 * - E.164 format → convert to JID
 * - Invalid → return null
 */
function normalizeWhatsAppJid(target: string): string | null {
  if (!target) return null;

  const trimmed = target.trim();

  // Already a JID (individual or group)
  if (trimmed.includes("@")) {
    return trimmed;
  }

  // E.164 format - convert to individual JID
  const cleaned = trimmed.replace(/\D/g, "");
  if (cleaned.length >= 10 && cleaned.length <= 15) {
    return `${cleaned}@s.whatsapp.net`;
  }

  return null;
}

// =============================================================================
// [UTIL:MEDIA] Media type detection
// =============================================================================

/**
 * Detect media type from URL extension.
 */
function detectMediaType(url: string): "image" | "audio" | "video" | "document" {
  const lower = url.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp)(\?|$)/.test(lower)) return "image";
  if (/\.(mp3|ogg|opus|wav|m4a|aac)(\?|$)/.test(lower)) return "audio";
  if (/\.(mp4|mov|avi|mkv|webm|3gp)(\?|$)/.test(lower)) return "video";
  return "document";
}

// =============================================================================
// [UTIL:CHUNKER] Text chunking for long messages
// =============================================================================

/**
 * Simple text chunker that splits at word boundaries.
 * WhatsApp has ~65k limit but we use 4000 for readability.
 */
function chunkText(text: string, limit: number): string[] {
  if (text.length <= limit) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= limit) {
      chunks.push(remaining);
      break;
    }

    // Find last space before limit for clean break
    let splitAt = remaining.lastIndexOf(" ", limit);
    if (splitAt === -1 || splitAt < limit * 0.5) {
      // No good break point, force split
      splitAt = limit;
    }

    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trim();
  }

  return chunks;
}

// =============================================================================
// [ADAPTER:OUTBOUND] MegaAPI Outbound Adapter
// =============================================================================

export const megaapiOutbound: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  chunker: chunkText,
  chunkerMode: "text",
  textChunkLimit: 4000,
  pollMaxOptions: 12,

  // ===========================================================================
  // [METHOD:RESOLVE_TARGET] Validate and normalize recipient
  // ===========================================================================

  resolveTarget: ({ to, allowFrom, mode }) => {
    const trimmed = to?.trim() ?? "";

    // Build allowlist for fallback
    const allowListRaw = (allowFrom ?? [])
      .map((entry) => String(entry).trim())
      .filter(Boolean);
    const allowList = allowListRaw
      .filter((entry) => entry !== "*")
      .map((entry) => normalizeWhatsAppJid(entry))
      .filter((entry): entry is string => Boolean(entry));

    // Try to normalize provided target
    if (trimmed) {
      const normalized = normalizeWhatsAppJid(trimmed);
      if (normalized) {
        return { ok: true, to: normalized };
      }

      // Invalid target but have allowlist fallback
      if ((mode === "implicit" || mode === "heartbeat") && allowList.length > 0) {
        return { ok: true, to: allowList[0] };
      }

      return {
        ok: false,
        error: new Error(
          `Invalid WhatsApp target "${trimmed}". Use E.164 format (e.g., 5511999999999) or JID (e.g., 5511999999999@s.whatsapp.net).`
        ),
      };
    }

    // No target provided - try allowlist
    if (allowList.length > 0) {
      return { ok: true, to: allowList[0] };
    }

    return {
      ok: false,
      error: new Error(
        "Missing WhatsApp target. Provide E.164 number, JID, or configure channels.whatsapp.allowFrom."
      ),
    };
  },

  // ===========================================================================
  // [METHOD:SEND_TEXT] Send text message via MegaAPI
  // ===========================================================================

  sendText: async ({ to, text, replyToId }) => {
    const client = getWhatsAppClient();

    logger.info(
      { to, textLength: text.length, hasReplyTo: !!replyToId },
      "outbound_send_text"
    );

    try {
      const result = await client.messages.sendText(to, text, {
        quotedMessageId: replyToId ?? undefined,
      });

      if (!result.success) {
        logger.error({ to, error: result.error }, "outbound_send_text_failed");
        return {
          channel: "whatsapp",
          sent: false,
          error: result.error || "Failed to send message",
        };
      }

      logger.info(
        { to, messageId: result.messageId },
        "outbound_send_text_success"
      );

      return {
        channel: "whatsapp",
        sent: true,
        messageId: result.messageId,
        chatId: to,
      };
    } catch (error: any) {
      logger.error(
        { to, error: error.message, stack: error.stack },
        "outbound_send_text_exception"
      );
      return {
        channel: "whatsapp",
        sent: false,
        error: error.message,
      };
    }
  },

  // ===========================================================================
  // [METHOD:SEND_MEDIA] Send media message via MegaAPI
  // ===========================================================================

  sendMedia: async ({ to, text, mediaUrl, replyToId }) => {
    const client = getWhatsAppClient();
    const mediaType = detectMediaType(mediaUrl ?? "");

    logger.info(
      { to, mediaUrl, mediaType, hasCaption: !!text },
      "outbound_send_media"
    );

    try {
      const result = await client.messages.sendMediaUrl(
        to,
        mediaUrl ?? "",
        mediaType,
        {
          caption: text || undefined,
          quotedMessageId: replyToId ?? undefined,
        }
      );

      if (!result.success) {
        logger.error({ to, error: result.error }, "outbound_send_media_failed");
        return {
          channel: "whatsapp",
          sent: false,
          error: result.error || "Failed to send media",
        };
      }

      logger.info(
        { to, messageId: result.messageId, mediaType },
        "outbound_send_media_success"
      );

      return {
        channel: "whatsapp",
        sent: true,
        messageId: result.messageId,
        chatId: to,
      };
    } catch (error: any) {
      logger.error(
        { to, mediaType, error: error.message, stack: error.stack },
        "outbound_send_media_exception"
      );
      return {
        channel: "whatsapp",
        sent: false,
        error: error.message,
      };
    }
  },
};
