import { getPool, isPostgresConfigured, query, queryOne } from "./postgres.js";

export type PersistMessageParams = {
  userId: string;
  userName?: string;
  channel: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, unknown>;
};

/**
 * Upsert or find a conversation for the given user/channel
 */
async function getOrCreateConversation(params: {
  userId: string;
  userName?: string;
  channel: string;
}): Promise<string | null> {
  if (!isPostgresConfigured()) return null;

  try {
    // Try to find existing active conversation (within last 24h)
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM conversations 
       WHERE user_id = $1 AND channel = $2 
       AND last_message_at > NOW() - INTERVAL '24 hours'
       ORDER BY last_message_at DESC
       LIMIT 1`,
      [params.userId, params.channel]
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
      `INSERT INTO conversations (user_id, user_name, channel, started_at, last_message_at, message_count)
       VALUES ($1, $2, $3, NOW(), NOW(), 1)
       RETURNING id`,
      [params.userId, params.userName || null, params.channel]
    );

    return newConv?.id ?? null;
  } catch (err) {
    console.error("[founder-memory] Failed to get/create conversation:", err);
    return null;
  }
}

/**
 * Persist a message to Postgres
 */
export async function persistMessage(params: PersistMessageParams): Promise<boolean> {
  if (!isPostgresConfigured()) {
    return false;
  }

  try {
    const conversationId = await getOrCreateConversation({
      userId: params.userId,
      userName: params.userName,
      channel: params.channel,
    });

    await query(
      `INSERT INTO messages (conversation_id, role, content, metadata)
       VALUES ($1, $2, $3, $4)`,
      [conversationId, params.role, params.content, JSON.stringify(params.metadata ?? {})]
    );

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
        JSON.stringify({ channel: params.channel, content_length: params.content.length }),
      ]
    );

    return true;
  } catch (err) {
    console.error("[founder-memory] Error persisting message:", err);
    return false;
  }
}

/**
 * Save a specific fact/decision to memory index
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
    await query(
      `INSERT INTO memory_index (key_type, key_name, summary, importance, tags)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        params.keyType,
        params.keyName,
        params.content,
        params.importance ?? 5,
        params.tags ?? [],
      ]
    );

    return true;
  } catch (err) {
    console.error("[founder-memory] Error saving to memory index:", err);
    return false;
  }
}

/**
 * Search messages by text content
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
    let queryParams: any[] = [params.query, params.limit ?? 10];

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

    return await query(sql, queryParams);
  } catch (err) {
    console.error("[founder-memory] Error searching messages:", err);
    return [];
  }
}

/**
 * Get recent conversation context
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
    console.error("[founder-memory] Error getting context:", err);
    return [];
  }
}
