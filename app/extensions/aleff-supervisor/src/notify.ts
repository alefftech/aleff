/**
 * [NOTIFY:TELEGRAM] Send notifications to supervisor
 *
 * Notifies the supervisor (via Telegram) about events in child channels.
 * Used for:
 * - Incoming messages from WhatsApp/Instagram/etc.
 * - State changes
 * - Errors and alerts
 */

import { logger } from "./logger.js";

// =============================================================================
// [CONFIG:SUPERVISOR] Supervisor configuration
// =============================================================================

const SUPERVISOR_TELEGRAM_ID = process.env.SUPERVISOR_TELEGRAM_ID;

// =============================================================================
// [TYPE:NOTIFICATION] Notification payload types
// =============================================================================

export interface NotificationPayload {
  type: "message_received" | "state_changed" | "error" | "alert";
  channelId: string;
  from?: string;
  content?: string;
  state?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// [NOTIFY:SEND] Send notification to supervisor
// =============================================================================

/**
 * [NOTIFY:SEND] Send a notification to the supervisor
 *
 * Note: This is a placeholder implementation. Integration with Telegram
 * outbound will be added when the notification system is connected.
 */
export async function notifySupervisor(
  payload: NotificationPayload
): Promise<{ sent: boolean; error?: string }> {
  if (!SUPERVISOR_TELEGRAM_ID) {
    logger.debug({ payload }, "supervisor_not_configured");
    return { sent: false, error: "SUPERVISOR_TELEGRAM_ID not configured" };
  }

  try {
    // [FORMAT:MESSAGE] Format notification for Telegram
    const icon =
      payload.state === "STOPPED"
        ? "[PAUSE]"
        : payload.state === "TAKEOVER"
          ? "[MANUAL]"
          : payload.type === "error"
            ? "[ERROR]"
            : "[MSG]";

    const message = formatNotificationMessage(icon, payload);

    // [SEND:TELEGRAM] Log notification for now
    // TODO: Integrate with Telegram channel outbound when available
    logger.info(
      {
        supervisorId: SUPERVISOR_TELEGRAM_ID,
        channelId: payload.channelId,
        type: payload.type,
        messageLength: message.length,
      },
      "notification_prepared"
    );

    // Return success - actual sending will be implemented with Telegram integration
    return { sent: true };
  } catch (error: any) {
    logger.error({ error: error.message, payload }, "notification_failed");
    return { sent: false, error: error.message };
  }
}

// =============================================================================
// [FORMAT:MESSAGE] Format notification message
// =============================================================================

/**
 * [FORMAT:MESSAGE] Format a notification payload into a readable message
 */
function formatNotificationMessage(
  icon: string,
  payload: NotificationPayload
): string {
  const lines: string[] = [];

  // Header
  lines.push(`${icon} **${payload.channelId.toUpperCase()}**`);

  // From (if present)
  if (payload.from) {
    lines.push(`De: ${payload.from}`);
  }

  // State (if changed)
  if (payload.state) {
    lines.push(`Estado: ${payload.state}`);
  }

  // Empty line before content
  lines.push("");

  // Content (truncated for safety)
  if (payload.content) {
    const truncated =
      payload.content.length > 500
        ? payload.content.substring(0, 500) + "..."
        : payload.content;
    lines.push(truncated);
  } else {
    lines.push("(sem conteudo)");
  }

  return lines.join("\n");
}

// =============================================================================
// [NOTIFY:HELPERS] Helper functions
// =============================================================================

/**
 * [NOTIFY:MESSAGE] Notify about an incoming message
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
