/**
 * [BACKFILL:EMBEDDINGS] Backfill embeddings for existing entities and facts
 *
 * Safe script that:
 * 1. Queries records without embeddings
 * 2. Generates embeddings one by one (rate-limited)
 * 3. Updates each record individually
 * 4. Logs progress and errors
 *
 * Usage:
 *   npx tsx extensions/aleff-memory/src/backfill-embeddings.ts
 *   OR
 *   docker exec aleffai node dist/extensions/aleff-memory/src/backfill-embeddings.js
 *
 * @version 2.1.0
 * @updated 2026-01-29
 */

import { query, queryOne } from "./postgres.js";
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
  entities: { total: number; updated: number; errors: number };
  facts: { total: number; updated: number; errors: number };
}

// =============================================================================
// [BACKFILL:ENTITIES] Backfill embeddings for entities
// =============================================================================

/**
 * Backfill embeddings for entities without them
 */
async function backfillEntities(): Promise<{ updated: number; errors: number }> {
  let updated = 0;
  let errors = 0;

  // [QUERY:ENTITIES] Get entities without embeddings
  const entities = await query<{ id: string; name: string }>(
    `SELECT id, name FROM entities WHERE embedding IS NULL`
  );

  logger.info(
    { entitiesWithoutEmbeddings: entities.length },
    "backfill_entities_starting"
  );

  for (const entity of entities) {
    try {
      const embedding = await generateEmbedding(entity.name);

      if (embedding) {
        await query(
          `UPDATE entities SET embedding = $1::vector, updated_at = NOW() WHERE id = $2`,
          [formatEmbeddingForPg(embedding), entity.id]
        );
        updated++;
        logger.info(
          { entityId: entity.id, entityName: entity.name },
          "entity_embedding_updated"
        );
      } else {
        logger.warn(
          { entityId: entity.id, entityName: entity.name },
          "entity_embedding_generation_failed"
        );
        errors++;
      }

      await sleep(DELAY_MS);
    } catch (err) {
      logger.error(
        { entityId: entity.id, entityName: entity.name, error: String(err) },
        "entity_backfill_error"
      );
      errors++;
    }
  }

  logger.info({ updated, errors }, "backfill_entities_completed");
  return { updated, errors };
}

// =============================================================================
// [BACKFILL:FACTS] Backfill embeddings for facts
// =============================================================================

/**
 * Backfill embeddings for facts without them
 */
async function backfillFacts(): Promise<{ updated: number; errors: number }> {
  let updated = 0;
  let errors = 0;

  // [QUERY:FACTS] Get facts without embeddings
  const facts = await query<{ id: string; content: string }>(
    `SELECT id, content FROM facts WHERE embedding IS NULL`
  );

  logger.info(
    { factsWithoutEmbeddings: facts.length },
    "backfill_facts_starting"
  );

  for (const fact of facts) {
    try {
      const embedding = await generateEmbedding(fact.content);

      if (embedding) {
        await query(
          `UPDATE facts SET embedding = $1::vector WHERE id = $2`,
          [formatEmbeddingForPg(embedding), fact.id]
        );
        updated++;
        logger.info(
          { factId: fact.id, contentPreview: fact.content.slice(0, 50) },
          "fact_embedding_updated"
        );
      } else {
        logger.warn(
          { factId: fact.id, contentPreview: fact.content.slice(0, 50) },
          "fact_embedding_generation_failed"
        );
        errors++;
      }

      await sleep(DELAY_MS);
    } catch (err) {
      logger.error(
        { factId: fact.id, contentPreview: fact.content.slice(0, 50), error: String(err) },
        "fact_backfill_error"
      );
      errors++;
    }
  }

  logger.info({ updated, errors }, "backfill_facts_completed");
  return { updated, errors };
}

// =============================================================================
// [BACKFILL:MAIN] Main backfill function
// =============================================================================

/**
 * Main backfill function
 */
async function backfill(): Promise<BackfillStats> {
  logger.info({ action: "backfill_start" }, "backfill_embeddings_starting");

  // [STATS:BEFORE] Check current state
  const beforeStats = await query<{ table_name: string; total: number; with_embedding: number }>(`
    SELECT 'entities' as table_name, COUNT(*) as total, COUNT(embedding) as with_embedding FROM entities
    UNION ALL
    SELECT 'facts', COUNT(*), COUNT(embedding) FROM facts
  `);

  const entitiesBefore = beforeStats.find(s => s.table_name === 'entities');
  const factsBefore = beforeStats.find(s => s.table_name === 'facts');

  logger.info(
    {
      entities: {
        total: entitiesBefore?.total || 0,
        withEmbedding: entitiesBefore?.with_embedding || 0,
      },
      facts: {
        total: factsBefore?.total || 0,
        withEmbedding: factsBefore?.with_embedding || 0,
      },
    },
    "backfill_before_state"
  );

  // [BACKFILL:ENTITIES] Backfill entities
  const entitiesResult = await backfillEntities();

  // [BACKFILL:FACTS] Backfill facts
  const factsResult = await backfillFacts();

  // [STATS:AFTER] Check final state
  const afterStats = await query<{ table_name: string; total: number; with_embedding: number }>(`
    SELECT 'entities' as table_name, COUNT(*) as total, COUNT(embedding) as with_embedding FROM entities
    UNION ALL
    SELECT 'facts', COUNT(*), COUNT(embedding) FROM facts
  `);

  const entitiesAfter = afterStats.find(s => s.table_name === 'entities');
  const factsAfter = afterStats.find(s => s.table_name === 'facts');

  logger.info(
    {
      action: "backfill_complete",
      entities: {
        total: entitiesAfter?.total || 0,
        withEmbedding: entitiesAfter?.with_embedding || 0,
        updated: entitiesResult.updated,
        errors: entitiesResult.errors,
      },
      facts: {
        total: factsAfter?.total || 0,
        withEmbedding: factsAfter?.with_embedding || 0,
        updated: factsResult.updated,
        errors: factsResult.errors,
      },
    },
    "backfill_embeddings_completed"
  );

  return {
    entities: {
      total: entitiesBefore?.total || 0,
      ...entitiesResult
    },
    facts: {
      total: factsBefore?.total || 0,
      ...factsResult
    },
  };
}

// =============================================================================
// [BACKFILL:RUN] Run if called directly
// =============================================================================

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  backfill()
    .then(stats => {
      logger.info({ stats }, "backfill_finished_successfully");
      process.exit(0);
    })
    .catch(err => {
      logger.error({ error: String(err) }, "backfill_failed");
      process.exit(1);
    });
}

export { backfill, backfillEntities, backfillFacts };
