/**
 * [BACKFILL:MEMORY_INDEX] Backfill embeddings for memory_index entries
 *
 * Safe script that:
 * 1. Queries records without embeddings
 * 2. Generates embeddings one by one (rate-limited)
 * 3. Updates each record individually
 * 4. Logs progress via structured logger
 *
 * Usage:
 *   npx tsx extensions/aleff-memory/src/backfill-memory-index.ts
 *   OR
 *   docker exec aleffai node dist/extensions/aleff-memory/src/backfill-memory-index.js
 *
 * @version 1.0.0
 * @created 2026-01-29
 */

import { query } from "./postgres.js";
import { generateEmbedding, formatEmbeddingForPg } from "./embeddings.js";
import { logger } from "./logger.js";

// =============================================================================
// [BACKFILL:CONFIG] Configuration
// =============================================================================

// Rate limiting: wait between API calls to avoid hitting OpenAI limits
const DELAY_MS = 200;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// [BACKFILL:TYPES] Type definitions
// =============================================================================

interface BackfillStats {
  total: number;
  updated: number;
  errors: number;
}

// =============================================================================
// [BACKFILL:MAIN] Main backfill function
// =============================================================================

/**
 * Backfill embeddings for memory_index without them
 */
async function backfillMemoryIndex(): Promise<BackfillStats> {
  const stats: BackfillStats = {
    total: 0,
    updated: 0,
    errors: 0,
  };

  logger.info({ action: "backfill_start" }, "backfill_memory_index_starting");

  // [QUERY:MEMORY_INDEX] Get entries without embeddings
  const entries = await query<{ id: string; summary: string; key_type: string; key_name: string }>(
    `SELECT id, summary, key_type, key_name FROM memory_index WHERE embedding IS NULL`
  );

  stats.total = entries.length;

  logger.info(
    { entriesWithoutEmbeddings: entries.length },
    "memory_index_entries_to_backfill"
  );

  if (entries.length === 0) {
    logger.info({ action: "backfill_complete" }, "no_entries_to_backfill");
    return stats;
  }

  // [PROCESS:ENTRIES] Process each entry
  for (const entry of entries) {
    try {
      const embedding = await generateEmbedding(entry.summary);

      if (embedding) {
        await query(
          `UPDATE memory_index SET embedding = $1::vector, updated_at = NOW() WHERE id = $2`,
          [formatEmbeddingForPg(embedding), entry.id]
        );
        stats.updated++;
        logger.info(
          {
            entryId: entry.id,
            keyType: entry.key_type,
            keyName: entry.key_name,
            embeddingDim: embedding.length,
          },
          "memory_index_embedding_updated"
        );
      } else {
        logger.warn(
          { entryId: entry.id, keyType: entry.key_type, keyName: entry.key_name },
          "memory_index_embedding_generation_failed"
        );
        stats.errors++;
      }

      await sleep(DELAY_MS);
    } catch (err) {
      logger.error(
        { entryId: entry.id, keyType: entry.key_type, error: String(err) },
        "memory_index_backfill_error"
      );
      stats.errors++;
    }
  }

  // [STATS:FINAL] Log final statistics
  logger.info(
    {
      action: "backfill_complete",
      total: stats.total,
      updated: stats.updated,
      errors: stats.errors,
    },
    "backfill_memory_index_completed"
  );

  return stats;
}

// =============================================================================
// [BACKFILL:RUN] Run if called directly
// =============================================================================

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  backfillMemoryIndex()
    .then(stats => {
      logger.info({ stats }, "backfill_memory_index_finished_successfully");
      process.exit(0);
    })
    .catch(err => {
      logger.error({ error: String(err) }, "backfill_memory_index_failed");
      process.exit(1);
    });
}

export { backfillMemoryIndex };
