/**
 * [BACKFILL:MAIN] Backfill embeddings for existing entities and facts
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
 */

import { query, queryOne } from "./postgres.js";
import { generateEmbedding, formatEmbeddingForPg } from "./embeddings.js";
import { logger } from "./logger.js";

// Rate limiting: wait between API calls to avoid hitting OpenAI limits
const DELAY_MS = 200;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface BackfillStats {
  entities: { total: number; updated: number; errors: number };
  facts: { total: number; updated: number; errors: number };
}

/**
 * Backfill embeddings for entities without them
 */
async function backfillEntities(): Promise<{ updated: number; errors: number }> {
  let updated = 0;
  let errors = 0;

  // Get entities without embeddings
  const entities = await query<{ id: string; name: string }>(
    `SELECT id, name FROM entities WHERE embedding IS NULL`
  );

  console.log(`Found ${entities.length} entities without embeddings`);

  for (const entity of entities) {
    try {
      const embedding = await generateEmbedding(entity.name);

      if (embedding) {
        await query(
          `UPDATE entities SET embedding = $1::vector, updated_at = NOW() WHERE id = $2`,
          [formatEmbeddingForPg(embedding), entity.id]
        );
        updated++;
        console.log(`✓ Entity: ${entity.name}`);
      } else {
        console.log(`✗ Entity: ${entity.name} (no embedding generated)`);
        errors++;
      }

      await sleep(DELAY_MS);
    } catch (err) {
      console.error(`✗ Entity: ${entity.name} - Error: ${err}`);
      errors++;
    }
  }

  return { updated, errors };
}

/**
 * Backfill embeddings for facts without them
 */
async function backfillFacts(): Promise<{ updated: number; errors: number }> {
  let updated = 0;
  let errors = 0;

  // Get facts without embeddings
  const facts = await query<{ id: string; content: string }>(
    `SELECT id, content FROM facts WHERE embedding IS NULL`
  );

  console.log(`Found ${facts.length} facts without embeddings`);

  for (const fact of facts) {
    try {
      const embedding = await generateEmbedding(fact.content);

      if (embedding) {
        await query(
          `UPDATE facts SET embedding = $1::vector WHERE id = $2`,
          [formatEmbeddingForPg(embedding), fact.id]
        );
        updated++;
        console.log(`✓ Fact: ${fact.content.slice(0, 50)}...`);
      } else {
        console.log(`✗ Fact: ${fact.content.slice(0, 50)}... (no embedding generated)`);
        errors++;
      }

      await sleep(DELAY_MS);
    } catch (err) {
      console.error(`✗ Fact: ${fact.content.slice(0, 50)}... - Error: ${err}`);
      errors++;
    }
  }

  return { updated, errors };
}

/**
 * Main backfill function
 */
async function backfill(): Promise<BackfillStats> {
  console.log("=".repeat(60));
  console.log("BACKFILL EMBEDDINGS - Starting");
  console.log("=".repeat(60));

  // Check current state
  const beforeStats = await query<{ table_name: string; total: number; with_embedding: number }>(`
    SELECT 'entities' as table_name, COUNT(*) as total, COUNT(embedding) as with_embedding FROM entities
    UNION ALL
    SELECT 'facts', COUNT(*), COUNT(embedding) FROM facts
  `);

  console.log("\nBefore backfill:");
  beforeStats.forEach(s => {
    console.log(`  ${s.table_name}: ${s.with_embedding}/${s.total} with embeddings`);
  });

  // Backfill entities
  console.log("\n--- Backfilling Entities ---");
  const entitiesResult = await backfillEntities();

  // Backfill facts
  console.log("\n--- Backfilling Facts ---");
  const factsResult = await backfillFacts();

  // Check final state
  const afterStats = await query<{ table_name: string; total: number; with_embedding: number }>(`
    SELECT 'entities' as table_name, COUNT(*) as total, COUNT(embedding) as with_embedding FROM entities
    UNION ALL
    SELECT 'facts', COUNT(*), COUNT(embedding) FROM facts
  `);

  console.log("\n" + "=".repeat(60));
  console.log("BACKFILL COMPLETE");
  console.log("=".repeat(60));

  console.log("\nAfter backfill:");
  afterStats.forEach(s => {
    console.log(`  ${s.table_name}: ${s.with_embedding}/${s.total} with embeddings`);
  });

  console.log("\nSummary:");
  console.log(`  Entities: ${entitiesResult.updated} updated, ${entitiesResult.errors} errors`);
  console.log(`  Facts: ${factsResult.updated} updated, ${factsResult.errors} errors`);

  return {
    entities: {
      total: beforeStats.find(s => s.table_name === 'entities')?.total || 0,
      ...entitiesResult
    },
    facts: {
      total: beforeStats.find(s => s.table_name === 'facts')?.total || 0,
      ...factsResult
    },
  };
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  backfill()
    .then(stats => {
      console.log("\nBackfill finished successfully");
      process.exit(0);
    })
    .catch(err => {
      console.error("Backfill failed:", err);
      process.exit(1);
    });
}

export { backfill, backfillEntities, backfillFacts };
