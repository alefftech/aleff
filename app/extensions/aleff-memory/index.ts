/**
 * [PLUGIN:MAIN] Aleff Memory v2.2
 *
 * Institutional memory plugin with:
 * - Message persistence (conversations, messages)
 * - Knowledge Graph (entities, relationships, facts)
 * - Vector search (pgvector embeddings)
 * - Auto-capture (detect & save important content)
 * - Auto-recall (inject relevant context)
 *
 * 8 Tools registered:
 * - save_to_memory: Save facts/decisions explicitly
 * - search_memory: Full-text search
 * - semantic_search: Vector similarity search
 * - get_conversation_context: Recent context
 * - query_knowledge_graph: Entity lookup
 * - find_connection: Path between entities (BFS)
 * - learn_fact: Learn facts + auto-create relationships
 * - create_relationship: Manual relationship creation (NEW v2.2)
 *
 * Hooks:
 * - message_received: Persist user messages
 * - message_sent: Persist assistant messages (primary)
 * - agent_end: Persist assistant messages (fallback)
 * - before_agent_start: Auto-recall memories
 *
 * @version 2.2.0
 * @updated 2026-01-29
 */

import type { MoltbotPluginApi } from "../../src/plugins/types.js";
import { persistMessage } from "./src/persist.js";
import { isPostgresConfigured } from "./src/postgres.js";
import { captureFromConversation } from "./src/auto-capture.js";
import { recallForPrompt } from "./src/auto-recall.js";
import { logger as structuredLogger } from "./src/logger.js";
import {
  createSaveToMemoryTool,
  createSearchMemoryTool,
  createVectorSearchTool,
  createGetContextTool,
  createKnowledgeGraphTool,
  createFindConnectionTool,
  createLearnFactTool,
  createCreateRelationshipTool,
} from "./src/tools.js";

// =============================================================================
// [PLUGIN:HELPERS] Utility functions
// =============================================================================

/**
 * [HELPER:CONTENT] Extract text content from message
 *
 * Claude API messages can have content as:
 * - string: "Hello world"
 * - array: [{ type: "text", text: "Hello world" }]
 *
 * This helper normalizes both formats.
 */
function extractTextContent(content: unknown): string | null {
  // Case 1: Direct string
  if (typeof content === "string") {
    return content;
  }

  // Case 2: Array of content blocks (Claude API format)
  if (Array.isArray(content)) {
    const textParts: string[] = [];
    for (const block of content) {
      if (block && typeof block === "object" && "type" in block) {
        if (block.type === "text" && typeof block.text === "string") {
          textParts.push(block.text);
        }
      }
    }
    return textParts.length > 0 ? textParts.join("\n") : null;
  }

  return null;
}

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
    structuredLogger.warn(
      { autoCapture: cfg.autoCapture, autoRecall: cfg.autoRecall },
      "postgres_not_configured"
    );
    logger.warn(
      "Aleff Memory: PostgreSQL not configured. " +
        "Set DATABASE_URL or POSTGRES_* env vars to enable persistence."
    );
  } else {
    structuredLogger.info(
      { autoCapture: cfg.autoCapture, autoRecall: cfg.autoRecall, postgresConfigured: true },
      "plugin_startup"
    );
    logger.info(
      `Aleff Memory: PostgreSQL configured. autoCapture=${cfg.autoCapture} autoRecall=${cfg.autoRecall}`
    );
  }

  // ==========================================================================
  // [PLUGIN:TOOLS] Register agent tools (8 total)
  // ==========================================================================

  // Memory tools (4)
  api.registerTool(createSaveToMemoryTool());
  api.registerTool(createSearchMemoryTool());
  api.registerTool(createVectorSearchTool());
  api.registerTool(createGetContextTool());

  // Knowledge graph tools (4)
  api.registerTool(createKnowledgeGraphTool());
  api.registerTool(createFindConnectionTool());
  api.registerTool(createLearnFactTool());
  api.registerTool(createCreateRelationshipTool()); // NEW: Manual relationship creation

  // ==========================================================================
  // [HOOK:MESSAGE_RECEIVED] Persist inbound messages
  // ==========================================================================

  api.on("message_received", async (event, ctx) => {
    structuredLogger.info(
      {
        hook: "message_received",
        from: event.from,
        channelId: ctx.channelId,
        accountId: ctx.accountId,
        contentLength: event.content?.length ?? 0,
      },
      "message_received_triggered"
    );

    if (!isPostgresConfigured()) {
      structuredLogger.warn({ hook: "message_received" }, "postgres_not_configured_skipping");
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
      structuredLogger.info(
        {
          hook: "message_received",
          persisted: result,
          userId: event.from,
        },
        "user_message_persisted"
      );
    } catch (err) {
      structuredLogger.error(
        { hook: "message_received", error: String(err), userId: event.from },
        "persist_user_message_failed"
      );
    }
  });

  // ==========================================================================
  // [HOOK:MESSAGE_SENT] Persist outbound messages + Auto-capture
  // ==========================================================================
  // Note: This hook may not be called in all channels (e.g., Telegram).
  // The agent_end hook serves as a fallback.

  api.on("message_sent", async (event, ctx) => {
    structuredLogger.info(
      {
        hook: "message_sent",
        to: event.to,
        success: event.success,
        channelId: ctx.channelId,
        contentLength: event.content?.length ?? 0,
      },
      "message_sent_triggered"
    );

    if (!isPostgresConfigured()) {
      structuredLogger.warn({ hook: "message_sent" }, "postgres_not_configured_skipping");
      return;
    }

    if (!event.success) {
      structuredLogger.info({ hook: "message_sent", to: event.to }, "message_not_successful_skipping");
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
          source: "message_sent_hook",
        },
      });
      structuredLogger.info(
        {
          hook: "message_sent",
          persisted: result,
          to: event.to,
        },
        "assistant_message_persisted_via_message_sent"
      );

      // [AUTO_CAPTURE] Capture important content after conversation turn
      if (cfg.autoCapture && ctx.lastUserMessage) {
        try {
          const captureResult = await captureFromConversation(
            ctx.conversationId || "unknown",
            ctx.lastUserMessage,
            event.content
          );
          if (captureResult.captured > 0) {
            structuredLogger.info(
              {
                hook: "message_sent",
                captured: captureResult.captured,
                categories: captureResult.categories,
              },
              "auto_capture_from_message_sent"
            );
          }
        } catch (captureErr) {
          structuredLogger.error(
            { hook: "message_sent", error: String(captureErr) },
            "auto_capture_failed"
          );
        }
      }
    } catch (err) {
      structuredLogger.error(
        { hook: "message_sent", error: String(err), to: event.to },
        "persist_outbound_message_failed"
      );
    }
  });

  // ==========================================================================
  // [HOOK:BEFORE_AGENT] Auto-recall relevant memories (if supported)
  // ==========================================================================
  // This hook injects relevant memories into the agent context before processing.
  // Searches memory_index, facts, and messages tables using vector similarity.

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
          structuredLogger.debug(
            { hook: "before_agent_start", hasPrompt: !!prompt },
            "no_prompt_for_recall"
          );
          return {};
        }

        try {
          const recallResult = await recallForPrompt(prompt);
          if (recallResult.formatted) {
            structuredLogger.info(
              {
                hook: "before_agent_start",
                memoriesCount: recallResult.memories.length,
                topSimilarity: recallResult.memories[0]?.similarity,
                promptLength: prompt.length,
              },
              "auto_recall_injecting_context"
            );
            return { prependContext: recallResult.formatted };
          }
        } catch (recallErr) {
          structuredLogger.error(
            { hook: "before_agent_start", error: String(recallErr) },
            "auto_recall_failed"
          );
        }

        return {};
      });
    } catch (hookErr) {
      structuredLogger.info(
        { error: String(hookErr) },
        "before_agent_start_hook_not_available"
      );
    }
  }

  // ==========================================================================
  // [HOOK:AGENT_END] Persist assistant responses (fallback for message_sent)
  // ==========================================================================
  // Note: message_sent hook may not be called in all cases (e.g., Telegram),
  // so we use agent_end as a fallback to ensure assistant responses are persisted.
  //
  // IMPORTANT: Claude API messages can have content as:
  // - string: "Hello world"
  // - array: [{ type: "text", text: "Hello world" }]
  //
  // We use extractTextContent() to handle both formats.

  api.on("agent_end", async (event: any, ctx: any) => {
    // [DEBUG:AGENT_END] Log event structure for troubleshooting
    structuredLogger.info(
      {
        hook: "agent_end",
        hasMessages: Array.isArray(event?.messages),
        messagesCount: event?.messages?.length ?? 0,
        hasCtx: !!ctx,
        conversationId: ctx?.conversationId || "unknown",
        channelId: ctx?.channelId || "unknown",
        durationMs: event?.durationMs,
      },
      "agent_end_hook_triggered"
    );

    if (!isPostgresConfigured()) {
      structuredLogger.warn({ hook: "agent_end" }, "postgres_not_configured_skipping");
      return;
    }

    // [VALIDATION:MESSAGES] Extract messages array
    const messages = event?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      structuredLogger.warn(
        {
          hook: "agent_end",
          messagesType: typeof messages,
          isArray: Array.isArray(messages),
        },
        "no_messages_array_in_event"
      );
      return;
    }

    // [DEBUG:MESSAGES] Log message roles for troubleshooting
    const messageRoles = messages.map((m: any, i: number) => ({
      index: i,
      role: m?.role,
      contentType: typeof m?.content,
      isArray: Array.isArray(m?.content),
      contentLength: typeof m?.content === "string"
        ? m.content.length
        : Array.isArray(m?.content)
        ? m.content.length
        : 0,
    }));
    structuredLogger.debug(
      { hook: "agent_end", messageRoles },
      "messages_structure"
    );

    // [EXTRACT:ASSISTANT] Find the last assistant message
    const lastAssistantMsg = [...messages].reverse().find(
      (msg: any) => msg?.role === "assistant"
    );

    if (!lastAssistantMsg) {
      structuredLogger.warn(
        { hook: "agent_end", totalMessages: messages.length },
        "no_assistant_message_found"
      );
      return;
    }

    // [EXTRACT:CONTENT] Extract text from content (handles string or array)
    const textContent = extractTextContent(lastAssistantMsg.content);
    if (!textContent) {
      structuredLogger.warn(
        {
          hook: "agent_end",
          contentType: typeof lastAssistantMsg.content,
          isArray: Array.isArray(lastAssistantMsg.content),
        },
        "failed_to_extract_text_content"
      );
      return;
    }

    // [PERSIST:ASSISTANT] Save the assistant message
    try {
      const result = await persistMessage({
        userId: ctx?.conversationId || ctx?.userId || "unknown",
        channel: ctx?.channelId || "unknown",
        agentId: ctx?.accountId || "aleff",
        role: "assistant",
        content: textContent,
        metadata: {
          conversationId: ctx?.conversationId,
          accountId: ctx?.accountId,
          durationMs: event?.durationMs,
          source: "agent_end_hook",
          contentBlocks: Array.isArray(lastAssistantMsg.content)
            ? lastAssistantMsg.content.length
            : 1,
        },
      });

      structuredLogger.info(
        {
          hook: "agent_end",
          persisted: result,
          contentLength: textContent.length,
          conversationId: ctx?.conversationId || "unknown",
        },
        "assistant_response_persisted"
      );

      // [AUTO_CAPTURE] Capture important content from conversation
      if (cfg.autoCapture && ctx?.lastUserMessage) {
        try {
          const captureResult = await captureFromConversation(
            ctx.conversationId || "unknown",
            ctx.lastUserMessage,
            textContent
          );
          if (captureResult.captured > 0) {
            structuredLogger.info(
              {
                hook: "agent_end",
                captured: captureResult.captured,
                categories: captureResult.categories,
              },
              "auto_capture_from_agent_end"
            );
          }
        } catch (captureErr) {
          structuredLogger.error(
            { hook: "agent_end", error: String(captureErr) },
            "auto_capture_failed"
          );
        }
      }
    } catch (err) {
      structuredLogger.error(
        {
          hook: "agent_end",
          error: String(err),
          conversationId: ctx?.conversationId || "unknown",
        },
        "persist_assistant_failed"
      );
    }
  });

  // ==========================================================================
  // [PLUGIN:READY]
  // ==========================================================================

  structuredLogger.info(
    {
      version: "2.2.0",
      tools: 8,
      hooks: ["message_received", "message_sent", "before_agent_start", "agent_end"],
      autoCapture: cfg.autoCapture,
      autoRecall: cfg.autoRecall,
    },
    "plugin_registered"
  );
  logger.info(
    "Aleff Memory v2.2 registered with message hooks, 8 tools, auto-capture, and auto-recall."
  );
}
