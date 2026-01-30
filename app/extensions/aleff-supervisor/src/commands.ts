/**
 * [COMMANDS:SUPERVISOR] Supervisor command handlers
 *
 * Implements the command logic for supervisor tools:
 * - status: List all channels and their states
 * - start: Activate a channel for automatic responses
 * - stop: Pause a channel (notify but don't respond)
 * - takeover: Supervisor takes manual control
 * - release: Return control to the bot
 */

import {
  getChannelState,
  setChannelState,
  listChannels,
  type ChannelState,
} from "./state.js";
import { logger } from "./logger.js";

// =============================================================================
// [COMMAND:STATUS] List all channels
// =============================================================================

/**
 * [COMMAND:STATUS] List all channels and their current states
 */
export function handleStatus(): string {
  const channels = listChannels();

  if (channels.size === 0) {
    return "Nenhum canal registrado.";
  }

  const lines = ["**Status dos Canais:**\n"];
  for (const [id, status] of channels) {
    const icon =
      status.state === "RUNNING"
        ? "RUNNING"
        : status.state === "STOPPED"
          ? "STOPPED"
          : "TAKEOVER";
    const emoji =
      status.state === "RUNNING"
        ? "[ON]"
        : status.state === "STOPPED"
          ? "[OFF]"
          : "[MANUAL]";
    const lastUpdate = new Date(status.updatedAt).toLocaleString("pt-BR");
    lines.push(`${emoji} **${id}**: ${icon}`);
    lines.push(`   Atualizado: ${lastUpdate} por ${status.updatedBy}`);
  }

  return lines.join("\n");
}

// =============================================================================
// [COMMAND:START] Enable channel
// =============================================================================

/**
 * [COMMAND:START] Activate a channel for automatic bot responses
 */
export function handleStart(channelId: string, userId: string): string {
  const normalized = channelId.toLowerCase().trim();
  const current = getChannelState(normalized);

  if (current === "RUNNING") {
    return `Canal **${normalized}** ja esta ativo.`;
  }

  setChannelState(normalized, "RUNNING", userId);
  logger.info({ channelId: normalized, userId }, "command_start");

  return `[OK] Canal **${normalized}** ativado. Bot respondendo automaticamente.`;
}

// =============================================================================
// [COMMAND:STOP] Pause channel
// =============================================================================

/**
 * [COMMAND:STOP] Pause a channel - bot won't respond but supervisor gets notified
 */
export function handleStop(channelId: string, userId: string): string {
  const normalized = channelId.toLowerCase().trim();
  const current = getChannelState(normalized);

  if (current === "STOPPED") {
    return `Canal **${normalized}** ja esta pausado.`;
  }

  setChannelState(normalized, "STOPPED", userId);
  logger.info({ channelId: normalized, userId }, "command_stop");

  return `[PAUSE] Canal **${normalized}** pausado. Notificacoes continuam, bot nao responde.`;
}

// =============================================================================
// [COMMAND:TAKEOVER] Supervisor takes control
// =============================================================================

/**
 * [COMMAND:TAKEOVER] Supervisor takes manual control of a channel
 * Messages will be redirected to supervisor for manual response
 */
export function handleTakeover(channelId: string, userId: string): string {
  const normalized = channelId.toLowerCase().trim();
  setChannelState(normalized, "TAKEOVER", userId);
  logger.info({ channelId: normalized, userId }, "command_takeover");

  return `[MANUAL] Voce assumiu o controle de **${normalized}**. Respostas redirecionadas para voce.`;
}

// =============================================================================
// [COMMAND:RELEASE] Return control to bot
// =============================================================================

/**
 * [COMMAND:RELEASE] Return control of a channel back to the bot
 */
export function handleRelease(channelId: string, userId: string): string {
  const normalized = channelId.toLowerCase().trim();
  const current = getChannelState(normalized);

  if (current === "RUNNING") {
    return `Canal **${normalized}** ja esta no modo automatico.`;
  }

  setChannelState(normalized, "RUNNING", userId);
  logger.info({ channelId: normalized, userId }, "command_release");

  return `[BOT] Controle de **${normalized}** devolvido ao bot.`;
}

// =============================================================================
// [COMMAND:VALIDATE] Validate channel ID
// =============================================================================

/**
 * [COMMAND:VALIDATE] Validate if a channel ID is valid
 */
export function validateChannelId(channelId: string): { valid: boolean; error?: string } {
  if (!channelId || typeof channelId !== "string") {
    return { valid: false, error: "Canal nao especificado." };
  }

  const normalized = channelId.toLowerCase().trim();
  if (normalized.length === 0) {
    return { valid: false, error: "Nome do canal vazio." };
  }

  if (normalized.length > 50) {
    return { valid: false, error: "Nome do canal muito longo (max 50 caracteres)." };
  }

  // Allow alphanumeric, underscore, and hyphen
  if (!/^[a-z0-9_-]+$/.test(normalized)) {
    return {
      valid: false,
      error: "Nome do canal invalido. Use apenas letras, numeros, _ ou -.",
    };
  }

  return { valid: true };
}
