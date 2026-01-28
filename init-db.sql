-- =============================================================================
-- Aleff Founder Memory - PostgreSQL Schema
-- Created: 2026-01-28
-- =============================================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- Tables
-- =============================================================================

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    channel VARCHAR(50) NOT NULL DEFAULT 'telegram',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    message_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages table with vector embedding
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Memory index for important facts
CREATE TABLE IF NOT EXISTS memory_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_type VARCHAR(50) NOT NULL,
    key_name VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    embedding vector(1536),
    importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
    tags TEXT[] DEFAULT '{}',
    source VARCHAR(50) DEFAULT 'conversation',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type VARCHAR(50) NOT NULL,
    action_detail TEXT,
    user_id VARCHAR(255),
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    success BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);

-- Vector similarity search index (IVFFlat for performance)
CREATE INDEX IF NOT EXISTS idx_messages_embedding ON messages 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_memory_embedding ON memory_index 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Memory index
CREATE INDEX IF NOT EXISTS idx_memory_key_type ON memory_index(key_type);
CREATE INDEX IF NOT EXISTS idx_memory_importance ON memory_index(importance DESC);
CREATE INDEX IF NOT EXISTS idx_memory_tags ON memory_index USING GIN(tags);

-- Full text search
CREATE INDEX IF NOT EXISTS idx_messages_content_fts ON messages 
USING GIN(to_tsvector('portuguese', content));

CREATE INDEX IF NOT EXISTS idx_memory_summary_fts ON memory_index 
USING GIN(to_tsvector('portuguese', summary));

-- Audit log
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- =============================================================================
-- Functions
-- =============================================================================

-- Search messages by vector similarity
CREATE OR REPLACE FUNCTION search_messages_by_vector(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    conversation_id UUID,
    role VARCHAR,
    content TEXT,
    similarity float,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.conversation_id,
        m.role,
        m.content,
        1 - (m.embedding <=> query_embedding) as similarity,
        m.created_at
    FROM messages m
    WHERE m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
    ORDER BY m.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Search memory index by vector similarity
CREATE OR REPLACE FUNCTION search_memory_by_vector(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    key_type VARCHAR,
    key_name VARCHAR,
    summary TEXT,
    importance INTEGER,
    similarity float,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mi.id,
        mi.key_type,
        mi.key_name,
        mi.summary,
        mi.importance,
        1 - (mi.embedding <=> query_embedding) as similarity,
        mi.created_at
    FROM memory_index mi
    WHERE mi.embedding IS NOT NULL
    AND 1 - (mi.embedding <=> query_embedding) > match_threshold
    ORDER BY mi.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Get conversation context (last N messages)
CREATE OR REPLACE FUNCTION get_conversation_context(
    conv_id UUID,
    msg_limit int DEFAULT 50
)
RETURNS TABLE (
    role VARCHAR,
    content TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT m.role, m.content, m.created_at
    FROM messages m
    WHERE m.conversation_id = conv_id
    ORDER BY m.created_at ASC
    LIMIT msg_limit;
END;
$$ LANGUAGE plpgsql;

-- Increment message count (atomic)
CREATE OR REPLACE FUNCTION increment_message_count(conv_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE conversations 
    SET message_count = message_count + 1,
        last_message_at = NOW()
    WHERE id = conv_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Grants (local user has full access)
-- =============================================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO aleff;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO aleff;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO aleff;

-- Log initialization
INSERT INTO audit_log (action_type, action_detail, success)
VALUES ('schema_init', 'Aleff Founder Memory schema initialized', true);

