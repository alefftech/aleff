/**
 * [NOTIFY:TELEGRAM] Send notifications to supervisor
 *
 * Notifies the supervisor (via Telegram) about events in child channels.
 * Used for:
 * - Incoming messages from WhatsApp/Instagram/etc. (INPUT)
 * - Outgoing bot responses (OUTPUT)
 * - State changes
 * - Errors and alerts
 */

import { sendMessageTelegram } from "../../../src/telegram/send.js";
import { logger } from "./logger.js";

// =============================================================================
// [CONFIG:SUPERVISOR] Supervisor configuration
// =============================================================================

const SUPERVISOR_TELEGRAM_ID = process.env.SUPERVISOR_TELEGRAM_ID;

// =============================================================================
// [TYPE:NOTIFICATION] Notification payload types
// =============================================================================

export interface NotificationPayload {
  type: "message_received" | "message_sent" | "state_changed" | "error" | "alert";
  channelId: string;
  from?: string;
  to?: string;
  content?: string;
  state?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// [NOTIFY:SEND] Send notification to supervisor
// =============================================================================

/**
 * [NOTIFY:SEND] Send a notification to the supervisor via Telegram
 *
 * Actually sends the notification to the supervisor's Telegram chat.
 */
export async function notifySupervisor(
  payload: NotificationPayload
): Promise<{ sent: boolean; error?: string; messageId?: string }> {
  if (!SUPERVISOR_TELEGRAM_ID) {
    logger.debug({ payload }, "supervisor_not_configured");
    return { sent: false, error: "SUPERVISOR_TELEGRAM_ID not configured" };
  }

  try {
    // [FORMAT:MESSAGE] Format notification for Telegram
    const message = formatNotificationMessage(payload);

    // [SEND:TELEGRAM] Actually send to supervisor via Telegram
    const result = await sendMessageTelegram(SUPERVISOR_TELEGRAM_ID, message, {
      verbose: false,
      textMode: "html",
      silent: false, // We want notifications
    });

    logger.info(
      {
        supervisorId: SUPERVISOR_TELEGRAM_ID,
        channelId: payload.channelId,
        type: payload.type,
        messageId: result.messageId,
        messageLength: message.length,
      },
      "notification_sent"
    );

    return { sent: true, messageId: result.messageId };
  } catch (error: any) {
    logger.error(
      {
        error: error.message,
        supervisorId: SUPERVISOR_TELEGRAM_ID,
        channelId: payload.channelId,
        type: payload.type,
      },
      "notification_failed"
    );
    return { sent: false, error: error.message };
  }
}

// =============================================================================
// [FORMAT:MESSAGE] Format notification message
// =============================================================================

/**
 * [FORMAT:MESSAGE] Format a notification payload into a readable HTML message
 */
function formatNotificationMessage(payload: NotificationPayload): string {
  const lines: string[] = [];

  // [FORMAT:HEADER] Header with icon based on type
  const channelUpper = payload.channelId.toUpperCase();

  if (payload.type === "message_received") {
    // INPUT: User message
    lines.push(`📩 <b>[INPUT] ${channelUpper}</b>`);
    if (payload.from) {
      lines.push(`👤 De: <code>${escapeHtml(payload.from)}</code>`);
    }
  } else if (payload.type === "message_sent") {
    // OUTPUT: Bot response
    lines.push(`📤 <b>[OUTPUT] ${channelUpper}</b>`);
    if (payload.to) {
      lines.push(`👤 Para: <code>${escapeHtml(payload.to)}</code>`);
    }
  } else if (payload.type === "state_changed") {
    const stateIcon = payload.state === "STOPPED" ? "⏸️" : payload.state === "TAKEOVER" ? "🎮" : "▶️";
    lines.push(`${stateIcon} <b>[STATE] ${channelUpper}</b>`);
    lines.push(`Estado: <code>${payload.state}</code>`);
  } else if (payload.type === "error") {
    lines.push(`🚨 <b>[ERROR] ${channelUpper}</b>`);
  } else {
    lines.push(`🔔 <b>[ALERT] ${channelUpper}</b>`);
  }

  // [FORMAT:METADATA] Additional metadata
  if (payload.metadata?.reason) {
    lines.push(`📋 ${escapeHtml(String(payload.metadata.reason))}`);
  }

  // [FORMAT:CONTENT] Message content
  lines.push(""); // Empty line before content
  if (payload.content) {
    const truncated =
      payload.content.length > 500
        ? payload.content.substring(0, 500) + "..."
        : payload.content;
    lines.push(`<pre>${escapeHtml(truncated)}</pre>`);
  } else {
    lines.push("<i>(sem conteúdo)</i>");
  }

  // [FORMAT:TIMESTAMP] Timestamp
  const time = new Date(payload.timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  lines.push("");
  lines.push(`🕐 ${time}`);

  return lines.join("\n");
}

/**
 * [FORMAT:ESCAPE] Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// =============================================================================
// [NOTIFY:HELPERS] Helper functions
// =============================================================================

/**
 * [NOTIFY:INPUT] Notify about an incoming user message (INPUT)
 */
export async function notifyIncomingMessage(
  channelId: string,
  from: string,
  content: string,
  state?: string
): Promise<{ sent: boolean; error?: string }> {
  return notifySupervisor({
    type: "message_received",
    channelId,
    from,
    content,
    state,
    timestamp: Date.now(),
  });
}

/**
 * [NOTIFY:OUTPUT] Notify about an outgoing bot response (OUTPUT)
 */
export async function notifyOutgoingMessage(
  channelId: string,
  to: string,
  content: string
): Promise<{ sent: boolean; error?: string }> {
  return notifySupervisor({
    type: "message_sent",
    channelId,
    to,
    content,
    timestamp: Date.now(),
  });
}

/**
 * [NOTIFY:STATE] Notify about a state change
 */
export async function notifyStateChange(
  channelId: string,
  newState: string,
  changedBy: string
): Promise<{ sent: boolean; error?: string }> {
  return notifySupervisor({
    type: "state_changed",
    channelId,
    state: newState,
    timestamp: Date.now(),
    metadata: { changedBy },
  });
}

/**
 * [NOTIFY:ERROR] Notify about an error
 */
export async function notifyError(
  channelId: string,
  errorMessage: string
): Promise<{ sent: boolean; error?: string }> {
  return notifySupervisor({
    type: "error",
    channelId,
    content: errorMessage,
    timestamp: Date.now(),
  });
}

/**
 * [NOTIFY:CHECK] Check if supervisor notifications are configured
 */
export function isSupervisorConfigured(): boolean {
  return !!SUPERVISOR_TELEGRAM_ID;
}

/**
 * [NOTIFY:GET_ID] Get the supervisor Telegram ID
 */
export function getSupervisorId(): string | undefined {
  return SUPERVISOR_TELEGRAM_ID;
}
