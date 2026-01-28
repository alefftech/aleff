import { getSupabaseClient, isSupabaseConfigured } from "./supabase.js";

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
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  // Try to find existing active conversation (within last 24h)
  const { data: existing } = await supabase
    .from("aleff_conversations")
    .select("id")
    .eq("user_id", params.userId)
    .eq("channel", params.channel)
    .gte("last_message_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("last_message_at", { ascending: false })
    .limit(1)
    .single();

  if (existing?.id) {
    // Update last_message_at and increment count
    await supabase
      .from("aleff_conversations")
      .update({
        last_message_at: new Date().toISOString(),
        message_count: supabase.rpc("increment_message_count", { row_id: existing.id }),
      })
      .eq("id", existing.id);
    return existing.id;
  }

  // Create new conversation
  const { data: newConv, error } = await supabase
    .from("aleff_conversations")
    .insert({
      user_id: params.userId,
      user_name: params.userName,
      channel: params.channel,
      started_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
      message_count: 1,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[founder-memory] Failed to create conversation:", error.message);
    return null;
  }

  return newConv?.id ?? null;
}

/**
 * Persist a message to Supabase
 */
export async function persistMessage(params: PersistMessageParams): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const conversationId = await getOrCreateConversation({
      userId: params.userId,
      userName: params.userName,
      channel: params.channel,
    });

    const { error } = await supabase.from("aleff_messages").insert({
      conversation_id: conversationId,
      role: params.role,
      content: params.content,
      metadata: params.metadata ?? {},
    });

    if (error) {
      console.error("[founder-memory] Failed to persist message:", error.message);
      return false;
    }

    // Log to audit_log
    await supabase.from("aleff_audit_log").insert({
      action_type: "message_saved",
      action_detail: `${params.role} message persisted`,
      user_id: params.userId,
      conversation_id: conversationId,
      success: true,
      metadata: {
        channel: params.channel,
        content_length: params.content.length,
      },
    });

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
  if (!isSupabaseConfigured()) {
    return false;
  }

  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("aleff_memory_index").insert({
      key_type: params.keyType,
      key_name: params.keyName,
      summary: params.content,
      importance: params.importance ?? 5,
      tags: params.tags ?? [],
    });

    if (error) {
      console.error("[founder-memory] Failed to save to memory index:", error.message);
      return false;
    }

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
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    let queryBuilder = supabase
      .from("aleff_messages")
      .select("role, content, created_at")
      .textSearch("content", params.query)
      .order("created_at", { ascending: false })
      .limit(params.limit ?? 10);

    if (params.userId) {
      // Join with conversations to filter by user
      queryBuilder = supabase
        .from("aleff_messages")
        .select("role, content, created_at, conversations!inner(user_id)")
        .textSearch("content", params.query)
        .eq("conversations.user_id", params.userId)
        .order("created_at", { ascending: false })
        .limit(params.limit ?? 10);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error("[founder-memory] Search failed:", error.message);
      return [];
    }

    return data ?? [];
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
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    // Find most recent conversation
    const { data: conv } = await supabase
      .from("aleff_conversations")
      .select("id")
      .eq("user_id", params.userId)
      .eq("channel", params.channel)
      .order("last_message_at", { ascending: false })
      .limit(1)
      .single();

    if (!conv?.id) return [];

    // Get messages from that conversation
    const { data: messages, error } = await supabase
      .from("aleff_messages")
      .select("role, content, created_at")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true })
      .limit(params.limit ?? 50);

    if (error) {
      console.error("[founder-memory] Failed to get context:", error.message);
      return [];
    }

    return messages ?? [];
  } catch (err) {
    console.error("[founder-memory] Error getting context:", err);
    return [];
  }
}
