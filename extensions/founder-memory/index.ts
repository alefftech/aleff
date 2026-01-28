import type { MoltbotPluginApi } from "../../src/plugins/types.js";
import { persistMessage } from "./src/persist.js";
import { isPostgresConfigured } from "./src/postgres.js";
import {
  createSaveToMemoryTool,
  createSearchMemoryTool,
  createGetContextTool,
  createKnowledgeGraphTool,
  createFindConnectionTool,
  createLearnFactTool,
} from "./src/tools.js";

export default function register(api: MoltbotPluginApi) {
  const logger = api.logger;

  // Check configuration on startup
  if (!isPostgresConfigured()) {
    logger.warn(
      "Founder Memory: PostgreSQL not configured. " +
        "Set DATABASE_URL or POSTGRES_* env vars to enable persistence.",
    );
  } else {
    logger.info("Founder Memory: PostgreSQL configured. Persistence enabled.");
  }

  // Register tools for the agent
  api.registerTool(createSaveToMemoryTool(), { optional: true });
  api.registerTool(createSearchMemoryTool(), { optional: true });
  api.registerTool(createGetContextTool(), { optional: true });

  // Knowledge graph tools
  api.registerTool(createKnowledgeGraphTool(), { optional: true });
  api.registerTool(createFindConnectionTool(), { optional: true });
  api.registerTool(createLearnFactTool(), { optional: true });

  // Hook: Persist inbound messages
  api.on("message_received", async (event, ctx) => {
    logger.info(`[founder-memory] message_received from=${event.from} channel=${ctx.channelId}`);
    
    if (!isPostgresConfigured()) {
      logger.warn("[founder-memory] Postgres not configured, skipping persist");
      return;
    }

    try {
      const result = await persistMessage({
        userId: event.from,
        channel: ctx.channelId,
        role: "user",
        content: event.content,
        metadata: {
          timestamp: event.timestamp,
          conversationId: ctx.conversationId,
          accountId: ctx.accountId,
          ...event.metadata,
        },
      });
      logger.info(`[founder-memory] Inbound message persisted: ${result}`);
    } catch (err) {
      logger.warn(`[founder-memory] Failed to persist inbound message: ${err}`);
    }
  });

  // Hook: Persist outbound messages
  api.on("message_sent", async (event, ctx) => {
    logger.info(`[founder-memory] message_sent to=${event.to} success=${event.success} channel=${ctx.channelId}`);
    
    if (!isPostgresConfigured()) {
      logger.warn("[founder-memory] Postgres not configured, skipping persist");
      return;
    }
    
    if (!event.success) {
      logger.info("[founder-memory] Message not successful, skipping persist");
      return;
    }

    try {
      const result = await persistMessage({
        userId: event.to,
        channel: ctx.channelId,
        role: "assistant",
        content: event.content,
        metadata: {
          conversationId: ctx.conversationId,
          accountId: ctx.accountId,
        },
      });
      logger.info(`[founder-memory] Outbound message persisted: ${result}`);
    } catch (err) {
      logger.warn(`[founder-memory] Failed to persist outbound message: ${err}`);
    }
  });

  logger.info("Founder Memory plugin registered with message hooks and memory tools.");
}
