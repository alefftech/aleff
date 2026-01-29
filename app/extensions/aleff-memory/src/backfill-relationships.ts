/**
 * [BACKFILL:RELATIONSHIPS] Backfill relationships from existing facts
 *
 * This script:
 * 1. Reads all facts from database
 * 2. Extracts relationships using extractRelationships()
 * 3. Creates missing relationships
 *
 * Safe to run multiple times (upserts relationships).
 *
 * Usage:
 *   npx tsx extensions/aleff-memory/src/backfill-relationships.ts
 *   OR
 *   docker exec aleffai node dist/extensions/aleff-memory/src/backfill-relationships.js
 *
 * @version 2.1.0
 * @updated 2026-01-29
 */

import { query } from "./postgres.js";
import {
  extractRelationships,
  findEntity,
  upsertEntity,
  createRelationship,
  inferEntityType
} from "./knowledge-graph.js";
import { generateEmbedding } from "./embeddings.js";
import { logger } from "./logger.js";

// =============================================================================
// [BACKFILL:TYPES] Type definitions
// =============================================================================

interface FactRow {
  id: string;
  entity_id: string;
  entity_name: string;
  content: string;
}

interface BackfillStats {
  factsProcessed: number;
  relationshipsCreated: number;
  relationshipsSkipped: number;
  errors: number;
}

// =============================================================================
// [BACKFILL:MAIN] Main backfill function
// =============================================================================

async function backfillRelationships(): Promise<BackfillStats> {
  const stats: BackfillStats = {
    factsProcessed: 0,
    relationshipsCreated: 0,
    relationshipsSkipped: 0,
    errors: 0,
  };

  logger.info({ action: "backfill_start" }, "backfill_relationships_starting");

  // [QUERY:FACTS] Get all facts with their entity names
  const facts = await query<FactRow>(`
    SELECT
      f.id,
      f.entity_id,
      e.name as entity_name,
      f.content
    FROM facts f
    JOIN entities e ON f.entity_id = e.id
    WHERE f.valid_to IS NULL
    ORDER BY f.created_at ASC
  `);

  logger.info({ factsFound: facts.length }, "facts_loaded_for_backfill");

  if (facts.length === 0) {
    logger.info({ action: "backfill_complete" }, "no_facts_to_process");
    return stats;
  }

  // [PROCESS:FACTS] Process each fact
  for (const fact of facts) {
    stats.factsProcessed++;

    try {
      // [EXTRACT:RELATIONSHIPS] Extract relationships from fact content
      const extractedRels = extractRelationships(fact.content, fact.entity_name);

      if (extractedRels.length === 0) {
        logger.debug(
          {
            factId: fact.id,
            entityName: fact.entity_name,
            contentPreview: fact.content.slice(0, 50),
          },
          "no_relationships_detected"
        );
        stats.relationshipsSkipped++;
        continue;
      }

      // [CREATE:RELATIONSHIPS] Create each relationship
      for (const rel of extractedRels) {
        // [FIND_OR_CREATE:ENTITY] Find or create related entity
        let relatedEntity = await findEntity(rel.target);
        if (!relatedEntity) {
          const relatedType = inferEntityType(rel.target);
          const embedding = await generateEmbedding(rel.target);
          relatedEntity = await upsertEntity({
            type: relatedType,
            name: rel.target,
            embedding: embedding || undefined,
          });
        }

        if (!relatedEntity) {
          logger.error(
            { target: rel.target, factId: fact.id },
            "failed_to_create_entity"
          );
          stats.errors++;
          continue;
        }

        // [CREATE:RELATIONSHIP] Create relationship (will upsert if exists)
        const relationship = await createRelationship({
          from: fact.entity_name,
          to: rel.target,
          type: rel.type,
          strength: 0.9,
        });

        if (relationship) {
          logger.info(
            {
              from: fact.entity_name,
              to: rel.target,
              type: rel.type,
              progress: `${stats.factsProcessed}/${facts.length}`,
            },
            "relationship_created"
          );
          stats.relationshipsCreated++;
        } else {
          logger.error(
            { from: fact.entity_name, to: rel.target, type: rel.type },
            "failed_to_create_relationship"
          );
          stats.errors++;
        }
      }
    } catch (err) {
      logger.error(
        { factId: fact.id, error: String(err) },
        "error_processing_fact"
      );
      stats.errors++;
    }
  }

  // [STATS:FINAL] Log final statistics
  const totalRelationships = await query<{ count: number }>(`
    SELECT COUNT(*) as count FROM relationships
  `);

  logger.info(
    {
      action: "backfill_complete",
      totalRelationships: totalRelationships[0]?.count || 0,
      factsProcessed: stats.factsProcessed,
      relationshipsCreated: stats.relationshipsCreated,
      relationshipsSkipped: stats.relationshipsSkipped,
      errors: stats.errors,
    },
    "backfill_relationships_completed"
  );

  return stats;
}

// =============================================================================
// [BACKFILL:RUN] Run if called directly
// =============================================================================

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  backfillRelationships()
    .then(stats => {
      logger.info({ stats }, "backfill_finished_successfully");
      process.exit(0);
    })
    .catch(err => {
      logger.error({ error: String(err) }, "backfill_failed");
      process.exit(1);
    });
}

export { backfillRelationships };
