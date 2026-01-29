/**
 * Message persistence layer for Founder Memory
 *
 * Handles storing and retrieving messages from PostgreSQL with:
 *   - Conversation session management (24h window)
 *   - Full-text search (Portuguese)
 *   - Vector similarity search (pgvector)
 *   - Audit logging
 *
 * All messages are associated with conversations grouped by user/channel/agent.
 * Embeddings are generated asynchronously to avoid blocking message saves.
 */

import { getPool, isPostgresConfigured, query, queryOne } from "./postgres.js";
import { generateEmbedding, formatEmbeddingForPg } from "./embeddings.js";
import { logger } from "./logger.js";

export type PersistMessageParams = {
  userId: string;
  userName?: string;
  channel: string;
  agentId?: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, unknown>;
};

/**
 * Get or create a conversation session for the given user/channel/agent
 *
 * Conversations are grouped by a 24-hour window. If a conversation exists
 * within that window, it's reused; otherwise a new one is created.
 *
 * @returns Conversation ID or null if postgres is not configured
 */
async function getOrCreateConversation(params: {
  userId: string;
  userName?: string;
  channel: string;
  agentId?: string;
}): Promise<string | null> {
  if (!isPostgresConfigured()) return null;

  try {
    const agentId = params.agentId || "aleff";

    // Try to find existing active conversation (within last 24h)
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM conversations
       WHERE user_id = $1 AND channel = $2 AND agent_id = $3
       AND last_message_at > NOW() - INTERVAL '24 hours'
       ORDER BY last_message_at DESC
       LIMIT 1`,
      [params.userId, params.channel, agentId]
    );

    if (existing?.id) {
      // Update last_message_at and increment count
      await query(
        `UPDATE conversations
         SET last_message_at = NOW(), message_count = message_count + 1
         WHERE id = $1`,
        [existing.id]
      );
      return existing.id;
    }

    // Create new conversation
    const newConv = await queryOne<{ id: string }>(
      `INSERT INTO conversations (user_id, user_name, channel, agent_id, started_at, last_message_at, message_count)
       VALUES ($1, $2, $3, $4, NOW(), NOW(), 1)
       RETURNING id`,
      [params.userId, params.userName || null, params.channel, agentId]
    );

    logger.info(
      { conversationId: newConv?.id, userId: params.userId, channel: params.channel },
      "new conversation created"
    );

    return newConv?.id ?? null;
  } catch (err) {
    logger.error(
      { error: String(err), userId: params.userId, channel: params.channel },
      "failed to get/create conversation"
    );
    return null;
  }
}

/**
 * Persist a message to PostgreSQL
 *
 * Messages are stored with their conversation context. Embeddings are
 * generated asynchronously after the message is saved to avoid blocking.
 *
 * @returns true if message was saved successfully
 */
export async function persistMessage(params: PersistMessageParams): Promise<boolean> {
  if (!isPostgresConfigured()) {
    return false;
  }

  try {
    const agentId = params.agentId || "aleff";

    const conversationId = await getOrCreateConversation({
      userId: params.userId,
      userName: params.userName,
      channel: params.channel,
      agentId,
    });

    // Generate embedding asynchronously (don't block message saving)
    const embeddingPromise = generateEmbedding(params.content);

    // Insert message first (fast path)
    const inserted = await queryOne<{ id: string }>(
      `INSERT INTO messages (conversation_id, role, content, agent_id, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [conversationId, params.role, params.content, agentId, JSON.stringify(params.metadata ?? {})]
    );

    // Update embedding when ready (async, non-blocking)
    embeddingPromise
      .then(async (embedding) => {
        if (embedding && inserted?.id) {
          try {
            await query(`UPDATE messages SET embedding = $1 WHERE id = $2`, [
              formatEmbeddingForPg(embedding),
              inserted.id,
            ]);
            logger.info(
              { messageId: inserted.id, dimensions: embedding.length },
              "embedding saved for message"
            );
          } catch (err) {
            logger.error({ error: String(err), messageId: inserted.id }, "failed to save embedding");
          }
        }
      })
      .catch((err) => {
        logger.error({ error: String(err) }, "embedding generation failed");
      });

    // Log to audit_log
    await query(
      `INSERT INTO audit_log (action_type, action_detail, user_id, conversation_id, success, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        "message_saved",
        `${params.role} message persisted`,
        params.userId,
        conversationId,
        true,
        JSON.stringify({ channel: params.channel, agent_id: agentId, content_length: params.content.length }),
      ]
    );

    return true;
  } catch (err) {
    logger.error(
      { error: String(err), userId: params.userId, role: params.role },
      "failed to persist message"
    );
    return false;
  }
}

/**
 * [PERSIST:MEMORY_INDEX] Save a specific fact/decision to memory index
 *
 * Used for explicit memory saves via the save_to_memory tool.
 * Generates embedding for vector search retrieval.
 *
 * @param params.content - The content to save
 * @param params.keyType - Category (decision, fact, preference, etc.)
 * @param params.keyName - Short identifier for easy retrieval
 * @param params.importance - 1-10 importance level (default 5)
 * @param params.tags - Tags for organization and search
 */
export async function saveToMemoryIndex(params: {
  content: string;
  keyType: string;
  keyName: string;
  importance?: number;
  tags?: string[];
  userId?: string;
}): Promise<boolean> {
  if (!isPostgresConfigured()) {
    return false;
  }

  try {
    // [EMBEDDING:GENERATE] Generate embedding for vector search
    const embedding = await generateEmbedding(params.content);

    // [INSERT:MEMORY_INDEX] Save with or without embedding
    if (embedding) {
      await query(
        `INSERT INTO memory_index (key_type, key_name, summary, importance, tags, embedding)
         VALUES ($1, $2, $3, $4, $5, $6::vector)`,
        [
          params.keyType,
          params.keyName,
          params.content,
          params.importance ?? 5,
          params.tags ?? [],
          formatEmbeddingForPg(embedding),
        ]
      );
      logger.info(
        {
          keyType: params.keyType,
          keyName: params.keyName,
          importance: params.importance,
          hasEmbedding: true,
          embeddingDim: embedding.length,
        },
        "memory_index_saved_with_embedding"
      );
    } else {
      // Fallback: save without embedding (still searchable via FTS)
      await query(
        `INSERT INTO memory_index (key_type, key_name, summary, importance, tags)
         VALUES ($1, $2, $3, $4, $5)`,
        [params.keyType, params.keyName, params.content, params.importance ?? 5, params.tags ?? []]
      );
      logger.warn(
        { keyType: params.keyType, keyName: params.keyName },
        "memory_index_saved_without_embedding"
      );
    }

    return true;
  } catch (err) {
    logger.error(
      { error: String(err), keyType: params.keyType, keyName: params.keyName },
      "failed_to_save_memory_index"
    );
    return false;
  }
}

/**
 * Search messages by text content using PostgreSQL full-text search
 *
 * Uses Portuguese language configuration for proper stemming.
 */
export async function searchMessages(params: {
  query: string;
  limit?: number;
  userId?: string;
}): Promise<Array<{ role: string; content: string; created_at: string }>> {
  if (!isPostgresConfigured()) {
    return [];
  }

  try {
    let sql = `
      SELECT m.role, m.content, m.created_at::text
      FROM messages m
      WHERE to_tsvector('portuguese', m.content) @@ plainto_tsquery('portuguese', $1)
      ORDER BY m.created_at DESC
      LIMIT $2
    `;
    let queryParams: unknown[] = [params.query, params.limit ?? 10];

    if (params.userId) {
      sql = `
        SELECT m.role, m.content, m.created_at::text
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        WHERE to_tsvector('portuguese', m.content) @@ plainto_tsquery('portuguese', $1)
        AND c.user_id = $3
        ORDER BY m.created_at DESC
        LIMIT $2
      `;
      queryParams = [params.query, params.limit ?? 10, params.userId];
    }

    const results = await query(sql, queryParams);

    logger.debug(
      { query: params.query, resultCount: results.length },
      "full-text search completed"
    );

    return results;
  } catch (err) {
    logger.error({ error: String(err), query: params.query }, "full-text search failed");
    return [];
  }
}

/**
 * Get recent conversation context for a user/channel
 *
 * Returns messages from the most recent conversation session.
 */
export async function getConversationContext(params: {
  userId: string;
  channel: string;
  limit?: number;
}): Promise<Array<{ role: string; content: string; created_at: string }>> {
  if (!isPostgresConfigured()) {
    return [];
  }

  try {
    // Find most recent conversation
    const conv = await queryOne<{ id: string }>(
      `SELECT id FROM conversations
       WHERE user_id = $1 AND channel = $2
       ORDER BY last_message_at DESC
       LIMIT 1`,
      [params.userId, params.channel]
    );

    if (!conv?.id) return [];

    // Get messages from that conversation
    return await query(
      `SELECT role, content, created_at::text
       FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC
       LIMIT $2`,
      [conv.id, params.limit ?? 50]
    );
  } catch (err) {
    logger.error(
      { error: String(err), userId: params.userId, channel: params.channel },
      "failed to get conversation context"
    );
    return [];
  }
}

/**
 * Vector similarity search using pgvector
 *
 * Generates an embedding for the query and finds semantically similar messages.
 * Falls back to full-text search if embedding generation fails.
 *
 * @param params.query - The search query
 * @param params.limit - Maximum results to return (default 10)
 * @param params.threshold - Cosine similarity threshold (default 0.7, higher = more similar)
 * @param params.userId - Optional user filter
 */
export async function vectorSearch(params: {
  query: string;
  limit?: number;
  threshold?: number;
  userId?: string;
}): Promise<Array<{ role: string; content: string; created_at: string; similarity: number }>> {
  if (!isPostgresConfigured()) {
    return [];
  }

  try {
    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(params.query);

    if (!queryEmbedding) {
      logger.warn({ query: params.query }, "embedding generation failed, falling back to FTS");
      // Fallback to full-text search
      const ftsResults = await searchMessages({
        query: params.query,
        limit: params.limit,
        userId: params.userId,
      });
      return ftsResults.map((r) => ({ ...r, similarity: 0 }));
    }

    const embeddingStr = formatEmbeddingForPg(queryEmbedding);
    const threshold = params.threshold ?? 0.7;
    const limit = params.limit ?? 10;

    let sql: string;
    let queryParams: unknown[];

    if (params.userId) {
      sql = `
        SELECT
          m.role,
          m.content,
          m.created_at::text,
          1 - (m.embedding <=> $1::vector) as similarity
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        WHERE m.embedding IS NOT NULL
        AND c.user_id = $4
        AND 1 - (m.embedding <=> $1::vector) > $2
        ORDER BY m.embedding <=> $1::vector
        LIMIT $3
      `;
      queryParams = [embeddingStr, threshold, limit, params.userId];
    } else {
      sql = `
        SELECT
          m.role,
          m.content,
          m.created_at::text,
          1 - (m.embedding <=> $1::vector) as similarity
        FROM messages m
        WHERE m.embedding IS NOT NULL
        AND 1 - (m.embedding <=> $1::vector) > $2
        ORDER BY m.embedding <=> $1::vector
        LIMIT $3
      `;
      queryParams = [embeddingStr, threshold, limit];
    }

    const results = await query<{ role: string; content: string; created_at: string; similarity: number }>(
      sql,
      queryParams
    );

    logger.info(
      { query: params.query.slice(0, 50), resultCount: results.length, threshold },
      "vector search completed"
    );

    return results;
  } catch (err) {
    logger.error({ error: String(err), query: params.query }, "vector search failed");
    return [];
  }
}
