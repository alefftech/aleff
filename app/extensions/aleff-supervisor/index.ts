/**
 * [PLUGIN:MAIN] Aleff Supervisor Plugin v1.0
 *
 * Cross-channel supervisor for AleffAI - control WhatsApp, Instagram, etc. from Telegram.
 *
 * Features:
 * - Channel state management (RUNNING, STOPPED, TAKEOVER)
 * - Message interception based on state
 * - Supervisor notifications for incoming messages
 * - 5 supervisor tools for channel control
 *
 * Tools registered:
 * - supervisor_status: List all channels and their states
 * - supervisor_start: Activate a channel for automatic responses
 * - supervisor_stop: Pause a channel (notify but don't respond)
 * - supervisor_takeover: Supervisor takes manual control
 * - supervisor_release: Return control to the bot
 *
 * Hooks:
 * - message_sending: Block messages based on channel state
 * - message_received: Notify supervisor of incoming messages
 *
 * @version 1.0.0
 * @created 2026-01-30
 */

import type { MoltbotPluginApi } from "../../src/plugins/types.js";
import { logger } from "./src/logger.js";
import { setChannelState } from "./src/state.js";
import {
  handleStatus,
  handleStart,
  handleStop,
  handleTakeover,
  handleRelease,
  validateChannelId,
} from "./src/commands.js";
import { onMessageSending, onMessageReceived } from "./src/hooks.js";
import { isSupervisorConfigured, getSupervisorId } from "./src/notify.js";

// =============================================================================
// [PLUGIN:CONFIG] Plugin configuration
// =============================================================================

interface AleffSupervisorConfig {
  supervisorTelegramId?: string;
  defaultChannels?: string[];
}

const DEFAULT_CONFIG: AleffSupervisorConfig = {
  defaultChannels: ["whatsapp", "telegram", "instagram"],
};

// =============================================================================
// [PLUGIN:REGISTER] Main registration function
// =============================================================================

export default function register(
  api: MoltbotPluginApi,
  config: AleffSupervisorConfig = {}
) {
  const pluginLogger = api.logger;
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // ==========================================================================
  // [INIT:CHANNELS] Register known channels with initial state
  // ==========================================================================

  const knownChannels = cfg.defaultChannels || [];
  for (const channel of knownChannels) {
    setChannelState(channel, "RUNNING", "system");
  }

  logger.info(
    {
      supervisorConfigured: isSupervisorConfigured(),
      supervisorId: getSupervisorId() ? "***" : undefined,
      channels: knownChannels,
    },
    "plugin_initializing"
  );

  // ==========================================================================
  // [HOOK:REGISTER] Register message hooks
  // ==========================================================================

  // [HOOK:MESSAGE_SENDING] Intercept outgoing messages
  api.on("message_sending", async (event: any, ctx: any) => {
    const allowed = await onMessageSending(event, ctx);
    // Note: Returning false should block the message
    // This depends on moltbot's hook implementation
    return allowed;
  });

  // [HOOK:MESSAGE_RECEIVED] Notify supervisor of incoming messages
  api.on("message_received", async (event: any, ctx: any) => {
    await onMessageReceived(event, ctx);
  });

  // ==========================================================================
  // [TOOL:STATUS] Register /status command
  // ==========================================================================

  api.registerTool({
    name: "supervisor_status",
    description:
      "Lista status de todos os canais supervisionados. Use para ver quais canais estao ativos, pausados ou em controle manual.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [] as string[],
    },
    handler: async () => {
      const result = handleStatus();
      logger.info({ command: "status" }, "tool_executed");
      return { content: result };
    },
  });

  // ==========================================================================
  // [TOOL:START] Register /start command
  // ==========================================================================

  api.registerTool({
    name: "supervisor_start",
    description:
      "Ativa um canal para responder automaticamente. Uso: supervisor_start(channel='whatsapp'). O bot voltara a responder mensagens neste canal.",
    inputSchema: {
      type: "object" as const,
      properties: {
        channel: {
          type: "string",
          description: "Canal a ativar (whatsapp, instagram, telegram, etc)",
        },
      },
      required: ["channel"],
    },
    handler: async (args: any, ctx: any) => {
      const validation = validateChannelId(args.channel);
      if (!validation.valid) {
        return { content: `Erro: ${validation.error}` };
      }

      const userId = ctx?.userId || ctx?.from || "unknown";
      const result = handleStart(args.channel, userId);
      logger.info({ command: "start", channel: args.channel, userId }, "tool_executed");
      return { content: result };
    },
  });

  // ==========================================================================
  // [TOOL:STOP] Register /stop command
  // ==========================================================================

  api.registerTool({
    name: "supervisor_stop",
    description:
      "Pausa um canal - bot nao responde mas voce recebe notificacoes. Uso: supervisor_stop(channel='whatsapp'). Util para quando precisa monitorar sem intervir.",
    inputSchema: {
      type: "object" as const,
      properties: {
        channel: {
          type: "string",
          description: "Canal a pausar",
        },
      },
      required: ["channel"],
    },
    handler: async (args: any, ctx: any) => {
      const validation = validateChannelId(args.channel);
      if (!validation.valid) {
        return { content: `Erro: ${validation.error}` };
      }

      const userId = ctx?.userId || ctx?.from || "unknown";
      const result = handleStop(args.channel, userId);
      logger.info({ command: "stop", channel: args.channel, userId }, "tool_executed");
      return { content: result };
    },
  });

  // ==========================================================================
  // [TOOL:TAKEOVER] Register /takeover command
  // ==========================================================================

  api.registerTool({
    name: "supervisor_takeover",
    description:
      "Assume controle manual de um canal. Uso: supervisor_takeover(channel='whatsapp'). Voce respondera manualmente todas as mensagens deste canal.",
    inputSchema: {
      type: "object" as const,
      properties: {
        channel: {
          type: "string",
          description: "Canal a assumir controle manual",
        },
      },
      required: ["channel"],
    },
    handler: async (args: any, ctx: any) => {
      const validation = validateChannelId(args.channel);
      if (!validation.valid) {
        return { content: `Erro: ${validation.error}` };
      }

      const userId = ctx?.userId || ctx?.from || "unknown";
      const result = handleTakeover(args.channel, userId);
      logger.info({ command: "takeover", channel: args.channel, userId }, "tool_executed");
      return { content: result };
    },
  });

  // ==========================================================================
  // [TOOL:RELEASE] Register /release command
  // ==========================================================================

  api.registerTool({
    name: "supervisor_release",
    description:
      "Devolve controle de um canal ao bot. Uso: supervisor_release(channel='whatsapp'). Bot voltara a responder automaticamente.",
    inputSchema: {
      type: "object" as const,
      properties: {
        channel: {
          type: "string",
          description: "Canal a devolver ao bot",
        },
      },
      required: ["channel"],
    },
    handler: async (args: any, ctx: any) => {
      const validation = validateChannelId(args.channel);
      if (!validation.valid) {
        return { content: `Erro: ${validation.error}` };
      }

      const userId = ctx?.userId || ctx?.from || "unknown";
      const result = handleRelease(args.channel, userId);
      logger.info({ command: "release", channel: args.channel, userId }, "tool_executed");
      return { content: result };
    },
  });

  // ==========================================================================
  // [PLUGIN:READY] Log successful registration
  // ==========================================================================

  logger.info(
    {
      version: "1.0.0",
      tools: 5,
      hooks: ["message_sending", "message_received"],
      channels: knownChannels,
      supervisorConfigured: isSupervisorConfigured(),
    },
    "plugin_registered"
  );

  pluginLogger.info(
    `Aleff Supervisor v1.0 registered with 5 tools and message hooks. ` +
      `Supervisor ${isSupervisorConfigured() ? "configured" : "not configured"}.`
  );
}
