/**
 * [CONFIG:SUPERVISOR] Supervisor configuration management
 *
 * Manages supervisor settings including:
 * - Notification preferences (on/off, triggers only)
 * - Subagent configuration for filtering
 * - Trigger configuration (keywords, regex, values)
 * - Buffer and timeout settings
 */

import { logger } from "./logger.js";

// =============================================================================
// [TYPE:TRIGGER] Trigger types
// =============================================================================

export type TriggerType = "keyword" | "regex" | "value" | "sentiment";

export interface SupervisorTrigger {
  id: string;
  type: TriggerType;
  pattern: string;
  description?: string;
  enabled: boolean;
  createdAt: number;
}

// =============================================================================
// [TYPE:CONFIG] Supervisor configuration interface
// =============================================================================

export interface SupervisorConfig {
  /** Whether notifications are enabled */
  notificationsEnabled: boolean;
  /** Only notify when a trigger matches */
  notifyOnlyOnTrigger: boolean;
  /** Whether subagent filtering is enabled */
  subagentEnabled: boolean;
  /** Custom prompt for subagent filtering */
  subagentPrompt?: string;
  /** Delay in ms to buffer messages before dispatch (default: 3000) */
  bufferDelayMs: number;
  /** Auto-approve timeout in ms if hook doesn't respond (default: 5000) */
  autoApproveMs: number;
  /** List of configured triggers */
  triggers: SupervisorTrigger[];
  /** Last updated timestamp */
  updatedAt: number;
  /** Who last updated the config */
  updatedBy: string;
}

// =============================================================================
// [STATE:CONFIG] In-memory config storage
// =============================================================================

const DEFAULT_CONFIG: SupervisorConfig = {
  notificationsEnabled: true,
  notifyOnlyOnTrigger: false,
  subagentEnabled: false,
  subagentPrompt: undefined,
  bufferDelayMs: 3000,
  autoApproveMs: 5000,
  triggers: [],
  updatedAt: Date.now(),
  updatedBy: "system",
};

let currentConfig: SupervisorConfig = { ...DEFAULT_CONFIG };

// =============================================================================
// [CONFIG:GETTERS] Configuration getters
// =============================================================================

/**
 * [CONFIG:GET] Get the current supervisor configuration
 */
export function getConfig(): SupervisorConfig {
  return { ...currentConfig };
}

/**
 * [CONFIG:GET_NOTIFICATIONS] Check if notifications are enabled
 */
export function isNotificationsEnabled(): boolean {
  return currentConfig.notificationsEnabled;
}

/**
 * [CONFIG:GET_ONLY_TRIGGER] Check if only notifying on triggers
 */
export function isNotifyOnlyOnTrigger(): boolean {
  return currentConfig.notifyOnlyOnTrigger;
}

/**
 * [CONFIG:GET_SUBAGENT] Check if subagent filtering is enabled
 */
export function isSubagentEnabled(): boolean {
  return currentConfig.subagentEnabled;
}

/**
 * [CONFIG:GET_SUBAGENT_PROMPT] Get the subagent prompt
 */
export function getSubagentPrompt(): string | undefined {
  return currentConfig.subagentPrompt;
}

/**
 * [CONFIG:GET_BUFFER_DELAY] Get buffer delay in ms
 */
export function getBufferDelayMs(): number {
  return currentConfig.bufferDelayMs;
}

/**
 * [CONFIG:GET_AUTO_APPROVE] Get auto-approve timeout in ms
 */
export function getAutoApproveMs(): number {
  return currentConfig.autoApproveMs;
}

/**
 * [CONFIG:GET_TRIGGERS] Get all configured triggers
 */
export function getTriggers(): SupervisorTrigger[] {
  return [...currentConfig.triggers];
}

// =============================================================================
// [CONFIG:SETTERS] Configuration setters
// =============================================================================

/**
 * [CONFIG:SET_NOTIFICATIONS] Enable/disable notifications
 */
export function setNotificationsEnabled(
  enabled: boolean,
  onlyOnTrigger: boolean,
  updatedBy: string
): void {
  const previous = {
    enabled: currentConfig.notificationsEnabled,
    onlyOnTrigger: currentConfig.notifyOnlyOnTrigger,
  };

  currentConfig.notificationsEnabled = enabled;
  currentConfig.notifyOnlyOnTrigger = onlyOnTrigger;
  currentConfig.updatedAt = Date.now();
  currentConfig.updatedBy = updatedBy;

  logger.info(
    {
      previous,
      current: { enabled, onlyOnTrigger },
      updatedBy,
    },
    "config_notifications_changed"
  );
}

/**
 * [CONFIG:SET_SUBAGENT] Configure subagent filtering
 */
export function setSubagentConfig(
  enabled: boolean,
  prompt: string | undefined,
  updatedBy: string
): void {
  const previous = {
    enabled: currentConfig.subagentEnabled,
    prompt: currentConfig.subagentPrompt,
  };

  currentConfig.subagentEnabled = enabled;
  currentConfig.subagentPrompt = prompt;
  currentConfig.updatedAt = Date.now();
  currentConfig.updatedBy = updatedBy;

  logger.info(
    {
      previous: { enabled: previous.enabled, hasPrompt: !!previous.prompt },
      current: { enabled, hasPrompt: !!prompt },
      updatedBy,
    },
    "config_subagent_changed"
  );
}

/**
 * [CONFIG:SET_TIMINGS] Configure buffer and auto-approve timings
 */
export function setTimings(
  bufferDelayMs: number,
  autoApproveMs: number,
  updatedBy: string
): void {
  const previous = {
    bufferDelayMs: currentConfig.bufferDelayMs,
    autoApproveMs: currentConfig.autoApproveMs,
  };

  currentConfig.bufferDelayMs = Math.max(0, Math.min(bufferDelayMs, 30000));
  currentConfig.autoApproveMs = Math.max(1000, Math.min(autoApproveMs, 30000));
  currentConfig.updatedAt = Date.now();
  currentConfig.updatedBy = updatedBy;

  logger.info(
    { previous, current: { bufferDelayMs, autoApproveMs }, updatedBy },
    "config_timings_changed"
  );
}

// =============================================================================
// [CONFIG:TRIGGERS] Trigger management
// =============================================================================

/**
 * [CONFIG:ADD_TRIGGER] Add a new trigger
 */
export function addTrigger(
  type: TriggerType,
  pattern: string,
  description: string | undefined,
  updatedBy: string
): SupervisorTrigger {
  const trigger: SupervisorTrigger = {
    id: `trigger_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    pattern,
    description,
    enabled: true,
    createdAt: Date.now(),
  };

  currentConfig.triggers.push(trigger);
  currentConfig.updatedAt = Date.now();
  currentConfig.updatedBy = updatedBy;

  logger.info(
    { triggerId: trigger.id, type, pattern, updatedBy },
    "config_trigger_added"
  );

  return trigger;
}

/**
 * [CONFIG:REMOVE_TRIGGER] Remove a trigger by ID
 */
export function removeTrigger(triggerId: string, updatedBy: string): boolean {
  const index = currentConfig.triggers.findIndex((t) => t.id === triggerId);
  if (index === -1) {
    return false;
  }

  const removed = currentConfig.triggers.splice(index, 1)[0];
  currentConfig.updatedAt = Date.now();
  currentConfig.updatedBy = updatedBy;

  logger.info(
    { triggerId, type: removed.type, pattern: removed.pattern, updatedBy },
    "config_trigger_removed"
  );

  return true;
}

/**
 * [CONFIG:TOGGLE_TRIGGER] Enable/disable a trigger
 */
export function toggleTrigger(
  triggerId: string,
  enabled: boolean,
  updatedBy: string
): boolean {
  const trigger = currentConfig.triggers.find((t) => t.id === triggerId);
  if (!trigger) {
    return false;
  }

  trigger.enabled = enabled;
  currentConfig.updatedAt = Date.now();
  currentConfig.updatedBy = updatedBy;

  logger.info(
    { triggerId, enabled, updatedBy },
    "config_trigger_toggled"
  );

  return true;
}

/**
 * [CONFIG:CLEAR_TRIGGERS] Remove all triggers
 */
export function clearTriggers(updatedBy: string): number {
  const count = currentConfig.triggers.length;
  currentConfig.triggers = [];
  currentConfig.updatedAt = Date.now();
  currentConfig.updatedBy = updatedBy;

  logger.info({ count, updatedBy }, "config_triggers_cleared");

  return count;
}

// =============================================================================
// [CONFIG:RESET] Reset configuration
// =============================================================================

/**
 * [CONFIG:RESET] Reset configuration to defaults
 */
export function resetConfig(updatedBy: string): void {
  currentConfig = {
    ...DEFAULT_CONFIG,
    updatedAt: Date.now(),
    updatedBy,
  };

  logger.info({ updatedBy }, "config_reset");
}

// =============================================================================
// [CONFIG:FORMAT] Format configuration for display
// =============================================================================

/**
 * [CONFIG:FORMAT] Format configuration as a readable string
 */
export function formatConfig(): string {
  const lines: string[] = [];

  lines.push("**Configuracao do Supervisor:**\n");

  // Notifications
  const notifyStatus = currentConfig.notificationsEnabled
    ? currentConfig.notifyOnlyOnTrigger
      ? "[ON] Apenas triggers"
      : "[ON] Todas mensagens"
    : "[OFF] Desativado";
  lines.push(`Notificacoes: ${notifyStatus}`);

  // Subagent
  const subagentStatus = currentConfig.subagentEnabled
    ? "[ON] Ativo"
    : "[OFF] Desativado";
  lines.push(`Subagent: ${subagentStatus}`);
  if (currentConfig.subagentEnabled && currentConfig.subagentPrompt) {
    lines.push(`  Prompt: "${currentConfig.subagentPrompt.substring(0, 50)}..."`);
  }

  // Timings
  lines.push(`\nTimings:`);
  lines.push(`  Buffer: ${currentConfig.bufferDelayMs}ms`);
  lines.push(`  Auto-approve: ${currentConfig.autoApproveMs}ms`);

  // Triggers
  lines.push(`\nTriggers: ${currentConfig.triggers.length}`);
  for (const trigger of currentConfig.triggers) {
    const status = trigger.enabled ? "[ON]" : "[OFF]";
    lines.push(`  ${status} [${trigger.type}] ${trigger.pattern}`);
    if (trigger.description) {
      lines.push(`      ${trigger.description}`);
    }
  }

  // Metadata
  const lastUpdate = new Date(currentConfig.updatedAt).toLocaleString("pt-BR");
  lines.push(`\nAtualizado: ${lastUpdate} por ${currentConfig.updatedBy}`);

  return lines.join("\n");
}
