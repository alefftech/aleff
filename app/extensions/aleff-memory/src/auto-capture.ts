/**
 * [CAPTURE:MAIN] Auto-capture module for Aleff Memory
 *
 * Detects and automatically saves important information from conversations.
 * Uses trigger patterns to identify content worth remembering.
 *
 * Captured content goes to memory_index for vector search retrieval.
 */

import { generateEmbedding, formatEmbeddingForPg } from "./embeddings.js";
import { query } from "./postgres.js";
import { logger } from "./logger.js";

// =============================================================================
// Types
// =============================================================================

export type CaptureCategory =
  | "decision"
  | "preference"
  | "contact"
  | "fact"
  | "task"
  | "general";

export interface CaptureResult {
  captured: number;
  categories: CaptureCategory[];
}

// =============================================================================
// [CAPTURE:TRIGGERS] Patterns that indicate important content
// =============================================================================

const MEMORY_TRIGGERS: Array<{ pattern: RegExp; category: CaptureCategory }> = [
  // Explicit memory requests (PT/EN)
  { pattern: /lembra|remember|guarda|anota|salva/i, category: "general" },

  // Decisions
  { pattern: /decid[io]|decidimos|resolv[io]|vamos\s+com/i, category: "decision" },
  { pattern: /escolh[io]|optei|optamos/i, category: "decision" },

  // Preferences
  { pattern: /prefiro|prefer[eo]|gosto\s+de|n[aã]o\s+gosto/i, category: "preference" },
  { pattern: /odeio|detesto|evit[oa]/i, category: "preference" },

  // Contact info
  { pattern: /\+\d{10,}/, category: "contact" }, // phone number
  { pattern: /[\w.-]+@[\w.-]+\.\w+/, category: "contact" }, // email

  // Organizational facts
  { pattern: /trabalha\s+(na|no|em)/i, category: "fact" },
  { pattern: /é\s+(diretor|gerente|ceo|cto|cfo|cmo|cpo)/i, category: "fact" },
  { pattern: /cuida\s+d[aoe]/i, category: "fact" },
  { pattern: /é\s+responsável\s+por/i, category: "fact" },

  // Tasks
  { pattern: /precisa(mos)?\s+fazer/i, category: "task" },
  { pattern: /tem\s+que|temos\s+que/i, category: "task" },
  { pattern: /deadline|prazo|até\s+dia/i, category: "task" },
];

// =============================================================================
// [CAPTURE:LOGIC] Core functions
// =============================================================================

/**
 * Check if text should be captured based on triggers
 *
 * @param text - Text to analyze
 * @returns true if text matches any trigger pattern
 */
export function shouldCapture(text: string): boolean {
  // Too short or too long
  if (text.length < 15 || text.length > 2000) {
    return false;
  }

  // Skip if already contains memory context (avoid feedback loops)
  if (text.includes("<relevant-memories>") || text.includes("[memory_context]")) {
    return false;
  }

  // Check against triggers
  return MEMORY_TRIGGERS.some(({ pattern }) => pattern.test(text));
}

/**
 * Detect the most appropriate category for text
 *
 * @param text - Text to categorize
 * @returns Most specific matching category
 */
export function detectCategory(text: string): CaptureCategory {
  for (const { pattern, category } of MEMORY_TRIGGERS) {
    if (pattern.test(text)) {
      return category;
    }
  }
  return "general";
}

/**
 * [CAPTURE:SAVE] Capture content from a conversation turn
 *
 * Analyzes user message and assistant response, saves important content
 * to memory_index with embeddings for vector search.
 *
 * @param conversationId - ID of the conversation
 * @param userMessage - User's message content
 * @param assistantResponse - Assistant's response content
 * @param channel - Channel identifier for memory isolation (telegram, whatsapp, etc)
 * @returns Count of items captured
 */
export async function captureFromConversation(
  conversationId: string,
  userMessage: string,
  assistantResponse: string,
  channel?: string
): Promise<CaptureResult> {
  const result: CaptureResult = {
    captured: 0,
    categories: [],
  };

  const textsToCheck = [
    { text: userMessage, source: "user" },
    { text: assistantResponse, source: "assistant" },
  ];

  for (const { text, source } of textsToCheck) {
    if (!shouldCapture(text)) {
      continue;
    }

    const category = detectCategory(text);

    try {
      // Generate embedding for vector search
      const embedding = await generateEmbedding(text);

      // Save to memory_index with channel for isolation
      await query(
        `INSERT INTO memory_index (
          key_type,
          key_name,
          summary,
          importance,
          tags,
          embedding,
          channel
        ) VALUES ($1, $2, $3, $4, $5, $6::vector, $7)`,
        [
          category,
          `auto_${source}_${Date.now()}`,
          text.slice(0, 500), // Truncate for summary
          category === "decision" ? 8 : category === "contact" ? 7 : 5,
          [`auto_capture`, source, category],
          embedding ? formatEmbeddingForPg(embedding) : null,
          channel || null,
        ]
      );

      result.captured++;
      result.categories.push(category);

      logger.info(
        {
          conversationId,
          category,
          source,
          channel,
          textLength: text.length,
        },
        "auto_capture_saved"
      );
    } catch (err) {
      logger.error(
        {
          error: String(err),
          conversationId,
          category,
          channel,
        },
        "auto_capture_failed"
      );
    }
  }

  return result;
}

/**
 * [CAPTURE:BATCH] Process multiple messages for capture
 *
 * Used for backfilling or batch processing.
 */
export async function batchCapture(
  messages: Array<{ conversationId: string; content: string; source: string }>
): Promise<{ processed: number; captured: number }> {
  let processed = 0;
  let captured = 0;

  for (const msg of messages) {
    processed++;
    if (shouldCapture(msg.content)) {
      const result = await captureFromConversation(
        msg.conversationId,
        msg.source === "user" ? msg.content : "",
        msg.source === "assistant" ? msg.content : ""
      );
      captured += result.captured;
    }
  }

  logger.info({ processed, captured }, "batch_capture_completed");
  return { processed, captured };
}
