/**
 * [CLIENT:PRESENCE] Presence Manager
 *
 * Manages typing indicators with automatic keep-alive.
 *
 * Flow:
 * 1. Message received → markAsRead() + startTyping()
 * 2. Processing (LLM call) → Keep-alive every 3s
 * 3. Response ready → stopTyping() + sendMessage()
 *
 * Usage:
 *   const pm = new PresenceManager(client);
 *   pm.startTyping(chatId);
 *   // ... do work ...
 *   pm.stopTyping(chatId);
 */

import type { WhatsAppClient } from "./singleton.js";
import type { PresenceType } from "../types/presence.js";
import { logger } from "../logger.js";

// =============================================================================
// [CONFIG:DEFAULTS] Presence configuration
// =============================================================================

const DEFAULT_KEEPALIVE_MS = 3000; // Send typing every 3s
const DEFAULT_TIMEOUT_MS = 60000; // Auto-stop after 60s

// =============================================================================
// [TYPE:SESSION] Active typing session
// =============================================================================

interface TypingSession {
  chatId: string;
  type: PresenceType;
  intervalId: NodeJS.Timeout;
  timeoutId: NodeJS.Timeout;
  startedAt: number;
}

// =============================================================================
// [CLASS:PRESENCE_MANAGER] Presence Manager
// =============================================================================

export class PresenceManager {
  private client: WhatsAppClient;
  private sessions: Map<string, TypingSession> = new Map();
  private keepAliveMs: number;
  private timeoutMs: number;

  constructor(
    client: WhatsAppClient,
    options?: { keepAliveMs?: number; timeoutMs?: number }
  ) {
    this.client = client;
    this.keepAliveMs = options?.keepAliveMs ?? DEFAULT_KEEPALIVE_MS;
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  // ===========================================================================
  // [METHOD:START] Start typing indicator with keep-alive
  // ===========================================================================

  startTyping(chatId: string, type: PresenceType = "composing"): void {
    // [GUARD:EXISTING] Stop existing session if any
    if (this.sessions.has(chatId)) {
      this.stopTyping(chatId);
    }

    // [GUARD:CLIENT] Check if client is configured
    if (!this.client.isConfigured()) {
      logger.warn({ chatId }, "presence_skipped_no_client");
      return;
    }

    // [SEND:INITIAL] Send initial presence
    this.sendPresence(chatId, type);

    // [INTERVAL:KEEPALIVE] Set up keep-alive interval
    const intervalId = setInterval(() => {
      this.sendPresence(chatId, type);
    }, this.keepAliveMs);

    // [TIMEOUT:AUTO_STOP] Auto-stop after timeout
    const timeoutId = setTimeout(() => {
      logger.warn(
        { chatId, timeoutMs: this.timeoutMs },
        "presence_auto_stopped_timeout"
      );
      this.stopTyping(chatId);
    }, this.timeoutMs);

    // [SESSION:STORE] Store session
    this.sessions.set(chatId, {
      chatId,
      type,
      intervalId,
      timeoutId,
      startedAt: Date.now(),
    });

    logger.info({ chatId, type }, "presence_started");
  }

  // ===========================================================================
  // [METHOD:STOP] Stop typing indicator
  // ===========================================================================

  stopTyping(chatId: string): void {
    const session = this.sessions.get(chatId);
    if (!session) {
      return;
    }

    // [CLEANUP:TIMERS] Clear timers
    clearInterval(session.intervalId);
    clearTimeout(session.timeoutId);

    // [SEND:PAUSED] Send paused presence
    this.sendPresence(chatId, "paused");

    // [SESSION:REMOVE] Remove session
    this.sessions.delete(chatId);

    const durationMs = Date.now() - session.startedAt;
    logger.info({ chatId, durationMs }, "presence_stopped");
  }

  // ===========================================================================
  // [METHOD:STOP_ALL] Stop all typing indicators
  // ===========================================================================

  stopAll(): void {
    for (const chatId of this.sessions.keys()) {
      this.stopTyping(chatId);
    }
    logger.info({}, "presence_all_stopped");
  }

  // ===========================================================================
  // [METHOD:RECORDING] Start recording indicator
  // ===========================================================================

  startRecording(chatId: string): void {
    this.startTyping(chatId, "recording");
  }

  // ===========================================================================
  // [METHOD:MARK_READ] Mark chat as read
  // ===========================================================================

  async markAsRead(chatId: string, messageId?: string): Promise<void> {
    if (!this.client.isConfigured()) {
      logger.warn({ chatId }, "mark_read_skipped_no_client");
      return;
    }

    try {
      await this.client.presence.markAsRead(chatId, { messageId });
      logger.info({ chatId, messageId }, "chat_marked_as_read");
    } catch (error: any) {
      logger.error(
        { chatId, messageId, error: error.message },
        "mark_read_failed"
      );
    }
  }

  // ===========================================================================
  // [METHOD:IS_TYPING] Check if typing in chat
  // ===========================================================================

  isTyping(chatId: string): boolean {
    return this.sessions.has(chatId);
  }

  // ===========================================================================
  // [METHOD:ACTIVE_SESSIONS] Get active session count
  // ===========================================================================

  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  // ===========================================================================
  // [PRIVATE:SEND] Send presence update
  // ===========================================================================

  private async sendPresence(chatId: string, type: PresenceType): Promise<void> {
    try {
      await this.client.presence.sendPresence(chatId, type);
      logger.debug({ chatId, type }, "presence_sent");
    } catch (error: any) {
      logger.error(
        { chatId, type, error: error.message },
        "presence_send_failed"
      );
    }
  }
}

// =============================================================================
// [SINGLETON:MANAGER] Global presence manager instance
// =============================================================================

const MANAGER_SYMBOL = Symbol.for("aleffai.whatsapp.presence-manager");

interface GlobalWithManager {
  [MANAGER_SYMBOL]?: PresenceManager;
}

export function getPresenceManager(client: WhatsAppClient): PresenceManager {
  const globalObj = globalThis as GlobalWithManager;

  if (!globalObj[MANAGER_SYMBOL]) {
    globalObj[MANAGER_SYMBOL] = new PresenceManager(client);
    logger.info({}, "presence_manager_created");
  }

  return globalObj[MANAGER_SYMBOL];
}
