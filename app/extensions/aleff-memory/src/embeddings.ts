/**
 * Embedding generation for semantic search
 *
 * Uses OpenAI's text-embedding-3-small model (1536 dimensions) to generate
 * vector embeddings for message content. These embeddings are stored in
 * PostgreSQL using pgvector for similarity search.
 *
 * Configuration:
 *   - OPENAI_API_KEY: Required for embedding generation
 *
 * @see https://platform.openai.com/docs/guides/embeddings
 */

import { logger } from "./logger.js";

const OPENAI_API_URL = "https://api.openai.com/v1/embeddings";
const EMBEDDING_MODEL = "text-embedding-3-small";
const MAX_TEXT_LENGTH = 30000; // ~8000 tokens

/**
 * Generate embedding vector for text content
 *
 * @param text - The text to generate an embedding for
 * @returns Array of 1536 floats, or null if generation fails
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    logger.warn({ reason: "missing_api_key" }, "OPENAI_API_KEY not configured, skipping embedding");
    return null;
  }

  // Truncate text if too long (max ~8000 tokens ≈ 32000 chars)
  const truncatedText = text.slice(0, MAX_TEXT_LENGTH);
  const wasTruncated = text.length > MAX_TEXT_LENGTH;

  if (wasTruncated) {
    logger.debug(
      { originalLength: text.length, truncatedLength: truncatedText.length },
      "text truncated for embedding"
    );
  }

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
      const errorBody = await response.text();
      logger.error(
        { status: response.status, error: errorBody },
        "OpenAI embedding API error"
      );
      return null;
    }

    const data = (await response.json()) as {
      data: Array<{ embedding: number[] }>;
    };

    const embedding = data.data[0]?.embedding ?? null;

    if (embedding) {
      logger.debug(
        { dimensions: embedding.length, textLength: truncatedText.length },
        "embedding generated successfully"
      );
    }

    return embedding;
  } catch (err) {
    logger.error(
      { error: String(err), textLength: truncatedText.length },
      "failed to generate embedding"
    );
    return null;
  }
}

/**
 * Format embedding array for PostgreSQL vector type
 *
 * pgvector expects vectors in the format: [1.0, 2.0, 3.0, ...]
 *
 * @param embedding - Array of floats
 * @returns String formatted for pg vector column
 */
export function formatEmbeddingForPg(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
