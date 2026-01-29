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

async function backfillRelationships(): Promise<BackfillStats> {
  const stats: BackfillStats = {
    factsProcessed: 0,
    relationshipsCreated: 0,
    relationshipsSkipped: 0,
    errors: 0,
  };

  console.log("=" .repeat(60));
  console.log("BACKFILL RELATIONSHIPS - Starting");
  console.log("=".repeat(60));

  // 1. Get all facts with their entity names
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

  console.log(`\nFound ${facts.length} facts to process\n`);

  if (facts.length === 0) {
    console.log("No facts to process. Exiting.");
    return stats;
  }

  // 2. Process each fact
  for (const fact of facts) {
    stats.factsProcessed++;

    try {
      // Extract relationships from fact content
      const extractedRels = extractRelationships(fact.content, fact.entity_name);

      if (extractedRels.length === 0) {
        console.log(`⚪ [${stats.factsProcessed}/${facts.length}] "${fact.entity_name}": "${fact.content.slice(0, 50)}..." (no relationships detected)`);
        stats.relationshipsSkipped++;
        continue;
      }

      // Create each relationship
      for (const rel of extractedRels) {
        // Find or create related entity
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
          console.log(`✗ Failed to create entity: ${rel.target}`);
          stats.errors++;
          continue;
        }

        // Create relationship (will upsert if exists)
        const relationship = await createRelationship({
          from: fact.entity_name,
          to: rel.target,
          type: rel.type,
          strength: 0.9,
        });

        if (relationship) {
          console.log(`✓ [${stats.factsProcessed}/${facts.length}] "${fact.entity_name}" --[${rel.type}]--> "${rel.target}"`);
          stats.relationshipsCreated++;
        } else {
          console.log(`✗ Failed to create relationship: ${fact.entity_name} -> ${rel.target}`);
          stats.errors++;
        }
      }
    } catch (err) {
      console.error(`✗ Error processing fact ${fact.id}: ${err}`);
      stats.errors++;
    }
  }

  // 3. Final stats
  console.log("\n" + "=".repeat(60));
  console.log("BACKFILL COMPLETE");
  console.log("=".repeat(60));

  const totalRelationships = await query<{ count: number }>(`
    SELECT COUNT(*) as count FROM relationships
  `);

  console.log("\nFinal state:");
  console.log(`  Total relationships: ${totalRelationships[0]?.count || 0}`);
  console.log("\nSummary:");
  console.log(`  Facts processed: ${stats.factsProcessed}`);
  console.log(`  Relationships created: ${stats.relationshipsCreated}`);
  console.log(`  Relationships skipped (no pattern): ${stats.relationshipsSkipped}`);
  console.log(`  Errors: ${stats.errors}`);

  return stats;
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  backfillRelationships()
    .then(stats => {
      console.log("\nBackfill finished successfully");
      process.exit(0);
    })
    .catch(err => {
      console.error("Backfill failed:", err);
      process.exit(1);
    });
}

export { backfillRelationships };
