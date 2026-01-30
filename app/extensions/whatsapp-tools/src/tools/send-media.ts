/**
 * [TOOL:SEND_MEDIA] Send media messages via WhatsApp
 *
 * Tools for sending images, audio, video, and documents.
 * Uses the abstracted WhatsApp client - works with any provider.
 */

import { getWhatsAppClient } from "../../../whatsapp-core/index.js";
import { logger } from "../logger.js";

// =============================================================================
// [TOOL:SEND_IMAGE] Send image
// =============================================================================

export function createSendImageTool() {
  return {
    name: "send_whatsapp_image",
    description:
      "Send image via WhatsApp. Use this for photos, screenshots, diagrams.",
    parameters: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "WhatsApp number (format: 5511999999999)",
        },
        imageUrl: {
          type: "string",
          description: "URL of the image (JPG, PNG, WEBP)",
        },
        caption: {
          type: "string",
          description: "Optional caption for the image",
        },
      },
      required: ["to", "imageUrl"],
    },
    async execute(_toolCallId: string, args: any) {
      try {
        const client = getWhatsAppClient();

        if (!client.isConfigured()) {
          return {
            success: false,
            error: "WhatsApp provider not configured",
          };
        }

        const result = await client.messages.sendMediaUrl(
          args.to,
          args.imageUrl,
          "image",
          { caption: args.caption }
        );

        logger.info(
          {
            to: args.to,
            messageId: result.messageId,
            imageUrl: args.imageUrl,
          },
          "image_sent"
        );

        return {
          success: result.success,
          messageId: result.messageId,
          to: args.to,
          error: result.error,
        };
      } catch (error: any) {
        logger.error(
          { to: args.to, error: error.message },
          "image_send_failed"
        );

        return {
          success: false,
          error: error.message,
        };
      }
    },
  };
}

// =============================================================================
// [TOOL:SEND_AUDIO] Send audio
// =============================================================================

export function createSendAudioTool() {
  return {
    name: "send_whatsapp_audio",
    description:
      "Send audio message via WhatsApp. Use this for voice messages or audio files.",
    parameters: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "WhatsApp number (format: 5511999999999)",
        },
        audioUrl: {
          type: "string",
          description: "URL of the audio file (MP3, OGG, M4A)",
        },
        ptt: {
          type: "boolean",
          description: "Send as voice note/push-to-talk (default: false)",
        },
      },
      required: ["to", "audioUrl"],
    },
    async execute(_toolCallId: string, args: any) {
      try {
        const client = getWhatsAppClient();

        if (!client.isConfigured()) {
          return {
            success: false,
            error: "WhatsApp provider not configured",
          };
        }

        const result = await client.messages.sendMediaUrl(
          args.to,
          args.audioUrl,
          "audio",
          { ptt: args.ptt }
        );

        logger.info(
          {
            to: args.to,
            messageId: result.messageId,
            audioUrl: args.audioUrl,
            ptt: args.ptt,
          },
          "audio_sent"
        );

        return {
          success: result.success,
          messageId: result.messageId,
          to: args.to,
          error: result.error,
        };
      } catch (error: any) {
        logger.error(
          { to: args.to, error: error.message },
          "audio_send_failed"
        );

        return {
          success: false,
          error: error.message,
        };
      }
    },
  };
}

// =============================================================================
// [TOOL:SEND_VIDEO] Send video
// =============================================================================

export function createSendVideoTool() {
  return {
    name: "send_whatsapp_video",
    description: "Send video via WhatsApp. Use this for video clips.",
    parameters: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "WhatsApp number (format: 5511999999999)",
        },
        videoUrl: {
          type: "string",
          description: "URL of the video file (MP4)",
        },
        caption: {
          type: "string",
          description: "Optional caption for the video",
        },
      },
      required: ["to", "videoUrl"],
    },
    async execute(_toolCallId: string, args: any) {
      try {
        const client = getWhatsAppClient();

        if (!client.isConfigured()) {
          return {
            success: false,
            error: "WhatsApp provider not configured",
          };
        }

        const result = await client.messages.sendMediaUrl(
          args.to,
          args.videoUrl,
          "video",
          { caption: args.caption }
        );

        logger.info(
          {
            to: args.to,
            messageId: result.messageId,
            videoUrl: args.videoUrl,
          },
          "video_sent"
        );

        return {
          success: result.success,
          messageId: result.messageId,
          to: args.to,
          error: result.error,
        };
      } catch (error: any) {
        logger.error(
          { to: args.to, error: error.message },
          "video_send_failed"
        );

        return {
          success: false,
          error: error.message,
        };
      }
    },
  };
}

// =============================================================================
// [TOOL:SEND_FILE] Send document/file
// =============================================================================

export function createSendFileTool() {
  return {
    name: "send_whatsapp_file",
    description:
      "Send document/file via WhatsApp. Use this for PDFs, spreadsheets, documents.",
    parameters: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "WhatsApp number (format: 5511999999999)",
        },
        fileUrl: {
          type: "string",
          description: "URL of the file (PDF, DOCX, XLSX, etc)",
        },
        fileName: {
          type: "string",
          description: "File name to display (e.g., 'relatorio.pdf')",
        },
        caption: {
          type: "string",
          description: "Optional caption for the file",
        },
      },
      required: ["to", "fileUrl", "fileName"],
    },
    async execute(_toolCallId: string, args: any) {
      try {
        const client = getWhatsAppClient();

        if (!client.isConfigured()) {
          return {
            success: false,
            error: "WhatsApp provider not configured",
          };
        }

        const result = await client.messages.sendMediaUrl(
          args.to,
          args.fileUrl,
          "document",
          {
            fileName: args.fileName,
            caption: args.caption,
          }
        );

        logger.info(
          {
            to: args.to,
            messageId: result.messageId,
            fileName: args.fileName,
          },
          "file_sent"
        );

        return {
          success: result.success,
          messageId: result.messageId,
          to: args.to,
          fileName: args.fileName,
          error: result.error,
        };
      } catch (error: any) {
        logger.error(
          { to: args.to, error: error.message },
          "file_send_failed"
        );

        return {
          success: false,
          error: error.message,
        };
      }
    },
  };
}

// =============================================================================
// [TOOL:SEND_LOCATION] Send location
// =============================================================================

export function createSendLocationTool() {
  return {
    name: "send_whatsapp_location",
    description:
      "Send location via WhatsApp. Use this to share a map location.",
    parameters: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "WhatsApp number (format: 5511999999999)",
        },
        latitude: {
          type: "number",
          description: "Latitude coordinate",
        },
        longitude: {
          type: "number",
          description: "Longitude coordinate",
        },
        name: {
          type: "string",
          description: "Location name (optional)",
        },
        address: {
          type: "string",
          description: "Address text (optional)",
        },
      },
      required: ["to", "latitude", "longitude"],
    },
    async execute(_toolCallId: string, args: any) {
      try {
        const client = getWhatsAppClient();

        if (!client.isConfigured()) {
          return {
            success: false,
            error: "WhatsApp provider not configured",
          };
        }

        const result = await client.messages.sendLocation(
          args.to,
          args.latitude,
          args.longitude,
          {
            name: args.name,
            address: args.address,
          }
        );

        logger.info(
          {
            to: args.to,
            messageId: result.messageId,
            lat: args.latitude,
            lng: args.longitude,
          },
          "location_sent"
        );

        return {
          success: result.success,
          messageId: result.messageId,
          to: args.to,
          error: result.error,
        };
      } catch (error: any) {
        logger.error(
          { to: args.to, error: error.message },
          "location_send_failed"
        );

        return {
          success: false,
          error: error.message,
        };
      }
    },
  };
}

// =============================================================================
// [TOOL:SEND_CONTACT] Send contact card
// =============================================================================

export function createSendContactTool() {
  return {
    name: "send_whatsapp_contact",
    description: "Send a contact card via WhatsApp.",
    parameters: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "WhatsApp number (format: 5511999999999)",
        },
        contactName: {
          type: "string",
          description: "Contact's full name",
        },
        contactPhone: {
          type: "string",
          description: "Contact's phone number",
        },
        contactOrg: {
          type: "string",
          description: "Contact's organization (optional)",
        },
      },
      required: ["to", "contactName", "contactPhone"],
    },
    async execute(_toolCallId: string, args: any) {
      try {
        const client = getWhatsAppClient();

        if (!client.isConfigured()) {
          return {
            success: false,
            error: "WhatsApp provider not configured",
          };
        }

        const result = await client.messages.sendContact(args.to, {
          fullName: args.contactName,
          phoneNumber: args.contactPhone,
          organization: args.contactOrg,
        });

        logger.info(
          {
            to: args.to,
            messageId: result.messageId,
            contactName: args.contactName,
          },
          "contact_sent"
        );

        return {
          success: result.success,
          messageId: result.messageId,
          to: args.to,
          error: result.error,
        };
      } catch (error: any) {
        logger.error(
          { to: args.to, error: error.message },
          "contact_send_failed"
        );

        return {
          success: false,
          error: error.message,
        };
      }
    },
  };
}
