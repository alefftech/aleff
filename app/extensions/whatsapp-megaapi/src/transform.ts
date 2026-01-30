/**
 * [TRANSFORM:MEGAAPI] WhatsApp Webhook Transform (Standalone)
 *
 * Hook transform que processa webhooks do MegaAPI e normaliza para o moltbot.
 * Auto-contido - não depende de imports externos.
 *
 * Suporta:
 * - Texto (conversation, extendedTextMessage)
 * - Imagem (imageMessage)
 * - Áudio/Voice Note (audioMessage)
 * - Vídeo (videoMessage)
 * - Documento (documentMessage)
 * - Sticker, Location, Contact
 */

// =============================================================================
// [CONFIG:ENV] Configuration from environment
// =============================================================================

const MEGAAPI_HOST = process.env.MEGAAPI_API_HOST || "apistart01.megaapi.com.br";
const MEGAAPI_TOKEN = process.env.MEGAAPI_TOKEN || "";
const MEGAAPI_INSTANCE = process.env.MEGAAPI_INSTANCE_KEY || "";

// =============================================================================
// [TYPE:PAYLOAD] MegaAPI Webhook Payload
// =============================================================================

interface MegaAPIWebhookPayload {
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: { text: string };
      imageMessage?: MediaMessageData & { caption?: string };
      audioMessage?: MediaMessageData & { ptt?: boolean };
      videoMessage?: MediaMessageData & { caption?: string };
      documentMessage?: MediaMessageData & { fileName?: string; caption?: string };
      stickerMessage?: MediaMessageData;
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
    };
    messageTimestamp?: number;
  };
}

interface MediaMessageData {
  url?: string;
  directPath?: string;
  mediaKey?: string;
  mimetype?: string;
  fileLength?: number;
}

// =============================================================================
// [TYPE:CONTEXT] Hook Mapping Context (from moltbot)
// =============================================================================

interface HookMappingContext {
  payload: Record<string, unknown>;
  headers: Record<string, string>;
  url: URL;
  path: string;
}

// =============================================================================
// [TYPE:RESULT] Transform Result
// =============================================================================

interface TransformResult {
  message: string;
  name?: string;
  sessionKey?: string;
  wakeMode?: "now" | "next-heartbeat";
  channel?: {
    kind: string;
    media?: {
      type: string;
      url?: string;
      base64?: string;
      mimetype?: string;
      fileName?: string;
      ptt?: boolean;
    };
  };
  allowUnsafeExternalContent?: boolean;
}

// =============================================================================
// [FUNC:LOG] Simple logging
// =============================================================================

function log(level: string, data: Record<string, unknown>, msg: string) {
  const entry = {
    level,
    time: Date.now(),
    name: "whatsapp-transform",
    ...data,
    msg,
  };
  console.log(JSON.stringify(entry));
}

// =============================================================================
// [FUNC:DOWNLOAD] Download media from MegaAPI
// =============================================================================

async function downloadMedia(
  mediaData: MediaMessageData,
  messageType: string
): Promise<{ url?: string; base64?: string; error?: string }> {
  // Se já tem URL HTTP direta, usa ela
  if (mediaData.url && mediaData.url.startsWith("http")) {
    log("debug", { url: mediaData.url }, "using_direct_url");
    return { url: mediaData.url };
  }

  // Verifica config
  if (!MEGAAPI_TOKEN || !MEGAAPI_INSTANCE) {
    return { error: "MegaAPI not configured" };
  }

  // Faz download via API
  try {
    const response = await fetch(
      `https://${MEGAAPI_HOST}/rest/instance/downloadMediaMessage/${MEGAAPI_INSTANCE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MEGAAPI_TOKEN}`,
        },
        body: JSON.stringify({
          messageData: {
            mediaKey: mediaData.mediaKey || "",
            directPath: mediaData.directPath || "",
            url: mediaData.url || "",
            mimetype: mediaData.mimetype || "",
            messageType,
          },
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      log("error", { status: response.status, error: text }, "media_download_failed");
      return { error: `Download failed: ${response.status}` };
    }

    const result = await response.json();
    log("info", { messageType, hasBase64: !!result.base64 }, "media_downloaded");

    return {
      base64: result.base64 || result.data,
      url: result.url,
    };
  } catch (err: any) {
    log("error", { error: err.message }, "media_download_error");
    return { error: err.message };
  }
}

// =============================================================================
// [FUNC:TRANSFORM] Main transform function
// =============================================================================

export default async function transform(
  ctx: HookMappingContext
): Promise<TransformResult | null> {
  const payload = ctx.payload as unknown as MegaAPIWebhookPayload;
  const { data } = payload;

  // [GUARD:OWN] Skip own messages
  if (data?.key?.fromMe) {
    log("debug", { messageId: data.key.id }, "skipping_own_message");
    return null;
  }

  // [GUARD:MESSAGE] Skip if no message
  if (!data?.message) {
    log("debug", {}, "skipping_no_message");
    return null;
  }

  const sender = {
    jid: data.key?.remoteJid || "",
    name: data.pushName || "Unknown",
    number: (data.key?.remoteJid || "").split("@")[0],
  };

  const message = data.message;
  let content = "";
  let mediaInfo = "";
  let channel: TransformResult["channel"] = undefined;

  // =========================================================================
  // [PROCESS:TEXT] Plain text message
  // =========================================================================
  if (message.conversation) {
    content = message.conversation;
    log("info", { from: sender.jid, type: "text" }, "processing_text");
  }
  // =========================================================================
  // [PROCESS:EXTENDED_TEXT] Extended text (reply, link preview)
  // =========================================================================
  else if (message.extendedTextMessage?.text) {
    content = message.extendedTextMessage.text;
    log("info", { from: sender.jid, type: "extended_text" }, "processing_text");
  }
  // =========================================================================
  // [PROCESS:IMAGE] Image message
  // =========================================================================
  else if (message.imageMessage) {
    const img = message.imageMessage;
    log("info", { from: sender.jid, type: "image" }, "processing_media");

    const media = await downloadMedia(img, "imageMessage");

    if (media.url || media.base64) {
      mediaInfo = "[IMAGEM]";
      content = img.caption || "";
      channel = {
        kind: "whatsapp",
        media: {
          type: "image",
          url: media.url,
          base64: media.base64,
          mimetype: img.mimetype,
        },
      };
    } else {
      content = `[Imagem - erro: ${media.error}]`;
    }
  }
  // =========================================================================
  // [PROCESS:AUDIO] Audio message (including voice notes)
  // =========================================================================
  else if (message.audioMessage) {
    const audio = message.audioMessage;
    const isVoiceNote = audio.ptt === true;
    log("info", { from: sender.jid, type: isVoiceNote ? "ptt" : "audio" }, "processing_media");

    const media = await downloadMedia(audio, "audioMessage");

    if (media.url || media.base64) {
      mediaInfo = isVoiceNote ? "[ÁUDIO DE VOZ]" : "[ÁUDIO]";
      channel = {
        kind: "whatsapp",
        media: {
          type: "audio",
          url: media.url,
          base64: media.base64,
          mimetype: audio.mimetype,
          ptt: isVoiceNote,
        },
      };
    } else {
      content = `[Áudio - erro: ${media.error}]`;
    }
  }
  // =========================================================================
  // [PROCESS:VIDEO] Video message
  // =========================================================================
  else if (message.videoMessage) {
    const video = message.videoMessage;
    log("info", { from: sender.jid, type: "video" }, "processing_media");

    const media = await downloadMedia(video, "videoMessage");

    if (media.url || media.base64) {
      mediaInfo = "[VÍDEO]";
      content = video.caption || "";
      channel = {
        kind: "whatsapp",
        media: {
          type: "video",
          url: media.url,
          base64: media.base64,
          mimetype: video.mimetype,
        },
      };
    } else {
      content = `[Vídeo - erro: ${media.error}]`;
    }
  }
  // =========================================================================
  // [PROCESS:DOCUMENT] Document message
  // =========================================================================
  else if (message.documentMessage) {
    const doc = message.documentMessage;
    const fileName = doc.fileName || "documento";
    log("info", { from: sender.jid, type: "document", fileName }, "processing_media");

    const media = await downloadMedia(doc, "documentMessage");

    if (media.url || media.base64) {
      mediaInfo = `[DOCUMENTO: ${fileName}]`;
      content = doc.caption || "";
      channel = {
        kind: "whatsapp",
        media: {
          type: "document",
          url: media.url,
          base64: media.base64,
          mimetype: doc.mimetype,
          fileName,
        },
      };
    } else {
      content = `[Documento "${fileName}" - erro: ${media.error}]`;
    }
  }
  // =========================================================================
  // [PROCESS:STICKER] Sticker message
  // =========================================================================
  else if (message.stickerMessage) {
    log("info", { from: sender.jid, type: "sticker" }, "processing_sticker");
    content = "[Sticker]";
  }
  // =========================================================================
  // [PROCESS:LOCATION] Location message
  // =========================================================================
  else if (message.locationMessage) {
    const loc = message.locationMessage;
    log("info", { from: sender.jid, type: "location" }, "processing_location");
    const name = loc.name ? ` - ${loc.name}` : "";
    content = `[Localização${name}: ${loc.degreesLatitude}, ${loc.degreesLongitude}]`;
  }
  // =========================================================================
  // [PROCESS:CONTACT] Contact message
  // =========================================================================
  else if (message.contactMessage) {
    const contact = message.contactMessage;
    log("info", { from: sender.jid, type: "contact" }, "processing_contact");
    content = `[Contato: ${contact.displayName || "sem nome"}]`;
  }
  // =========================================================================
  // [PROCESS:UNKNOWN] Unknown message type
  // =========================================================================
  else {
    log("warn", { from: sender.jid, messageKeys: Object.keys(message) }, "unknown_message_type");
    content = "[Mensagem não suportada]";
  }

  // Build final message
  const finalMessage = [mediaInfo, content].filter(Boolean).join(" ").trim();

  if (!finalMessage) {
    log("debug", { from: sender.jid }, "empty_message_skipped");
    return null;
  }

  log("info", {
    from: sender.jid,
    name: sender.name,
    hasMedia: !!channel,
    messageLength: finalMessage.length,
  }, "transform_complete");

  return {
    message: finalMessage,
    name: sender.name,
    sessionKey: `whatsapp:${sender.jid}`,
    wakeMode: "now",
    channel,
    allowUnsafeExternalContent: true,
  };
}
