/**
 * [TOOL:GROUPS] WhatsApp group management tools
 *
 * Tools for managing WhatsApp groups.
 * Uses the abstracted WhatsApp client - works with any provider.
 */

import { getWhatsAppClient } from "../../../whatsapp-core/index.js";
import { logger } from "../logger.js";

// =============================================================================
// [TOOL:LIST_GROUPS] List all groups
// =============================================================================

export function createListGroupsTool() {
  return {
    name: "whatsapp_list_groups",
    description: "List all WhatsApp groups the account is part of.",
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

        const result = await client.groups.list();

        logger.info({ groupCount: result.total }, "groups_listed");

        return {
          success: true,
          groups: result.groups,
          total: result.total,
        };
      } catch (error: any) {
        logger.error({ error: error.message }, "list_groups_failed");

        return {
          success: false,
          error: error.message,
        };
      }
    },
  };
}

// =============================================================================
// [TOOL:GROUP_INFO] Get group information
// =============================================================================

export function createGroupInfoTool() {
  return {
    name: "whatsapp_group_info",
    description: "Get detailed information about a WhatsApp group.",
    parameters: {
      type: "object",
      properties: {
        groupId: {
          type: "string",
          description: "Group JID (e.g., 123456789@g.us)",
        },
      },
      required: ["groupId"],
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

        const info = await client.groups.getInfo(args.groupId);

        logger.info(
          {
            groupId: args.groupId,
            name: info.name,
            participantCount: info.participants.length,
          },
          "group_info_retrieved"
        );

        return {
          success: true,
          group: {
            id: info.id,
            name: info.name,
            description: info.description,
            owner: info.owner,
            participantCount: info.participants.length,
            participants: info.participants,
            isAdmin: info.isAdmin,
          },
        };
      } catch (error: any) {
        logger.error(
          { groupId: args.groupId, error: error.message },
          "group_info_failed"
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
// [TOOL:CREATE_GROUP] Create new group
// =============================================================================

export function createCreateGroupTool() {
  return {
    name: "whatsapp_create_group",
    description: "Create a new WhatsApp group.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Group name/subject",
        },
        participants: {
          type: "array",
          items: { type: "string" },
          description: "Phone numbers to add (format: 5511999999999)",
        },
        description: {
          type: "string",
          description: "Group description (optional)",
        },
      },
      required: ["name", "participants"],
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

        const result = await client.groups.create({
          name: args.name,
          participants: args.participants,
          description: args.description,
        });

        logger.info(
          {
            groupId: result.groupId,
            name: args.name,
            participantCount: args.participants.length,
          },
          "group_created"
        );

        return {
          success: true,
          groupId: result.groupId,
          inviteLink: result.inviteLink,
        };
      } catch (error: any) {
        logger.error(
          { name: args.name, error: error.message },
          "create_group_failed"
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
// [TOOL:ADD_PARTICIPANTS] Add participants to group
// =============================================================================

export function createAddParticipantsTool() {
  return {
    name: "whatsapp_add_participants",
    description: "Add participants to a WhatsApp group.",
    parameters: {
      type: "object",
      properties: {
        groupId: {
          type: "string",
          description: "Group JID",
        },
        participants: {
          type: "array",
          items: { type: "string" },
          description: "Phone numbers to add (format: 5511999999999)",
        },
      },
      required: ["groupId", "participants"],
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

        await client.groups.addParticipants(args.groupId, args.participants);

        logger.info(
          {
            groupId: args.groupId,
            addedCount: args.participants.length,
          },
          "participants_added"
        );

        return {
          success: true,
          message: `Added ${args.participants.length} participant(s) to group`,
        };
      } catch (error: any) {
        logger.error(
          { groupId: args.groupId, error: error.message },
          "add_participants_failed"
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
// [TOOL:REMOVE_PARTICIPANTS] Remove participants from group
// =============================================================================

export function createRemoveParticipantsTool() {
  return {
    name: "whatsapp_remove_participants",
    description: "Remove participants from a WhatsApp group.",
    parameters: {
      type: "object",
      properties: {
        groupId: {
          type: "string",
          description: "Group JID",
        },
        participants: {
          type: "array",
          items: { type: "string" },
          description: "Phone numbers to remove (format: 5511999999999)",
        },
      },
      required: ["groupId", "participants"],
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

        await client.groups.removeParticipants(args.groupId, args.participants);

        logger.info(
          {
            groupId: args.groupId,
            removedCount: args.participants.length,
          },
          "participants_removed"
        );

        return {
          success: true,
          message: `Removed ${args.participants.length} participant(s) from group`,
        };
      } catch (error: any) {
        logger.error(
          { groupId: args.groupId, error: error.message },
          "remove_participants_failed"
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
// [TOOL:LEAVE_GROUP] Leave group
// =============================================================================

export function createLeaveGroupTool() {
  return {
    name: "whatsapp_leave_group",
    description: "Leave a WhatsApp group.",
    parameters: {
      type: "object",
      properties: {
        groupId: {
          type: "string",
          description: "Group JID to leave",
        },
      },
      required: ["groupId"],
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

        await client.groups.leave(args.groupId);

        logger.info({ groupId: args.groupId }, "left_group");

        return {
          success: true,
          message: "Left group successfully",
        };
      } catch (error: any) {
        logger.error(
          { groupId: args.groupId, error: error.message },
          "leave_group_failed"
        );

        return {
          success: false,
          error: error.message,
        };
      }
    },
  };
}
