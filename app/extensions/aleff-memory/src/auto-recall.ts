/**
 * [RECALL:MAIN] Auto-recall module for Aleff Memory
 *
 * Injects relevant memories before agent processing.
 * Uses vector similarity to find contextually relevant information.
 *
 * Output format: <relevant-memories> XML block prepended to agent context.
 */

import { generateEmbedding, formatEmbeddingForPg } from "./embeddings.js";
import { query } from "./postgres.js";
import { logger } from "./logger.js";

// =============================================================================
// Types
// =============================================================================

export interface RecalledMemory {
  category: string;
  content: string;
  similarity: number;
  source?: string;
}

export interface RecallResult {
  memories: RecalledMemory[];
  formatted: string | null;
}

// =============================================================================
// Configuration
// =============================================================================

const DEFAULT_CONFIG = {
  similarityThreshold: 0.3, // Lower threshold to catch more relevant content
  maxMemories: 5,
  minContentLength: 10,
};

// =============================================================================
// [RECALL:SEARCH] Search functions
// =============================================================================

/**
 * Search memory_index using vector similarity
 */
async function searchMemoryIndex(
  embedding: number[],
  config: typeof DEFAULT_CONFIG
): Promise<RecalledMemory[]> {
  try {
    const results = await query<{
      key_type: string;
      summary: string;
      similarity: number;
      tags: string[];
    }>(
      `SELECT
        key_type,
        summary,
        1 - (embedding <=> $1::vector) as similarity,
        tags
      FROM memory_index
      WHERE embedding IS NOT NULL
      AND 1 - (embedding <=> $1::vector) > $2
      ORDER BY embedding <=> $1::vector
      LIMIT $3`,
      [
        formatEmbeddingForPg(embedding),
        config.similarityThreshold,
        config.maxMemories,
      ]
    );

    return results.map((r) => ({
      category: r.key_type,
      content: r.summary,
      similarity: r.similarity,
      source: r.tags?.includes("auto_capture") ? "auto" : "explicit",
    }));
  } catch (err) {
    logger.error({ error: String(err) }, "memory_index_search_failed");
    return [];
  }
}

/**
 * Search facts table using vector similarity
 */
async function searchFacts(
  embedding: number[],
  config: typeof DEFAULT_CONFIG
): Promise<RecalledMemory[]> {
  try {
    const results = await query<{
      fact_type: string;
      content: string;
      similarity: number;
      entity_name: string;
    }>(
      `SELECT
        f.fact_type,
        f.content,
        1 - (f.embedding <=> $1::vector) as similarity,
        e.name as entity_name
      FROM facts f
      JOIN entities e ON f.entity_id = e.id
      WHERE f.embedding IS NOT NULL
      AND f.valid_to IS NULL
      AND 1 - (f.embedding <=> $1::vector) > $2
      ORDER BY f.embedding <=> $1::vector
      LIMIT $3`,
      [
        formatEmbeddingForPg(embedding),
        config.similarityThreshold,
        config.maxMemories,
      ]
    );

    return results.map((r) => ({
      category: `fact:${r.fact_type}`,
      content: `${r.entity_name}: ${r.content}`,
      similarity: r.similarity,
      source: "knowledge_graph",
    }));
  } catch (err) {
    logger.error({ error: String(err) }, "facts_search_failed");
    return [];
  }
}

/**
 * Search recent messages using vector similarity
 */
async function searchMessages(
  embedding: number[],
  config: typeof DEFAULT_CONFIG
): Promise<RecalledMemory[]> {
  try {
    const results = await query<{
      role: string;
      content: string;
      similarity: number;
    }>(
      `SELECT
        role,
        content,
        1 - (embedding <=> $1::vector) as similarity
      FROM messages
      WHERE embedding IS NOT NULL
      AND 1 - (embedding <=> $1::vector) > $2
      ORDER BY embedding <=> $1::vector
      LIMIT $3`,
      [
        formatEmbeddingForPg(embedding),
        config.similarityThreshold,
        config.maxMemories,
      ]
    );

    return results.map((r) => ({
      category: `message:${r.role}`,
      content: r.content.slice(0, 300), // Truncate long messages
      similarity: r.similarity,
      source: "conversation",
    }));
  } catch (err) {
    logger.error({ error: String(err) }, "messages_search_failed");
    return [];
  }
}

// =============================================================================
// [RECALL:FORMAT] Format memories for injection
// =============================================================================

/**
 * Format recalled memories as XML block for agent context
 */
function formatMemoriesXml(memories: RecalledMemory[]): string {
  if (memories.length === 0) {
    return "";
  }

  const lines = memories.map(
    (m, i) => `  ${i + 1}. [${m.category}] ${m.content}`
  );

  return `<relevant-memories>
${lines.join("\n")}
</relevant-memories>`;
}

// =============================================================================
// [RECALL:MAIN] Main recall function
// =============================================================================

/**
 * [RECALL:PROMPT] Recall relevant memories for a prompt
 *
 * Searches multiple sources (memory_index, facts, messages) and
 * returns formatted context to inject before agent processing.
 *
 * @param prompt - The user's prompt/question
 * @param config - Optional configuration overrides
 * @returns RecallResult with memories and formatted XML
 */
export async function recallForPrompt(
  prompt: string,
  config: Partial<typeof DEFAULT_CONFIG> = {}
): Promise<RecallResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Skip very short prompts
  if (prompt.length < cfg.minContentLength) {
    return { memories: [], formatted: null };
  }

  // Generate embedding for the prompt
  const embedding = await generateEmbedding(prompt);
  if (!embedding) {
    logger.warn({ promptLength: prompt.length }, "embedding_generation_failed_for_recall");
    return { memories: [], formatted: null };
  }

  // Search all sources in parallel
  const [memoryIndexResults, factsResults, messagesResults] = await Promise.all([
    searchMemoryIndex(embedding, cfg),
    searchFacts(embedding, cfg),
    searchMessages(embedding, cfg),
  ]);

  // Combine and deduplicate by content similarity
  const allMemories = [...memoryIndexResults, ...factsResults, ...messagesResults];

  // Sort by similarity (highest first)
  allMemories.sort((a, b) => b.similarity - a.similarity);

  // Take top N unique memories
  const seen = new Set<string>();
  const uniqueMemories: RecalledMemory[] = [];

  for (const memory of allMemories) {
    // Simple dedup by first 50 chars of content
    const key = memory.content.slice(0, 50).toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueMemories.push(memory);
      if (uniqueMemories.length >= cfg.maxMemories) {
        break;
      }
    }
  }

  if (uniqueMemories.length === 0) {
    return { memories: [], formatted: null };
  }

  const formatted = formatMemoriesXml(uniqueMemories);

  logger.info(
    {
      promptLength: prompt.length,
      memoriesFound: uniqueMemories.length,
      topSimilarity: uniqueMemories[0]?.similarity,
    },
    "auto_recall_completed"
  );

  return {
    memories: uniqueMemories,
    formatted,
  };
}

/**
 * [RECALL:CONTEXT] Get full context including memories
 *
 * Convenience function that returns the formatted XML
 * or null if no relevant memories found.
 */
export async function getMemoryContext(prompt: string): Promise<string | null> {
  const result = await recallForPrompt(prompt);
  return result.formatted;
}
