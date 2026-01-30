/**
 * [PLUGIN:MAIN] Aleff Supervisor Plugin v2.0
 *
 * Cross-channel supervisor for AleffAI - control WhatsApp, Instagram, etc. from Telegram.
 *
 * Features:
 * - Channel state management (RUNNING, STOPPED, TAKEOVER)
 * - Message interception based on state
 * - Supervisor notifications for incoming messages
 * - before_agent_dispatch hook for intercepting BEFORE bot responds
 * - Configurable notifications (on/off, triggers only)
 * - Optional subagent filtering
 * - Trigger-based notification rules
 *
 * Tools registered (9 total):
 * Channel Control (5):
 * - supervisor_status: List all channels and their states
 * - supervisor_start: Activate a channel for automatic responses
 * - supervisor_stop: Pause a channel (notify but don't respond)
 * - supervisor_takeover: Supervisor takes manual control
 * - supervisor_release: Return control to the bot
 *
 * Configuration (4):
 * - supervisor_config: View current configuration
 * - supervisor_notifications: Enable/disable notifications
 * - supervisor_subagent: Configure subagent filtering
 * - supervisor_triggers: Manage notification triggers
 *
 * Hooks:
 * - message_sending: Block messages based on channel state
 * - message_received: Notify supervisor of incoming messages
 * - before_agent_dispatch: Intercept messages before bot responds
 *
 * @version 2.0.0
 * @created 2026-01-30
 */

import type { MoltbotPluginApi } from "../../src/plugins/types.js";
import { type AnyAgentTool, jsonResult } from "../../src/agents/tools/common.js";
import { logger } from "./src/logger.js";
import { setChannelState, getChannelState, isChannelBlocked } from "./src/state.js";
import {
  handleStatus,
  handleStart,
  handleStop,
  handleTakeover,
  handleRelease,
  validateChannelId,
} from "./src/commands.js";
import { onMessageSending, onMessageReceived } from "./src/hooks.js";
import { isSupervisorConfigured, getSupervisorId, notifySupervisor } from "./src/notify.js";
import {
  formatConfig,
  setNotificationsEnabled,
  setSubagentConfig,
  addTrigger,
  removeTrigger,
  clearTriggers,
  isNotificationsEnabled,
  isNotifyOnlyOnTrigger,
  type TriggerType,
} from "./src/config.js";
import { analyzeTriggers, formatTriggers } from "./src/triggers.js";
import { runFilterSubagent, getSubagentStatus } from "./src/subagent.js";

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
// [TOOLS:CHANNEL] Channel control tools (5)
// =============================================================================

function createStatusTool(): AnyAgentTool {
  return {
    name: "supervisor_status",
    description:
      "Lista status de todos os canais supervisionados. Use para ver quais canais estao ativos, pausados ou em controle manual.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    async execute(_toolCallId: string, _params: Record<string, never>) {
      const result = handleStatus();
      logger.info({ command: "status" }, "tool_executed");
      return jsonResult({ success: true, message: result });
    },
  };
}

function createStartTool(): AnyAgentTool {
  return {
    name: "supervisor_start",
    description:
      "Ativa um canal para responder automaticamente. Uso: supervisor_start(channel='whatsapp'). O bot voltara a responder mensagens neste canal.",
    parameters: {
      type: "object",
      properties: {
        channel: {
          type: "string",
          description: "Canal a ativar (whatsapp, instagram, telegram, etc)",
        },
      },
      required: ["channel"],
    },
    async execute(_toolCallId: string, params: { channel: string }) {
      const validation = validateChannelId(params?.channel);
      if (!validation.valid) {
        return jsonResult({ success: false, error: validation.error });
      }

      const result = handleStart(params.channel, "supervisor");
      logger.info({ command: "start", channel: params.channel }, "tool_executed");
      return jsonResult({ success: true, message: result });
    },
  };
}

function createStopTool(): AnyAgentTool {
  return {
    name: "supervisor_stop",
    description:
      "Pausa um canal - bot nao responde mas voce recebe notificacoes. Uso: supervisor_stop(channel='whatsapp'). Util para quando precisa monitorar sem intervir.",
    parameters: {
      type: "object",
      properties: {
        channel: {
          type: "string",
          description: "Canal a pausar",
        },
      },
      required: ["channel"],
    },
    async execute(_toolCallId: string, params: { channel: string }) {
      const validation = validateChannelId(params?.channel);
      if (!validation.valid) {
        return jsonResult({ success: false, error: validation.error });
      }

      const result = handleStop(params.channel, "supervisor");
      logger.info({ command: "stop", channel: params.channel }, "tool_executed");
      return jsonResult({ success: true, message: result });
    },
  };
}

function createTakeoverTool(): AnyAgentTool {
  return {
    name: "supervisor_takeover",
    description:
      "Assume controle manual de um canal. Uso: supervisor_takeover(channel='whatsapp'). Voce respondera manualmente todas as mensagens deste canal.",
    parameters: {
      type: "object",
      properties: {
        channel: {
          type: "string",
          description: "Canal a assumir controle manual",
        },
      },
      required: ["channel"],
    },
    async execute(_toolCallId: string, params: { channel: string }) {
      const validation = validateChannelId(params?.channel);
      if (!validation.valid) {
        return jsonResult({ success: false, error: validation.error });
      }

      const result = handleTakeover(params.channel, "supervisor");
      logger.info({ command: "takeover", channel: params.channel }, "tool_executed");
      return jsonResult({ success: true, message: result });
    },
  };
}

function createReleaseTool(): AnyAgentTool {
  return {
    name: "supervisor_release",
    description:
      "Devolve controle de um canal ao bot. Uso: supervisor_release(channel='whatsapp'). Bot voltara a responder automaticamente.",
    parameters: {
      type: "object",
      properties: {
        channel: {
          type: "string",
          description: "Canal a devolver ao bot",
        },
      },
      required: ["channel"],
    },
    async execute(_toolCallId: string, params: { channel: string }) {
      const validation = validateChannelId(params?.channel);
      if (!validation.valid) {
        return jsonResult({ success: false, error: validation.error });
      }

      const result = handleRelease(params.channel, "supervisor");
      logger.info({ command: "release", channel: params.channel }, "tool_executed");
      return jsonResult({ success: true, message: result });
    },
  };
}

// =============================================================================
// [TOOLS:CONFIG] Configuration tools (4)
// =============================================================================

function createConfigTool(): AnyAgentTool {
  return {
    name: "supervisor_config",
    description:
      "Mostra a configuracao atual do supervisor. Inclui notificacoes, subagent, triggers e timings.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    async execute(_toolCallId: string, _params: Record<string, never>) {
      const result = formatConfig();
      logger.info({ command: "config" }, "tool_executed");
      return jsonResult({ success: true, message: result });
    },
  };
}

function createNotificationsTool(): AnyAgentTool {
  return {
    name: "supervisor_notifications",
    description:
      "Configura notificacoes do supervisor. Uso: supervisor_notifications(enabled=true, onlyOnTrigger=false). enabled=false desliga todas notificacoes. onlyOnTrigger=true notifica apenas quando trigger corresponde.",
    parameters: {
      type: "object",
      properties: {
        enabled: {
          type: "boolean",
          description: "Ativar (true) ou desativar (false) notificacoes",
        },
        onlyOnTrigger: {
          type: "boolean",
          description: "Se true, notifica apenas quando um trigger corresponde",
        },
      },
      required: ["enabled"],
    },
    async execute(
      _toolCallId: string,
      params: { enabled: boolean; onlyOnTrigger?: boolean }
    ) {
      const enabled = params.enabled ?? true;
      const onlyOnTrigger = params.onlyOnTrigger ?? false;

      setNotificationsEnabled(enabled, onlyOnTrigger, "supervisor");

      const status = enabled
        ? onlyOnTrigger
          ? "[ON] Notificacoes ativadas (apenas triggers)"
          : "[ON] Notificacoes ativadas (todas mensagens)"
        : "[OFF] Notificacoes desativadas";

      logger.info(
        { command: "notifications", enabled, onlyOnTrigger },
        "tool_executed"
      );
      return jsonResult({ success: true, message: status });
    },
  };
}

function createSubagentTool(): AnyAgentTool {
  return {
    name: "supervisor_subagent",
    description:
      "Configura subagent de filtragem (Claude Haiku). Uso: supervisor_subagent(enabled=true, prompt='Notifique apenas se urgente'). O subagent analisa mensagens e decide se deve notificar. Custo: ~$0.03/100 mensagens.",
    parameters: {
      type: "object",
      properties: {
        enabled: {
          type: "boolean",
          description: "Ativar (true) ou desativar (false) subagent",
        },
        prompt: {
          type: "string",
          description:
            "Prompt customizado para o subagent. Ex: 'Notifique apenas se urgente, reclamacao, ou valor > R$10.000'",
        },
      },
      required: ["enabled"],
    },
    async execute(
      _toolCallId: string,
      params: { enabled: boolean; prompt?: string }
    ) {
      const enabled = params.enabled ?? false;
      const prompt = params.prompt;

      setSubagentConfig(enabled, prompt, "supervisor");

      const status = getSubagentStatus();
      const message = enabled
        ? `[ON] Subagent ativado.${status.hasCustomPrompt ? " Prompt customizado configurado." : ""}`
        : "[OFF] Subagent desativado.";

      logger.info(
        { command: "subagent", enabled, hasPrompt: !!prompt },
        "tool_executed"
      );
      return jsonResult({ success: true, message });
    },
  };
}

function createTriggersTool(): AnyAgentTool {
  return {
    name: "supervisor_triggers",
    description:
      "Gerencia triggers de notificacao. Acoes: list (listar), add (adicionar), remove (remover), clear (limpar todos). Tipos: keyword, regex, value, sentiment.",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["list", "add", "remove", "clear"],
          description: "Acao: list, add, remove, clear",
        },
        type: {
          type: "string",
          enum: ["keyword", "regex", "value", "sentiment"],
          description:
            "Tipo do trigger (para add): keyword (palavras), regex (expressao regular), value (valor monetario), sentiment (sentimento)",
        },
        pattern: {
          type: "string",
          description:
            "Padrao do trigger. Para keyword: 'urgente,problema'. Para regex: 'R\\$\\d+'. Para value: '10000' (minimo). Para sentiment: 'negative' ou 'urgent'",
        },
        description: {
          type: "string",
          description: "Descricao opcional do trigger",
        },
        triggerId: {
          type: "string",
          description: "ID do trigger (para remove)",
        },
      },
      required: ["action"],
    },
    async execute(
      _toolCallId: string,
      params: {
        action: "list" | "add" | "remove" | "clear";
        type?: TriggerType;
        pattern?: string;
        description?: string;
        triggerId?: string;
      }
    ) {
      const { action, type, pattern, description, triggerId } = params;

      switch (action) {
        case "list": {
          const result = formatTriggers();
          logger.info({ command: "triggers", action: "list" }, "tool_executed");
          return jsonResult({ success: true, message: result });
        }

        case "add": {
          if (!type || !pattern) {
            return jsonResult({
              success: false,
              error: "Parametros 'type' e 'pattern' sao obrigatorios para add.",
            });
          }
          const trigger = addTrigger(type, pattern, description, "supervisor");
          logger.info(
            { command: "triggers", action: "add", triggerId: trigger.id },
            "tool_executed"
          );
          return jsonResult({
            success: true,
            message: `[OK] Trigger adicionado: [${type}] ${pattern} (ID: ${trigger.id})`,
          });
        }

        case "remove": {
          if (!triggerId) {
            return jsonResult({
              success: false,
              error: "Parametro 'triggerId' e obrigatorio para remove.",
            });
          }
          const removed = removeTrigger(triggerId, "supervisor");
          logger.info(
            { command: "triggers", action: "remove", triggerId, removed },
            "tool_executed"
          );
          return jsonResult({
            success: removed,
            message: removed
              ? `[OK] Trigger ${triggerId} removido.`
              : `Trigger ${triggerId} nao encontrado.`,
          });
        }

        case "clear": {
          const count = clearTriggers("supervisor");
          logger.info(
            { command: "triggers", action: "clear", count },
            "tool_executed"
          );
          return jsonResult({
            success: true,
            message: `[OK] ${count} triggers removidos.`,
          });
        }

        default:
          return jsonResult({
            success: false,
            error: `Acao invalida: ${action}. Use: list, add, remove, clear.`,
          });
      }
    },
  };
}

// =============================================================================
// [HOOK:BEFORE_DISPATCH] Before agent dispatch handler
// =============================================================================

/**
 * [HOOK:BEFORE_DISPATCH] Handle before_agent_dispatch hook
 *
 * This hook fires BEFORE the bot starts processing a message.
 * Allows the supervisor to:
 * - See the message before the bot responds
 * - Intercept and block the bot's response
 * - Modify the message content before processing
 */
async function onBeforeAgentDispatch(
  event: {
    from: string;
    content: string;
    timestamp: number;
    totalBuffered: number;
    channelId: string;
    conversationId?: string;
    messageId?: string;
    metadata?: Record<string, unknown>;
  },
  ctx: {
    channelId: string;
    accountId?: string;
    conversationId?: string;
  }
): Promise<{
  action: "approve" | "intercept" | "modify";
  modifiedContent?: string;
  interceptReason?: string;
  supervisorNotified?: boolean;
}> {
  const channelId = ctx.channelId?.toLowerCase() || event.channelId?.toLowerCase() || "unknown";
  const startTime = Date.now();

  // [STATE:CHECK] If channel is blocked (STOPPED/TAKEOVER), intercept
  if (isChannelBlocked(channelId)) {
    const state = getChannelState(channelId);
    logger.info(
      { channelId, state, from: event.from },
      "before_dispatch_intercepted_by_state"
    );
    return {
      action: "intercept",
      interceptReason: `Canal ${channelId} em estado ${state}`,
      supervisorNotified: true,
    };
  }

  // [NOTIFY:CHECK] Check if notifications are enabled
  if (!isNotificationsEnabled()) {
    logger.debug({ channelId }, "before_dispatch_notifications_disabled");
    return { action: "approve", supervisorNotified: false };
  }

  // [TRIGGER:CHECK] If only notifying on triggers, check triggers
  const onlyOnTrigger = isNotifyOnlyOnTrigger();
  let shouldNotify = !onlyOnTrigger; // If not only on trigger, default to notify
  let notifyReason = "Mensagem recebida";

  if (onlyOnTrigger) {
    const triggerResult = analyzeTriggers(
      event.content,
      event.from,
      event.metadata
    );
    shouldNotify = triggerResult.matched;
    if (triggerResult.matched) {
      notifyReason = triggerResult.reasons.join(", ");
    }
  }

  // [SUBAGENT:CHECK] If subagent is enabled, let it decide
  const subagentStatus = getSubagentStatus();
  if (subagentStatus.enabled && shouldNotify) {
    try {
      const filterResult = await runFilterSubagent(
        event.content,
        event.from,
        channelId
      );
      shouldNotify = filterResult.shouldNotify;
      if (filterResult.shouldNotify) {
        notifyReason = filterResult.reason;
      }
    } catch (error: any) {
      // On subagent error, default to notify
      logger.warn(
        { error: error.message, channelId },
        "before_dispatch_subagent_error"
      );
    }
  }

  // [NOTIFY:SEND] Send notification to supervisor
  if (shouldNotify && isSupervisorConfigured()) {
    await notifySupervisor({
      type: "message_received",
      channelId,
      from: event.from,
      content: event.content.substring(0, 500),
      timestamp: event.timestamp,
      metadata: {
        reason: notifyReason,
        bufferedCount: event.totalBuffered,
        conversationId: event.conversationId,
        messageId: event.messageId,
      },
    });
  }

  const durationMs = Date.now() - startTime;
  logger.info(
    {
      channelId,
      from: event.from,
      shouldNotify,
      onlyOnTrigger,
      subagentEnabled: subagentStatus.enabled,
      durationMs,
    },
    "before_dispatch_processed"
  );

  return {
    action: "approve",
    supervisorNotified: shouldNotify,
  };
}

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
    return onMessageSending(event, ctx);
  });

  // [HOOK:MESSAGE_RECEIVED] Notify supervisor of incoming messages (legacy)
  api.on("message_received", async (event: any, ctx: any) => {
    await onMessageReceived(event, ctx);
  });

  // [HOOK:BEFORE_AGENT_DISPATCH] New hook - intercept before bot responds
  api.on("before_agent_dispatch", async (event: any, ctx: any) => {
    return onBeforeAgentDispatch(event, ctx);
  });

  // ==========================================================================
  // [TOOL:REGISTER] Register all supervisor tools (9 total)
  // ==========================================================================

  // Channel control tools (5)
  api.registerTool(createStatusTool());
  api.registerTool(createStartTool());
  api.registerTool(createStopTool());
  api.registerTool(createTakeoverTool());
  api.registerTool(createReleaseTool());

  // Configuration tools (4)
  api.registerTool(createConfigTool());
  api.registerTool(createNotificationsTool());
  api.registerTool(createSubagentTool());
  api.registerTool(createTriggersTool());

  // ==========================================================================
  // [PLUGIN:READY] Log successful registration
  // ==========================================================================

  logger.info(
    {
      version: "2.0.0",
      tools: 9,
      hooks: ["message_sending", "message_received", "before_agent_dispatch"],
      channels: knownChannels,
      supervisorConfigured: isSupervisorConfigured(),
    },
    "plugin_registered"
  );

  pluginLogger.info(
    `Aleff Supervisor v2.0.0 registered with 9 tools and 3 hooks. ` +
      `Supervisor ${isSupervisorConfigured() ? "configured" : "not configured"}.`
  );
}
