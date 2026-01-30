/**
 * [PLUGIN:WHATSAPP-TOOLS] WhatsApp MCP Tools
 *
 * Registers all WhatsApp tools for agent use.
 * Tools use the abstracted WhatsApp client - works with any provider.
 *
 * Available tools:
 * - send_whatsapp_message: Send text message
 * - reply_whatsapp_message: Reply to a message
 * - send_whatsapp_image: Send image
 * - send_whatsapp_audio: Send audio
 * - send_whatsapp_video: Send video
 * - send_whatsapp_file: Send document
 * - send_whatsapp_location: Send location
 * - send_whatsapp_contact: Send contact card
 * - whatsapp_status: Check connection status
 * - whatsapp_qr_code: Get QR code for auth
 * - is_on_whatsapp: Check if number is on WhatsApp
 * - whatsapp_restart: Restart instance
 * - whatsapp_logout: Logout instance
 * - whatsapp_list_groups: List groups
 * - whatsapp_group_info: Get group info
 * - whatsapp_create_group: Create group
 * - whatsapp_add_participants: Add to group
 * - whatsapp_remove_participants: Remove from group
 * - whatsapp_leave_group: Leave group
 *
 * @version 1.0.0
 */

import type { MoltbotPluginApi } from "clawdbot/plugin-sdk";
import { logger } from "./src/logger.js";

// Import tool creators
import {
  createSendMessageTool,
  createReplyMessageTool,
  createSendImageTool,
  createSendAudioTool,
  createSendVideoTool,
  createSendFileTool,
  createSendLocationTool,
  createSendContactTool,
  createInstanceStatusTool,
  createGetQRCodeTool,
  createIsOnWhatsAppTool,
  createRestartInstanceTool,
  createLogoutInstanceTool,
  createListGroupsTool,
  createGroupInfoTool,
  createCreateGroupTool,
  createAddParticipantsTool,
  createRemoveParticipantsTool,
  createLeaveGroupTool,
} from "./src/tools/index.js";

// =============================================================================
// [PLUGIN:DEFINITION]
// =============================================================================

const plugin = {
  id: "whatsapp-tools",
  name: "WhatsApp Tools",
  description: "MCP tools for WhatsApp communication (provider-agnostic)",

  register(api: MoltbotPluginApi) {
    // [TOOLS:MESSAGES] Message sending tools
    api.registerTool(createSendMessageTool());
    api.registerTool(createReplyMessageTool());

    // [TOOLS:MEDIA] Media sending tools
    api.registerTool(createSendImageTool());
    api.registerTool(createSendAudioTool());
    api.registerTool(createSendVideoTool());
    api.registerTool(createSendFileTool());
    api.registerTool(createSendLocationTool());
    api.registerTool(createSendContactTool());

    // [TOOLS:INSTANCE] Instance management tools
    api.registerTool(createInstanceStatusTool());
    api.registerTool(createGetQRCodeTool());
    api.registerTool(createIsOnWhatsAppTool());
    api.registerTool(createRestartInstanceTool());
    api.registerTool(createLogoutInstanceTool());

    // [TOOLS:GROUPS] Group management tools
    api.registerTool(createListGroupsTool());
    api.registerTool(createGroupInfoTool());
    api.registerTool(createCreateGroupTool());
    api.registerTool(createAddParticipantsTool());
    api.registerTool(createRemoveParticipantsTool());
    api.registerTool(createLeaveGroupTool());

    const toolNames = [
      "send_whatsapp_message",
      "reply_whatsapp_message",
      "send_whatsapp_image",
      "send_whatsapp_audio",
      "send_whatsapp_video",
      "send_whatsapp_file",
      "send_whatsapp_location",
      "send_whatsapp_contact",
      "whatsapp_status",
      "whatsapp_qr_code",
      "is_on_whatsapp",
      "whatsapp_restart",
      "whatsapp_logout",
      "whatsapp_list_groups",
      "whatsapp_group_info",
      "whatsapp_create_group",
      "whatsapp_add_participants",
      "whatsapp_remove_participants",
      "whatsapp_leave_group",
    ];

    logger.info(
      {
        toolCount: toolNames.length,
        tools: toolNames,
        version: "1.0.0",
      },
      "plugin_registered"
    );
  },
};

export default plugin;

// [EXPORT:TOOLS] Re-export tool creators for custom use
export * from "./src/tools/index.js";
