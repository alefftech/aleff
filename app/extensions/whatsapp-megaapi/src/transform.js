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
// [FUNC:LOG] Simple logging
// =============================================================================
function log(level, data, msg) {
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
async function downloadMedia(mediaData, messageType) {
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
        const response = await fetch(`https://${MEGAAPI_HOST}/rest/instance/downloadMediaMessage/${MEGAAPI_INSTANCE}`, {
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
        });
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
    }
    catch (err) {
        log("error", { error: err.message }, "media_download_error");
        return { error: err.message };
    }
}
// =============================================================================
// [FUNC:TRANSFORM] Main transform function
// =============================================================================
export default async function transform(ctx) {
    const rawPayload = ctx.payload;
    // [COMPAT] MegaAPI sends data at root level OR inside "data" wrapper
    // Root format: { key, message, pushName, ... }
    // Wrapped format: { data: { key, message, pushName, ... } }
    const data = rawPayload.data || rawPayload;
    // [DEBUG] Log payload structure
    log("debug", {
        hasKey: !!data?.key,
        hasMessage: !!data?.message,
        messageType: data?.messageType,
        payloadFormat: rawPayload.data ? "wrapped" : "root"
    }, "webhook_received");
    const key = data.key;
    const message = data.message;
    // [GUARD:OWN] Skip own messages
    if (key?.fromMe) {
        log("debug", { messageId: key.id }, "skipping_own_message");
        return null;
    }
    // [GUARD:MESSAGE] Skip if no message content
    if (!message || Object.keys(message).length === 0) {
        log("debug", { messageType: data?.messageType }, "skipping_no_message");
        return null;
    }
    const sender = {
        jid: key?.remoteJid || data.jid || "",
        name: data.pushName || "Unknown",
        number: (key?.remoteJid || data.jid || "").split("@")[0],
    };
    let content = "";
    let mediaInfo = "";
    let channel = undefined;
    // Cast message fields for type safety
    const conversation = message.conversation;
    const extendedText = message.extendedTextMessage;
    const imageMsg = message.imageMessage;
    const audioMsg = message.audioMessage;
    const videoMsg = message.videoMessage;
    const documentMsg = message.documentMessage;
    const stickerMsg = message.stickerMessage;
    const locationMsg = message.locationMessage;
    const contactMsg = message.contactMessage;
    // =========================================================================
    // [PROCESS:TEXT] Plain text message
    // =========================================================================
    if (conversation) {
        content = conversation;
        log("info", { from: sender.jid, type: "text" }, "processing_text");
    }
    // =========================================================================
    // [PROCESS:EXTENDED_TEXT] Extended text (reply, link preview)
    // =========================================================================
    else if (extendedText?.text) {
        content = extendedText.text;
        log("info", { from: sender.jid, type: "extended_text" }, "processing_text");
    }
    // =========================================================================
    // [PROCESS:IMAGE] Image message
    // =========================================================================
    else if (imageMsg) {
        log("info", { from: sender.jid, type: "image" }, "processing_media");
        const media = await downloadMedia(imageMsg, "imageMessage");
        if (media.url || media.base64) {
            mediaInfo = "[IMAGEM]";
            content = imageMsg.caption || "";
            channel = {
                kind: "whatsapp",
                media: {
                    type: "image",
                    url: media.url,
                    base64: media.base64,
                    mimetype: imageMsg.mimetype,
                },
            };
        }
        else {
            content = `[Imagem - erro: ${media.error}]`;
        }
    }
    // =========================================================================
    // [PROCESS:AUDIO] Audio message (including voice notes)
    // =========================================================================
    else if (audioMsg) {
        const isVoiceNote = audioMsg.ptt === true;
        log("info", { from: sender.jid, type: isVoiceNote ? "ptt" : "audio" }, "processing_media");
        const media = await downloadMedia(audioMsg, "audioMessage");
        if (media.url || media.base64) {
            mediaInfo = isVoiceNote ? "[ÁUDIO DE VOZ]" : "[ÁUDIO]";
            channel = {
                kind: "whatsapp",
                media: {
                    type: "audio",
                    url: media.url,
                    base64: media.base64,
                    mimetype: audioMsg.mimetype,
                    ptt: isVoiceNote,
                },
            };
        }
        else {
            content = `[Áudio - erro: ${media.error}]`;
        }
    }
    // =========================================================================
    // [PROCESS:VIDEO] Video message
    // =========================================================================
    else if (videoMsg) {
        log("info", { from: sender.jid, type: "video" }, "processing_media");
        const media = await downloadMedia(videoMsg, "videoMessage");
        if (media.url || media.base64) {
            mediaInfo = "[VÍDEO]";
            content = videoMsg.caption || "";
            channel = {
                kind: "whatsapp",
                media: {
                    type: "video",
                    url: media.url,
                    base64: media.base64,
                    mimetype: videoMsg.mimetype,
                },
            };
        }
        else {
            content = `[Vídeo - erro: ${media.error}]`;
        }
    }
    // =========================================================================
    // [PROCESS:DOCUMENT] Document message
    // =========================================================================
    else if (documentMsg) {
        const fileName = documentMsg.fileName || "documento";
        log("info", { from: sender.jid, type: "document", fileName }, "processing_media");
        const media = await downloadMedia(documentMsg, "documentMessage");
        if (media.url || media.base64) {
            mediaInfo = `[DOCUMENTO: ${fileName}]`;
            content = documentMsg.caption || "";
            channel = {
                kind: "whatsapp",
                media: {
                    type: "document",
                    url: media.url,
                    base64: media.base64,
                    mimetype: documentMsg.mimetype,
                    fileName,
                },
            };
        }
        else {
            content = `[Documento "${fileName}" - erro: ${media.error}]`;
        }
    }
    // =========================================================================
    // [PROCESS:STICKER] Sticker message
    // =========================================================================
    else if (stickerMsg) {
        log("info", { from: sender.jid, type: "sticker" }, "processing_sticker");
        content = "[Sticker]";
    }
    // =========================================================================
    // [PROCESS:LOCATION] Location message
    // =========================================================================
    else if (locationMsg) {
        log("info", { from: sender.jid, type: "location" }, "processing_location");
        const name = locationMsg.name ? ` - ${locationMsg.name}` : "";
        content = `[Localização${name}: ${locationMsg.degreesLatitude}, ${locationMsg.degreesLongitude}]`;
    }
    // =========================================================================
    // [PROCESS:CONTACT] Contact message
    // =========================================================================
    else if (contactMsg) {
        log("info", { from: sender.jid, type: "contact" }, "processing_contact");
        content = `[Contato: ${contactMsg.displayName || "sem nome"}]`;
    }
    // =========================================================================
    // [PROCESS:UNKNOWN] Unknown message type
    // =========================================================================
    else {
        log("warn", { from: sender.jid, messageKeys: Object.keys(message || {}) }, "unknown_message_type");
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
        deliver: true,
        channel: "whatsapp",
        to: sender.jid,
        allowUnsafeExternalContent: true,
    };
}
