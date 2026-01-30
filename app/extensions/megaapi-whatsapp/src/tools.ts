/**
 * [TOOLS:MEGAAPI] MegaAPI WhatsApp Tools
 *
 * Complete set of tools for WhatsApp communication:
 * - send_whatsapp_message: Send text message
 * - send_whatsapp_audio: Send audio file
 * - send_whatsapp_image: Send image
 * - send_whatsapp_file: Send document/file
 */

import { logger } from "./logger.js";

// [CONFIG:ENV] Read configuration
function getConfig() {
  return {
    apiHost: process.env.MEGAAPI_API_HOST || "api2.megaapi.com.br",
    instanceKey: process.env.MEGAAPI_INSTANCE_KEY || "",
    apiToken: process.env.MEGAAPI_TOKEN || "",
  };
}

// [UTIL:API] Generic API call function
async function megaAPICall(endpoint: string, payload: any) {
  const config = getConfig();

  if (!config.apiToken || !config.instanceKey) {
    throw new Error("MegaAPI not configured. Set MEGAAPI_TOKEN and MEGAAPI_INSTANCE_KEY.");
  }

  const url = `https://${config.apiHost}/rest/${endpoint}/${config.instanceKey}/contactMessage`;

  logger.info({
    endpoint,
    to: payload.number,
    hasMedia: !!(payload.mediaUrl || payload.audioUrl || payload.fileUrl)
  }, "api_call_started");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiToken}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MegaAPI error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// [UTIL:NORMALIZE] Normalize phone number to JID format
function normalizeJid(number: string): string {
  if (number.includes("@")) return number;
  return `${number}@s.whatsapp.net`;
}

// =============================================================================
// [TOOL:SEND_MESSAGE] Send text message
// =============================================================================
export function createSendMessageTool() {
  return {
    name: "send_whatsapp_message",
    description: "Send text message via WhatsApp. Use this for regular text communication with clients.",
    parameters: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "WhatsApp number (format: 5511999999999 or 5511999999999@s.whatsapp.net)"
        },
        message: {
          type: "string",
          description: "Text message to send"
        }
      },
      required: ["to", "message"]
    },
    async execute(_toolCallId: string, args: any) {
      try {
        const targetJid = normalizeJid(args.to);

        const result = await megaAPICall("sendMessage", {
          number: targetJid,
          text: args.message
        });

        logger.info({
          to: targetJid,
          messageId: result.messageId,
          messageLength: args.message.length
        }, "message_sent_success");

        return {
          success: true,
          messageId: result.messageId,
          to: targetJid
        };
      } catch (error: any) {
        logger.error({
          to: args.to,
          error: error.message
        }, "message_send_failed");

        return {
          success: false,
          error: error.message
        };
      }
    }
  };
}

// =============================================================================
// [TOOL:SEND_AUDIO] Send audio file
// =============================================================================
export function createSendAudioTool() {
  return {
    name: "send_whatsapp_audio",
    description: "Send audio message via WhatsApp. Use this for voice messages or audio files.",
    parameters: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "WhatsApp number (format: 5511999999999)"
        },
        audioUrl: {
          type: "string",
          description: "URL of the audio file (MP3, OGG, M4A)"
        },
        caption: {
          type: "string",
          description: "Optional caption for the audio"
        }
      },
      required: ["to", "audioUrl"]
    },
    async execute(_toolCallId: string, args: any) {
      try {
        const targetJid = normalizeJid(args.to);

        const payload: any = {
          number: targetJid,
          audioUrl: args.audioUrl
        };

        if (args.caption) {
          payload.caption = args.caption;
        }

        const result = await megaAPICall("sendMessage", payload);

        logger.info({
          to: targetJid,
          messageId: result.messageId,
          audioUrl: args.audioUrl
        }, "audio_sent_success");

        return {
          success: true,
          messageId: result.messageId,
          to: targetJid
        };
      } catch (error: any) {
        logger.error({
          to: args.to,
          error: error.message
        }, "audio_send_failed");

        return {
          success: false,
          error: error.message
        };
      }
    }
  };
}

// =============================================================================
// [TOOL:SEND_IMAGE] Send image
// =============================================================================
export function createSendImageTool() {
  return {
    name: "send_whatsapp_image",
    description: "Send image via WhatsApp. Use this for photos, screenshots, diagrams.",
    parameters: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "WhatsApp number (format: 5511999999999)"
        },
        imageUrl: {
          type: "string",
          description: "URL of the image (JPG, PNG, WEBP)"
        },
        caption: {
          type: "string",
          description: "Optional caption for the image"
        }
      },
      required: ["to", "imageUrl"]
    },
    async execute(_toolCallId: string, args: any) {
      try {
        const targetJid = normalizeJid(args.to);

        const payload: any = {
          number: targetJid,
          mediaUrl: args.imageUrl
        };

        if (args.caption) {
          payload.text = args.caption;
        }

        const result = await megaAPICall("sendMessage", payload);

        logger.info({
          to: targetJid,
          messageId: result.messageId,
          imageUrl: args.imageUrl
        }, "image_sent_success");

        return {
          success: true,
          messageId: result.messageId,
          to: targetJid
        };
      } catch (error: any) {
        logger.error({
          to: args.to,
          error: error.message
        }, "image_send_failed");

        return {
          success: false,
          error: error.message
        };
      }
    }
  };
}

// =============================================================================
// [TOOL:SEND_FILE] Send document/file
// =============================================================================
export function createSendFileTool() {
  return {
    name: "send_whatsapp_file",
    description: "Send document/file via WhatsApp. Use this for PDFs, spreadsheets, documents.",
    parameters: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "WhatsApp number (format: 5511999999999)"
        },
        fileUrl: {
          type: "string",
          description: "URL of the file (PDF, DOCX, XLSX, etc)"
        },
        fileName: {
          type: "string",
          description: "File name to display (e.g., 'relatorio.pdf')"
        },
        caption: {
          type: "string",
          description: "Optional caption for the file"
        }
      },
      required: ["to", "fileUrl", "fileName"]
    },
    async execute(_toolCallId: string, args: any) {
      try {
        const targetJid = normalizeJid(args.to);

        const payload: any = {
          number: targetJid,
          fileUrl: args.fileUrl,
          fileName: args.fileName
        };

        if (args.caption) {
          payload.text = args.caption;
        }

        const result = await megaAPICall("sendMessage", payload);

        logger.info({
          to: targetJid,
          messageId: result.messageId,
          fileName: args.fileName
        }, "file_sent_success");

        return {
          success: true,
          messageId: result.messageId,
          to: targetJid,
          fileName: args.fileName
        };
      } catch (error: any) {
        logger.error({
          to: args.to,
          error: error.message
        }, "file_send_failed");

        return {
          success: false,
          error: error.message
        };
      }
    }
  };
}
