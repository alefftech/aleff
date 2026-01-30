/**
 * [WEBHOOK:HANDLER] MegaAPI Webhook Handler
 *
 * Processes incoming WhatsApp messages:
 * - Text messages
 * - Audio messages
 * - Images
 * - Documents/files
 * - Voice notes
 */

import { logger } from "./logger.js";

// [TYPE:WEBHOOK] Webhook payload structure
interface WebhookMessage {
  data: {
    key: {
      remoteJid: string; // Sender number (5511999999999@s.whatsapp.net)
      fromMe: boolean;
      id: string; // Message ID
    };
    message: {
      conversation?: string; // Text message
      extendedTextMessage?: {
        text: string;
      };
      imageMessage?: {
        url: string;
        mimetype: string;
        caption?: string;
      };
      audioMessage?: {
        url: string;
        mimetype: string;
        ptt?: boolean; // Push-to-talk (voice note)
      };
      documentMessage?: {
        url: string;
        mimetype: string;
        fileName?: string;
        caption?: string;
      };
      videoMessage?: {
        url: string;
        mimetype: string;
        caption?: string;
      };
    };
    messageTimestamp: number;
  };
}

// [FUNC:EXTRACT] Extract message content and type
function extractMessageContent(msg: WebhookMessage) {
  const message = msg.data.message;

  // [TYPE:TEXT] Text message
  if (message.conversation) {
    return {
      type: "text",
      text: message.conversation,
      content: message.conversation
    };
  }

  // [TYPE:EXTENDED_TEXT] Extended text (reply, link preview, etc)
  if (message.extendedTextMessage) {
    return {
      type: "text",
      text: message.extendedTextMessage.text,
      content: message.extendedTextMessage.text
    };
  }

  // [TYPE:IMAGE] Image message
  if (message.imageMessage) {
    return {
      type: "image",
      url: message.imageMessage.url,
      mimetype: message.imageMessage.mimetype,
      caption: message.imageMessage.caption,
      content: message.imageMessage.caption || "[Imagem]"
    };
  }

  // [TYPE:AUDIO] Audio message
  if (message.audioMessage) {
    return {
      type: message.audioMessage.ptt ? "voice_note" : "audio",
      url: message.audioMessage.url,
      mimetype: message.audioMessage.mimetype,
      content: message.audioMessage.ptt ? "[Áudio]" : "[Arquivo de áudio]"
    };
  }

  // [TYPE:DOCUMENT] Document/file message
  if (message.documentMessage) {
    return {
      type: "document",
      url: message.documentMessage.url,
      mimetype: message.documentMessage.mimetype,
      fileName: message.documentMessage.fileName,
      caption: message.documentMessage.caption,
      content: `[Arquivo: ${message.documentMessage.fileName || "documento"}]`
    };
  }

  // [TYPE:VIDEO] Video message
  if (message.videoMessage) {
    return {
      type: "video",
      url: message.videoMessage.url,
      mimetype: message.videoMessage.mimetype,
      caption: message.videoMessage.caption,
      content: message.videoMessage.caption || "[Vídeo]"
    };
  }

  // [TYPE:UNKNOWN] Unknown message type
  return {
    type: "unknown",
    content: "[Tipo de mensagem não suportado]"
  };
}

// [FUNC:VALIDATE] Validate webhook token
export function validateWebhookToken(token: string | undefined): boolean {
  const webhookToken = process.env.MEGAAPI_WEBHOOK_TOKEN;

  if (!webhookToken) {
    // No token configured = accept all (development mode)
    return true;
  }

  return token === webhookToken;
}

// [FUNC:CHECK_ALLOWLIST] Check if sender is in allowlist
export function isAllowedSender(remoteJid: string): boolean {
  const allowFrom = process.env.MEGAAPI_ALLOW_FROM;

  // No allowlist = public channel (accept all)
  if (!allowFrom || allowFrom.trim() === "") {
    return true;
  }

  const allowlist = allowFrom.split(",").map(n => n.trim());
  return allowlist.includes(remoteJid);
}

// [FUNC:PROCESS] Process incoming webhook message
export function processWebhookMessage(payload: WebhookMessage) {
  const { data } = payload;

  // [FILTER:OWN] Ignore messages from me
  if (data.key.fromMe) {
    logger.info({ messageId: data.key.id }, "webhook_ignored_own_message");
    return null;
  }

  // [EXTRACT:CONTENT] Extract message content
  const content = extractMessageContent(payload);

  // [SECURITY:ALLOWLIST] Check allowlist
  if (!isAllowedSender(data.key.remoteJid)) {
    logger.info({
      from: data.key.remoteJid,
      type: content.type
    }, "webhook_message_rejected_allowlist");
    return null;
  }

  // [LOG:RECEIVED] Log received message
  logger.info({
    from: data.key.remoteJid,
    messageId: data.key.id,
    type: content.type,
    hasMedia: !!(content as any).url,
    timestamp: data.messageTimestamp
  }, "webhook_message_received");

  // [RETURN:PROCESSED] Return processed message
  return {
    from: data.key.remoteJid,
    messageId: data.key.id,
    type: content.type,
    content: content.content,
    text: (content as any).text,
    mediaUrl: (content as any).url,
    mimetype: (content as any).mimetype,
    fileName: (content as any).fileName,
    caption: (content as any).caption,
    timestamp: data.messageTimestamp,
    channel: "whatsapp" as const
  };
}
