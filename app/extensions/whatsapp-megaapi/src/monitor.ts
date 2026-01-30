/**
 * [MONITOR:INBOUND] Process inbound WhatsApp messages from MegaAPI
 *
 * Routes messages through the dispatch pipeline so hooks fire correctly.
 * This follows the same pattern as bluebubbles/src/monitor.ts.
 *
 * The key insight is that api.emit("whatsapp:message") has no listeners,
 * so messages were being lost. This module routes messages through
 * dispatchReplyWithBufferedBlockDispatcher, which fires all the hooks
 * (message_received, before_agent_dispatch, message_sent) correctly.
 */

import type { NormalizedWebhookEvent } from "../../whatsapp-core/src/types/webhook.js";
import { getMegaAPIRuntime } from "./runtime.js";
import { getWhatsAppClient } from "../../whatsapp-core/index.js";
import { logger } from "./logger.js";

// =============================================================================
// [CONFIG:ENV] Read configuration from environment
// =============================================================================

function getEnvConfig() {
  return {
    apiHost: process.env.MEGAAPI_API_HOST || "apistart01.megaapi.com.br",
    instanceKey: process.env.MEGAAPI_INSTANCE_KEY || "",
    apiToken: process.env.MEGAAPI_TOKEN || "",
  };
}

// =============================================================================
// [UTIL:JID] JID normalization utilities
// =============================================================================

/**
 * Normalize JID to target format for outbound messages.
 */
function normalizeOutboundTarget(jid: string): string {
  return jid; // Already in correct format from webhook
}

/**
 * Extract display number from JID (e.g., "5511999999999@s.whatsapp.net" → "5511999999999")
 */
function extractNumberFromJid(jid: string): string {
  return jid.split("@")[0] || jid;
}

// =============================================================================
// [MONITOR:PROCESS] Process inbound message through dispatch pipeline
// =============================================================================

export interface ProcessInboundOptions {
  accountId?: string;
}

/**
 * Process an inbound WhatsApp message through the full dispatch pipeline.
 *
 * This is the key function that routes messages through:
 * 1. message_received hook
 * 2. before_agent_dispatch hook (where supervisor can intercept)
 * 3. Agent processing
 * 4. message_sent hook
 *
 * Without this, messages emitted via api.emit("whatsapp:message") go nowhere.
 */
export async function processInboundMessage(
  normalized: NormalizedWebhookEvent,
  options?: ProcessInboundOptions
): Promise<void> {
  const core = getMegaAPIRuntime();
  const megaConfig = getEnvConfig();

  // [CONFIG:LOAD] Load moltbot config from runtime
  const config = core.config.loadConfig();

  // [VALIDATE:MESSAGE] Only process message events with content
  if (normalized.type !== "message" || !normalized.message) {
    logger.debug({ type: normalized.type }, "monitor_skip_non_message");
    return;
  }

  const message = normalized.message;

  logger.info(
    {
      from: message.from,
      fromName: message.fromName,
      messageId: message.messageKey.id,
      type: message.type,
      isGroup: message.isGroup,
      contentLength: message.text?.length ?? 0,
    },
    "monitor_processing_inbound"
  );

  // [ROUTE:RESOLVE] Resolve agent route for this message
  const effectiveAccountId = options?.accountId || `megaapi_${megaConfig.instanceKey || "default"}`;
  const route = core.channel.routing.resolveAgentRoute({
    cfg: config,
    channel: "whatsapp",
    from: message.from,
    to: effectiveAccountId,
    accountId: effectiveAccountId,
  });

  if (!route) {
    logger.warn({ from: message.from }, "monitor_no_route");
    return;
  }

  // [BUILD:CONTEXT] Build FinalizedMsgContext for dispatch
  const body = message.text || "";
  const rawBody = body;
  const outboundTarget = normalizeOutboundTarget(message.from);
  const fromLabel = message.fromName || extractNumberFromJid(message.from);

  // Build media arrays if present
  const mediaUrls: string[] = [];
  const mediaPaths: string[] = [];
  const mediaTypes: string[] = [];

  if (message.media?.url) {
    mediaUrls.push(message.media.url);
    mediaTypes.push(message.media.mimeType || message.media.type || "application/octet-stream");
  }

  // [CTX:PAYLOAD] Build context payload matching FinalizedMsgContext shape
  const ctxPayload = {
    Body: body,
    BodyForAgent: body,
    RawBody: rawBody,
    CommandBody: rawBody,
    BodyForCommands: rawBody,
    MediaUrl: mediaUrls[0],
    MediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
    MediaPath: mediaPaths[0],
    MediaPaths: mediaPaths.length > 0 ? mediaPaths : undefined,
    MediaType: mediaTypes[0],
    MediaTypes: mediaTypes.length > 0 ? mediaTypes : undefined,
    From: message.from,
    To: `whatsapp:${outboundTarget}`,
    SessionKey: route.sessionKey,
    AccountId: effectiveAccountId,
    ChatType: message.isGroup ? "group" : "direct",
    ConversationLabel: fromLabel,
    // Reply context if present
    ReplyToId: message.quotedMessage?.messageId,
    ReplyToBody: message.quotedMessage?.text,
    // Group info
    GroupSubject: message.isGroup ? message.groupId : undefined,
    // Sender info
    SenderName: message.fromName || undefined,
    SenderId: extractNumberFromJid(message.from),
    SenderE164: extractNumberFromJid(message.from),
    // Channel info
    Provider: "whatsapp",
    Surface: "whatsapp",
    // Message IDs
    MessageSid: message.messageKey.id,
    MessageSidFull: message.messageKey.id,
    Timestamp: message.timestamp * 1000, // Convert to ms
    // Routing hints for reply delivery
    OriginatingChannel: "whatsapp",
    OriginatingTo: outboundTarget,
    // Command authorization (resolved by dispatch pipeline)
    CommandAuthorized: false,
  };

  // [DISPATCH:PIPELINE] Route through dispatch pipeline with buffered dispatcher
  try {
    await core.channel.reply.dispatchReplyWithBufferedBlockDispatcher({
      ctx: ctxPayload,
      cfg: config,
      dispatcherOptions: {
        deliver: async (payload) => {
          // [DELIVER:TEXT] Handle text replies
          const client = getWhatsAppClient();
          const text = payload.text || "";

          if (payload.mediaUrl || payload.mediaUrls?.length) {
            // [DELIVER:MEDIA] Send media with optional caption
            const mediaList = payload.mediaUrls?.length
              ? payload.mediaUrls
              : payload.mediaUrl
                ? [payload.mediaUrl]
                : [];

            for (let i = 0; i < mediaList.length; i++) {
              const mediaUrl = mediaList[i];
              const caption = i === 0 ? text : undefined;

              // Detect media type from URL
              const mediaType = detectMediaType(mediaUrl);

              const result = await client.messages.sendMediaUrl(
                outboundTarget,
                mediaUrl,
                mediaType,
                { caption }
              );

              if (!result.success) {
                logger.error(
                  { to: outboundTarget, error: result.error },
                  "monitor_media_send_failed"
                );
              } else {
                logger.info(
                  { to: outboundTarget, messageId: result.messageId, mediaType },
                  "monitor_media_sent"
                );
              }
            }
            return;
          }

          // [DELIVER:TEXT_ONLY] Send text-only message
          if (text) {
            const result = await client.messages.sendText(outboundTarget, text);

            if (!result.success) {
              logger.error(
                { to: outboundTarget, error: result.error },
                "monitor_text_send_failed"
              );
            } else {
              logger.info(
                { to: outboundTarget, messageId: result.messageId },
                "monitor_text_sent"
              );
            }
          }
        },
      },
    });

    logger.info(
      {
        from: message.from,
        messageId: message.messageKey.id,
      },
      "monitor_dispatch_complete"
    );
  } catch (error: any) {
    logger.error(
      {
        from: message.from,
        messageId: message.messageKey.id,
        error: error.message,
        stack: error.stack,
      },
      "monitor_dispatch_failed"
    );
    throw error;
  }
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
