/**
 * [TOOL:INSTANCE] Instance status and management tools
 *
 * Tools for checking WhatsApp connection status and management.
 * Uses the abstracted WhatsApp client - works with any provider.
 */

import { getWhatsAppClient } from "../../../whatsapp-core/index.js";
import { logger } from "../logger.js";

// =============================================================================
// [TOOL:STATUS] Get WhatsApp connection status
// =============================================================================

export function createInstanceStatusTool() {
  return {
    name: "whatsapp_status",
    description:
      "Check WhatsApp connection status. Use this to verify if WhatsApp is connected and working.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    async execute(_toolCallId: string, _args: any) {
      try {
        const client = getWhatsAppClient();

        if (!client.isConfigured()) {
          return {
            success: false,
            connected: false,
            error: "WhatsApp provider not configured",
          };
        }

        const providerInfo = client.getProviderInfo();
        const status = await client.instance.getStatus();

        logger.info(
          {
            state: status.state,
            isAuthenticated: status.isAuthenticated,
            phoneNumber: status.phoneNumber,
            provider: providerInfo?.id,
          },
          "status_checked"
        );

        return {
          success: true,
          connected: status.state === "open",
          state: status.state,
          isAuthenticated: status.isAuthenticated,
          phoneNumber: status.phoneNumber,
          provider: {
            id: providerInfo?.id,
            name: providerInfo?.name,
            version: providerInfo?.version,
          },
        };
      } catch (error: any) {
        logger.error({ error: error.message }, "status_check_failed");

        return {
          success: false,
          connected: false,
          error: error.message,
        };
      }
    },
  };
}

// =============================================================================
// [TOOL:QR_CODE] Get QR code for authentication
// =============================================================================

export function createGetQRCodeTool() {
  return {
    name: "whatsapp_qr_code",
    description:
      "Get QR code for WhatsApp authentication. Use this when WhatsApp needs to be connected/authenticated.",
    parameters: {
      type: "object",
      properties: {
        format: {
          type: "string",
          enum: ["base64", "image"],
          description: "QR code format (default: base64)",
        },
      },
      required: [],
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

        const format = args.format || "base64";
        const qrResult = await client.instance.getQRCode(format);

        logger.info({ format, valid: qrResult.valid }, "qr_code_generated");

        return {
          success: true,
          qrCode: qrResult.data,
          format: qrResult.format,
          valid: qrResult.valid,
          expiresAt: qrResult.expiresAt?.toISOString(),
        };
      } catch (error: any) {
        logger.error({ error: error.message }, "qr_code_failed");

        return {
          success: false,
          error: error.message,
        };
      }
    },
  };
}

// =============================================================================
// [TOOL:IS_ON_WHATSAPP] Check if number is on WhatsApp
// =============================================================================

export function createIsOnWhatsAppTool() {
  return {
    name: "is_on_whatsapp",
    description:
      "Check if a phone number is registered on WhatsApp. Use this to verify before sending messages.",
    parameters: {
      type: "object",
      properties: {
        phoneNumber: {
          type: "string",
          description: "Phone number to check (format: 5511999999999)",
        },
      },
      required: ["phoneNumber"],
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

        const result = await client.instance.isOnWhatsApp(args.phoneNumber);

        logger.info(
          {
            phoneNumber: args.phoneNumber,
            exists: result.exists,
          },
          "whatsapp_check"
        );

        return {
          success: true,
          phoneNumber: result.phoneNumber,
          isOnWhatsApp: result.exists,
          jid: result.jid,
        };
      } catch (error: any) {
        logger.error(
          { phoneNumber: args.phoneNumber, error: error.message },
          "whatsapp_check_failed"
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
// [TOOL:RESTART] Restart WhatsApp instance
// =============================================================================

export function createRestartInstanceTool() {
  return {
    name: "whatsapp_restart",
    description:
      "Restart WhatsApp instance. Use this if WhatsApp is having connection issues.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    async execute(_toolCallId: string, _args: any) {
      try {
        const client = getWhatsAppClient();

        if (!client.isConfigured()) {
          return {
            success: false,
            error: "WhatsApp provider not configured",
          };
        }

        await client.instance.restart();

        logger.info({}, "instance_restarted");

        return {
          success: true,
          message: "WhatsApp instance restarted successfully",
        };
      } catch (error: any) {
        logger.error({ error: error.message }, "instance_restart_failed");

        return {
          success: false,
          error: error.message,
        };
      }
    },
  };
}

// =============================================================================
// [TOOL:LOGOUT] Logout WhatsApp instance
// =============================================================================

export function createLogoutInstanceTool() {
  return {
    name: "whatsapp_logout",
    description:
      "Logout WhatsApp instance. This will disconnect WhatsApp and require re-authentication.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    async execute(_toolCallId: string, _args: any) {
      try {
        const client = getWhatsAppClient();

        if (!client.isConfigured()) {
          return {
            success: false,
            error: "WhatsApp provider not configured",
          };
        }

        await client.instance.logout();

        logger.info({}, "instance_logged_out");

        return {
          success: true,
          message: "WhatsApp instance logged out successfully",
        };
      } catch (error: any) {
        logger.error({ error: error.message }, "instance_logout_failed");

        return {
          success: false,
          error: error.message,
        };
      }
    },
  };
}
