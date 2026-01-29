#!/usr/bin/env -S node --import tsx
/**
 * Backfill embeddings for existing messages
 *
 * Usage:
 *   DATABASE_URL=... OPENAI_API_KEY=... npx tsx scripts/backfill-embeddings.ts
 *
 * Options:
 *   --limit N     Process only N messages (default: all)
 *   --batch N     Batch size (default: 10)
 *   --dry-run     Don't save, just show what would be done
 */

import pg from "pg";

const OPENAI_API_URL = "https://api.openai.com/v1/embeddings";
const EMBEDDING_MODEL = "text-embedding-3-small";

async function generateEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  const truncatedText = text.slice(0, 30000);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: truncatedText,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[ERROR] OpenAI API error: ${response.status} ${error}`);
      return null;
    }

    const data = (await response.json()) as {
      data: Array<{ embedding: number[] }>;
    };

    return data.data[0]?.embedding ?? null;
  } catch (err) {
    console.error(`[ERROR] Failed to generate embedding: ${err}`);
    return null;
  }
}

function formatEmbeddingForPg(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitIdx = args.indexOf("--limit");
  const batchIdx = args.indexOf("--batch");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : null;
  const batchSize = batchIdx >= 0 ? parseInt(args[batchIdx + 1]) : 10;

  const databaseUrl = process.env.DATABASE_URL;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!databaseUrl) {
    console.error("ERROR: DATABASE_URL not set");
    process.exit(1);
  }

  if (!apiKey) {
    console.error("ERROR: OPENAI_API_KEY not set");
    process.exit(1);
  }

  console.log(`[INFO] Connecting to database...`);
  const pool = new pg.Pool({ connectionString: databaseUrl });

  try {
    // Get messages without embeddings
    let query = `
      SELECT id, content, LENGTH(content) as content_length
      FROM messages
      WHERE embedding IS NULL
      ORDER BY created_at DESC
    `;
    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    const { rows } = await pool.query(query);
    console.log(`[INFO] Found ${rows.length} messages without embeddings`);

    if (dryRun) {
      console.log(`[DRY-RUN] Would process ${rows.length} messages`);
      for (const row of rows.slice(0, 5)) {
        console.log(`  - ${row.id}: ${row.content_length} chars`);
      }
      if (rows.length > 5) {
        console.log(`  ... and ${rows.length - 5} more`);
      }
      return;
    }

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      console.log(`[INFO] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(rows.length / batchSize)} (${batch.length} messages)`);

      for (const row of batch) {
        processed++;

        const embedding = await generateEmbedding(row.content, apiKey);

        if (embedding) {
          await pool.query(
            `UPDATE messages SET embedding = $1 WHERE id = $2`,
            [formatEmbeddingForPg(embedding), row.id]
          );
          succeeded++;
          console.log(`  ✓ ${row.id} (${row.content_length} chars)`);
        } else {
          failed++;
          console.log(`  ✗ ${row.id} (failed)`);
        }

        // Rate limiting: 1 request per 100ms = 10 req/s (well under OpenAI limits)
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    console.log(`\n[DONE] Processed: ${processed}, Succeeded: ${succeeded}, Failed: ${failed}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
