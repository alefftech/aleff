/**
 * [PLUGIN:MAIN] Aleff Memory v2.0
 *
 * Institutional memory plugin with:
 * - Message persistence (conversations, messages)
 * - Knowledge Graph (entities, relationships, facts)
 * - Vector search (pgvector embeddings)
 * - Auto-capture (detect & save important content)
 * - Auto-recall (inject relevant context)
 *
 * 7 Tools registered:
 * - save_to_memory, search_memory, semantic_search
 * - get_conversation_context
 * - query_knowledge_graph, find_connection, learn_fact
 */

import type { MoltbotPluginApi } from "../../src/plugins/types.js";
import { persistMessage } from "./src/persist.js";
import { isPostgresConfigured } from "./src/postgres.js";
import { captureFromConversation } from "./src/auto-capture.js";
import { recallForPrompt } from "./src/auto-recall.js";
import {
  createSaveToMemoryTool,
  createSearchMemoryTool,
  createVectorSearchTool,
  createGetContextTool,
  createKnowledgeGraphTool,
  createFindConnectionTool,
  createLearnFactTool,
} from "./src/tools.js";

// =============================================================================
// [PLUGIN:CONFIG] Plugin configuration
// =============================================================================

interface AleffMemoryConfig {
  autoCapture?: boolean;
  autoRecall?: boolean;
}

const DEFAULT_CONFIG: AleffMemoryConfig = {
  autoCapture: true,
  autoRecall: true,
};

// =============================================================================
// [PLUGIN:REGISTER] Main registration function
// =============================================================================

export default function register(api: MoltbotPluginApi, config: AleffMemoryConfig = {}) {
  const logger = api.logger;
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // [PLUGIN:STARTUP] Check configuration
  if (!isPostgresConfigured()) {
    logger.warn(
      "Aleff Memory: PostgreSQL not configured. " +
        "Set DATABASE_URL or POSTGRES_* env vars to enable persistence."
    );
  } else {
    logger.info(
      `Aleff Memory: PostgreSQL configured. autoCapture=${cfg.autoCapture} autoRecall=${cfg.autoRecall}`
    );
  }

  // ==========================================================================
  // [PLUGIN:TOOLS] Register agent tools
  // ==========================================================================

  api.registerTool(createSaveToMemoryTool());
  api.registerTool(createSearchMemoryTool());
  api.registerTool(createVectorSearchTool());
  api.registerTool(createGetContextTool());

  // Knowledge graph tools
  api.registerTool(createKnowledgeGraphTool());
  api.registerTool(createFindConnectionTool());
  api.registerTool(createLearnFactTool());

  // ==========================================================================
  // [HOOK:MESSAGE_RECEIVED] Persist inbound messages
  // ==========================================================================

  api.on("message_received", async (event, ctx) => {
    logger.info(
      `[aleff-memory] message_received from=${event.from} channel=${ctx.channelId} agent=${ctx.accountId}`
    );

    if (!isPostgresConfigured()) {
      logger.warn("[aleff-memory] Postgres not configured, skipping persist");
      return;
    }

    try {
      const result = await persistMessage({
        userId: event.from,
        channel: ctx.channelId,
        agentId: ctx.accountId,
        role: "user",
        content: event.content,
        metadata: {
          timestamp: event.timestamp,
          conversationId: ctx.conversationId,
          accountId: ctx.accountId,
          ...event.metadata,
        },
      });
      logger.info(`[aleff-memory] Inbound message persisted: ${result}`);
    } catch (err) {
      logger.warn(`[aleff-memory] Failed to persist inbound message: ${err}`);
    }
  });

  // ==========================================================================
  // [HOOK:MESSAGE_SENT] Persist outbound messages + Auto-capture
  // ==========================================================================

  api.on("message_sent", async (event, ctx) => {
    logger.info(
      `[aleff-memory] message_sent to=${event.to} success=${event.success} channel=${ctx.channelId}`
    );

    if (!isPostgresConfigured()) {
      logger.warn("[aleff-memory] Postgres not configured, skipping persist");
      return;
    }

    if (!event.success) {
      logger.info("[aleff-memory] Message not successful, skipping persist");
      return;
    }

    try {
      const result = await persistMessage({
        userId: event.to,
        channel: ctx.channelId,
        agentId: ctx.accountId,
        role: "assistant",
        content: event.content,
        metadata: {
          conversationId: ctx.conversationId,
          accountId: ctx.accountId,
        },
      });
      logger.info(`[aleff-memory] Outbound message persisted: ${result}`);

      // [HOOK:AUTO_CAPTURE] Capture important content after conversation turn
      if (cfg.autoCapture && ctx.lastUserMessage) {
        try {
          const captureResult = await captureFromConversation(
            ctx.conversationId || "unknown",
            ctx.lastUserMessage,
            event.content
          );
          if (captureResult.captured > 0) {
            logger.info(
              `[aleff-memory] Auto-captured ${captureResult.captured} items: ${captureResult.categories.join(", ")}`
            );
          }
        } catch (captureErr) {
          logger.warn(`[aleff-memory] Auto-capture failed: ${captureErr}`);
        }
      }
    } catch (err) {
      logger.warn(`[aleff-memory] Failed to persist outbound message: ${err}`);
    }
  });

  // ==========================================================================
  // [HOOK:BEFORE_AGENT] Auto-recall relevant memories (if supported)
  // ==========================================================================

  if (cfg.autoRecall && typeof api.on === "function") {
    // Note: This hook may not exist in all Moltbot versions
    // It will be silently ignored if not supported
    try {
      api.on("before_agent_start" as any, async (event: any, ctx: any) => {
        if (!isPostgresConfigured()) {
          return {};
        }

        const prompt = event?.prompt || event?.content;
        if (!prompt || typeof prompt !== "string") {
          return {};
        }

        try {
          const recallResult = await recallForPrompt(prompt);
          if (recallResult.formatted) {
            logger.info(
              `[aleff-memory] Auto-recall: ${recallResult.memories.length} memories for context`
            );
            return { prependContext: recallResult.formatted };
          }
        } catch (recallErr) {
          logger.warn(`[aleff-memory] Auto-recall failed: ${recallErr}`);
        }

        return {};
      });
    } catch (hookErr) {
      logger.info("[aleff-memory] before_agent_start hook not available in this version");
    }
  }

  // ==========================================================================
  // [PLUGIN:READY]
  // ==========================================================================

  logger.info(
    "Aleff Memory v2.0 registered with message hooks, 7 tools, auto-capture, and auto-recall."
  );
}
