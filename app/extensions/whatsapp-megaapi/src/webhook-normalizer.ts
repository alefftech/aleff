/**
 * [WEBHOOK:NORMALIZER] MegaAPI Webhook Normalizer
 *
 * Converts MegaAPI-specific webhook payloads to the standard
 * NormalizedWebhookEvent format defined in whatsapp-core.
 */

import type {
  NormalizedMessage,
  NormalizedWebhookEvent,
  WebhookEventType,
  MessageAckStatus,
} from "../../whatsapp-core/src/types/webhook.js";
import type { MessageType, MediaType } from "../../whatsapp-core/src/types/messages.js";
import { logger } from "./logger.js";

// =============================================================================
// [TYPE:RAW] MegaAPI raw webhook payload
// =============================================================================

interface MegaAPIWebhookPayload {
  event?: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
        contextInfo?: {
          stanzaId?: string;
          quotedMessage?: any;
        };
      };
      imageMessage?: {
        url?: string;
        mimetype?: string;
        caption?: string;
        fileLength?: number;
      };
      audioMessage?: {
        url?: string;
        mimetype?: string;
        ptt?: boolean;
        fileLength?: number;
      };
      videoMessage?: {
        url?: string;
        mimetype?: string;
        caption?: string;
        fileLength?: number;
      };
      documentMessage?: {
        url?: string;
        mimetype?: string;
        fileName?: string;
        caption?: string;
        fileLength?: number;
      };
      stickerMessage?: {
        url?: string;
        mimetype?: string;
      };
      locationMessage?: {
        degreesLatitude?: number;
        degreesLongitude?: number;
        name?: string;
        address?: string;
      };
      contactMessage?: {
        displayName?: string;
        vcard?: string;
      };
      reactionMessage?: {
        key?: { id: string };
        text?: string;
      };
    };
    messageTimestamp?: number;
    status?: number; // For ack events
  };
}

// =============================================================================
// [FUNC:DETECT_EVENT] Detect event type from payload
// =============================================================================

function detectEventType(payload: MegaAPIWebhookPayload): WebhookEventType {
  // Explicit event field
  if (payload.event) {
    switch (payload.event) {
      case "messages.upsert":
      case "message":
        return "message";
      case "messages.update":
      case "message_ack":
        return "message_ack";
      case "messages.delete":
        return "message_revoke";
      case "presence.update":
        return "presence";
      case "groups.update":
        return "group_update";
      case "connection.update":
        return "connection";
      default:
        return "unknown";
    }
  }

  // Infer from data
  if (payload.data?.message) {
    return "message";
  }
  if (payload.data?.status !== undefined) {
    return "message_ack";
  }

  return "unknown";
}

// =============================================================================
// [FUNC:EXTRACT_MESSAGE] Extract message content
// =============================================================================

function extractMessageContent(message: MegaAPIWebhookPayload["data"]["message"]): {
  type: MessageType;
  text?: string;
  media?: NormalizedMessage["media"];
  location?: NormalizedMessage["location"];
  contact?: NormalizedMessage["contact"];
  quotedMessage?: NormalizedMessage["quotedMessage"];
} {
  if (!message) {
    return { type: "text" };
  }

  // [TYPE:TEXT] Plain text
  if (message.conversation) {
    return {
      type: "text",
      text: message.conversation,
    };
  }

  // [TYPE:EXTENDED_TEXT] Extended text (replies, links)
  if (message.extendedTextMessage) {
    const ext = message.extendedTextMessage;
    const result: ReturnType<typeof extractMessageContent> = {
      type: "text",
      text: ext.text,
    };

    // Extract quoted message if present
    if (ext.contextInfo?.stanzaId) {
      result.quotedMessage = {
        messageId: ext.contextInfo.stanzaId,
        text: ext.contextInfo.quotedMessage?.conversation,
      };
    }

    return result;
  }

  // [TYPE:IMAGE]
  if (message.imageMessage) {
    const img = message.imageMessage;
    return {
      type: "image",
      text: img.caption,
      media: {
        type: "image",
        url: img.url,
        mimeType: img.mimetype,
        fileSize: img.fileLength,
      },
    };
  }

  // [TYPE:AUDIO]
  if (message.audioMessage) {
    const audio = message.audioMessage;
    const mediaType: MediaType = audio.ptt ? "ptt" : "audio";
    return {
      type: audio.ptt ? "ptt" : "audio",
      media: {
        type: mediaType,
        url: audio.url,
        mimeType: audio.mimetype,
        fileSize: audio.fileLength,
      },
    };
  }

  // [TYPE:VIDEO]
  if (message.videoMessage) {
    const video = message.videoMessage;
    return {
      type: "video",
      text: video.caption,
      media: {
        type: "video",
        url: video.url,
        mimeType: video.mimetype,
        fileSize: video.fileLength,
      },
    };
  }

  // [TYPE:DOCUMENT]
  if (message.documentMessage) {
    const doc = message.documentMessage;
    return {
      type: "document",
      text: doc.caption,
      media: {
        type: "document",
        url: doc.url,
        mimeType: doc.mimetype,
        fileName: doc.fileName,
        fileSize: doc.fileLength,
      },
    };
  }

  // [TYPE:STICKER]
  if (message.stickerMessage) {
    const sticker = message.stickerMessage;
    return {
      type: "sticker",
      media: {
        type: "sticker",
        url: sticker.url,
        mimeType: sticker.mimetype,
      },
    };
  }

  // [TYPE:LOCATION]
  if (message.locationMessage) {
    const loc = message.locationMessage;
    return {
      type: "location",
      location: {
        latitude: loc.degreesLatitude || 0,
        longitude: loc.degreesLongitude || 0,
        name: loc.name,
        address: loc.address,
      },
    };
  }

  // [TYPE:CONTACT]
  if (message.contactMessage) {
    const contact = message.contactMessage;
    // Extract phone from vcard if available
    let phoneNumber = "";
    if (contact.vcard) {
      const telMatch = contact.vcard.match(/TEL[^:]*:([+\d]+)/i);
      if (telMatch) phoneNumber = telMatch[1];
    }

    return {
      type: "contact",
      contact: {
        name: contact.displayName || "",
        phoneNumber,
      },
    };
  }

  // [TYPE:REACTION]
  if (message.reactionMessage) {
    return {
      type: "reaction",
      text: message.reactionMessage.text,
    };
  }

  // Unknown
  return { type: "text" };
}

// =============================================================================
// [FUNC:MAP_ACK] Map MegaAPI status to standard ack
// =============================================================================

function mapAckStatus(status: number): MessageAckStatus {
  switch (status) {
    case 0:
      return "pending";
    case 1:
      return "sent";
    case 2:
      return "delivered";
    case 3:
      return "read";
    case 4:
      return "played";
    default:
      return "pending";
  }
}

// =============================================================================
// [FUNC:NORMALIZE] Main normalization function
// =============================================================================

export function normalizeMegaAPIWebhook(
  payload: MegaAPIWebhookPayload
): NormalizedWebhookEvent | null {
  const eventType = detectEventType(payload);
  const { data } = payload;

  logger.debug(
    {
      event: payload.event,
      detectedType: eventType,
      remoteJid: data.key?.remoteJid,
      fromMe: data.key?.fromMe,
    },
    "normalizing_webhook"
  );

  // [FILTER:OWN] Skip own messages
  if (data.key?.fromMe && eventType === "message") {
    logger.debug({ messageId: data.key.id }, "skipping_own_message");
    return null;
  }

  const baseEvent: NormalizedWebhookEvent = {
    type: eventType,
    timestamp: data.messageTimestamp || Date.now() / 1000,
    provider: "megaapi",
    raw: payload,
  };

  // [HANDLE:MESSAGE]
  if (eventType === "message" && data.message) {
    const content = extractMessageContent(data.message);
    const isGroup = data.key.remoteJid.includes("@g.us");

    const normalizedMessage: NormalizedMessage = {
      messageKey: {
        remoteJid: data.key.remoteJid,
        id: data.key.id,
        fromMe: data.key.fromMe,
      },
      from: data.key.remoteJid,
      fromName: data.pushName,
      type: content.type,
      text: content.text,
      media: content.media,
      location: content.location,
      contact: content.contact,
      quotedMessage: content.quotedMessage,
      timestamp: data.messageTimestamp || Date.now() / 1000,
      isGroup,
      groupId: isGroup ? data.key.remoteJid : undefined,
      channel: "whatsapp",
      raw: payload,
    };

    baseEvent.message = normalizedMessage;

    logger.info(
      {
        from: normalizedMessage.from,
        fromName: normalizedMessage.fromName,
        type: normalizedMessage.type,
        hasMedia: !!normalizedMessage.media,
        isGroup,
      },
      "message_normalized"
    );
  }

  // [HANDLE:ACK]
  if (eventType === "message_ack" && data.status !== undefined) {
    baseEvent.ack = {
      messageId: data.key.id,
      status: mapAckStatus(data.status),
    };
  }

  return baseEvent;
}

// =============================================================================
// [FUNC:VALIDATE_TOKEN] Validate webhook token
// =============================================================================

export function validateMegaAPIWebhookToken(
  token: string | undefined,
  expectedToken: string | undefined
): boolean {
  // No token configured = accept all (development mode)
  if (!expectedToken || expectedToken.trim() === "") {
    return true;
  }
  return token === expectedToken;
}

// =============================================================================
// [FUNC:IS_ALLOWED] Check allowlist
// =============================================================================

export function isAllowedSender(
  remoteJid: string,
  allowlist: string[]
): boolean {
  // Empty allowlist = public channel
  if (allowlist.length === 0) {
    return true;
  }

  // Check if JID or number is in allowlist
  const number = remoteJid.split("@")[0];
  return allowlist.some((allowed) => {
    const cleanAllowed = allowed.replace(/[^\d]/g, "");
    return number === cleanAllowed || remoteJid === allowed;
  });
}
