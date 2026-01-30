/**
 * [CORE:EXPORTS] WhatsApp Core - Main exports
 */

// Types
export * from "./types/index.js";

// Client
export { WhatsAppClient, getWhatsAppClient, resetWhatsAppClient } from "./client/singleton.js";
export { PresenceManager, getPresenceManager } from "./client/presence-manager.js";

// Logger
export { logger } from "./logger.js";
