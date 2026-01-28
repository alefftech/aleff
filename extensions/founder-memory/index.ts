import type { MoltbotPluginApi } from "../../src/plugins/types.js";
import { persistMessage } from "./src/persist.js";
import { isSupabaseConfigured } from "./src/supabase.js";
import {
  createSaveToMemoryTool,
  createSearchMemoryTool,
  createGetContextTool,
} from "./src/tools.js";

export default function register(api: MoltbotPluginApi) {
  const logger = api.logger;

  // Check configuration on startup
  if (!isSupabaseConfigured()) {
    logger.warn(
      "Founder Memory: SUPABASE_URL or SUPABASE_SERVICE_KEY not set. " +
        "Memory persistence disabled. Set these env vars to enable.",
    );
  } else {
    logger.info("Founder Memory: Supabase configured. Persistence enabled.");
  }

  // Register tools for the agent
  api.registerTool(createSaveToMemoryTool(), { optional: true });
  api.registerTool(createSearchMemoryTool(), { optional: true });
  api.registerTool(createGetContextTool(), { optional: true });

  // Hook: Persist inbound messages
  api.on("message_received", async (event, ctx) => {
    if (!isSupabaseConfigured()) return;

    try {
      await persistMessage({
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
    } catch (err) {
      logger.warn(`Failed to persist inbound message: ${err}`);
    }
  });

  // Hook: Persist outbound messages
  api.on("message_sent", async (event, ctx) => {
    if (!isSupabaseConfigured()) return;
    if (!event.success) return; // Only persist successful sends

    try {
      await persistMessage({
        userId: event.to,
        channel: ctx.channelId,
        role: "assistant",
        content: event.content,
        metadata: {
          conversationId: ctx.conversationId,
          accountId: ctx.accountId,
        },
      });
    } catch (err) {
      logger.warn(`Failed to persist outbound message: ${err}`);
    }
  });

  logger.info("Founder Memory plugin registered with message hooks and memory tools.");
}
