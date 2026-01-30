-- =============================================================================
-- [DB:INIT] Aleff Memory - PostgreSQL Schema v2.2
-- =============================================================================
--
-- Complete schema for Aleff Memory plugin including:
-- - Conversations & Messages (with embeddings)
-- - Knowledge Graph (entities, relationships, facts)
-- - Memory Index (auto-captured memories)
-- - Vector search functions (pgvector)
--
-- Usage:
--   This file is auto-loaded by PostgreSQL on first container start
--   via docker-entrypoint-initdb.d mount
--
-- @version 2.2.0
-- @updated 2026-01-29
-- =============================================================================

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pgcrypto extension for SHA-256 hashing (workspace file change detection)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- [DB:TABLES] Core Tables
-- =============================================================================

-- -----------------------------------------------------------------------------
-- [TABLE:CONVERSATIONS] Chat sessions grouped by user/channel
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    channel VARCHAR(50) NOT NULL DEFAULT 'telegram',
    agent_id VARCHAR(50),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    message_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- [TABLE:MESSAGES] Individual messages with vector embeddings
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    embedding vector(1536),
    agent_id VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- [TABLE:MEMORY_INDEX] Auto-captured important memories
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memory_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_type VARCHAR(50) NOT NULL,
    key_name VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    embedding vector(1536),
    importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
    tags TEXT[] DEFAULT '{}',
    source VARCHAR(50) DEFAULT 'conversation',
    agent_id VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- [TABLE:ENTITIES] Knowledge Graph - Nodes (people, companies, projects)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- [TABLE:RELATIONSHIPS] Knowledge Graph - Edges (connections between entities)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    to_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100) NOT NULL,
    strength DOUBLE PRECISION DEFAULT 1.0 CHECK (strength >= 0 AND strength <= 1),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- [TABLE:FACTS] Knowledge Graph - Time-bound facts about entities
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    fact_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    confidence DOUBLE PRECISION DEFAULT 0.9 CHECK (confidence >= 0 AND confidence <= 1),
    source_message_id UUID,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_to TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- [TABLE:AUDIT_LOG] System audit trail
-- -----------------------------------------------------------------------------
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
-- [DB:INDEXES] Performance Indexes
-- =============================================================================

-- Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_agent ON conversations(agent_id);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);

-- Memory Index
CREATE INDEX IF NOT EXISTS idx_memory_key_type ON memory_index(key_type);
CREATE INDEX IF NOT EXISTS idx_memory_importance ON memory_index(importance DESC);
CREATE INDEX IF NOT EXISTS idx_memory_tags ON memory_index USING GIN(tags);

-- Entities
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name);

-- Relationships
CREATE INDEX IF NOT EXISTS idx_relationships_from ON relationships(from_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_to ON relationships(to_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(relationship_type);

-- Facts
CREATE INDEX IF NOT EXISTS idx_facts_entity ON facts(entity_id);
CREATE INDEX IF NOT EXISTS idx_facts_type ON facts(fact_type);
CREATE INDEX IF NOT EXISTS idx_facts_valid ON facts(valid_to) WHERE valid_to IS NULL;

-- Audit
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- =============================================================================
-- [DB:VECTOR_INDEXES] pgvector IVFFlat indexes for similarity search
-- =============================================================================

-- Note: IVFFlat requires data to exist before creating index
-- These indexes will be created after first data insert
-- For production with >10k vectors, consider HNSW instead

CREATE INDEX IF NOT EXISTS idx_messages_embedding ON messages
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_memory_embedding ON memory_index
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_entities_embedding ON entities
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_facts_embedding ON facts
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =============================================================================
-- [DB:FTS_INDEXES] Full-text search (Portuguese)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_messages_content_fts ON messages
USING GIN(to_tsvector('portuguese', content));

CREATE INDEX IF NOT EXISTS idx_memory_summary_fts ON memory_index
USING GIN(to_tsvector('portuguese', summary));

CREATE INDEX IF NOT EXISTS idx_facts_content_fts ON facts
USING GIN(to_tsvector('portuguese', content));

-- =============================================================================
-- [DB:FUNCTIONS] Stored Functions
-- =============================================================================

-- -----------------------------------------------------------------------------
-- [FUNC:SEARCH_MESSAGES] Vector similarity search in messages
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- [FUNC:SEARCH_MEMORY] Vector similarity search in memory_index
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- [FUNC:SEARCH_ENTITIES] Vector similarity search in entities
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_entities_by_vector(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    entity_type VARCHAR,
    name VARCHAR,
    description TEXT,
    similarity float
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.entity_type,
        e.name,
        e.description,
        1 - (e.embedding <=> query_embedding) as similarity
    FROM entities e
    WHERE e.embedding IS NOT NULL
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- [FUNC:SEARCH_FACTS] Vector similarity search in facts
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_facts_by_vector(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    entity_id UUID,
    entity_name VARCHAR,
    fact_type VARCHAR,
    content TEXT,
    confidence float,
    similarity float,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id,
        f.entity_id,
        e.name,
        f.fact_type,
        f.content,
        f.confidence,
        1 - (f.embedding <=> query_embedding) as similarity,
        f.created_at
    FROM facts f
    JOIN entities e ON e.id = f.entity_id
    WHERE f.embedding IS NOT NULL
    AND f.valid_to IS NULL
    AND 1 - (f.embedding <=> query_embedding) > match_threshold
    ORDER BY f.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- [FUNC:GET_ENTITY] Get entity by name (case-insensitive)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_entity_by_name(entity_name TEXT)
RETURNS TABLE (
    id UUID,
    entity_type VARCHAR,
    name VARCHAR,
    description TEXT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT e.id, e.entity_type, e.name, e.description, e.metadata
    FROM entities e
    WHERE LOWER(e.name) = LOWER(entity_name)
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- [FUNC:GET_RELATIONSHIPS] Get all relationships for an entity
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_entity_relationships(p_entity_id UUID)
RETURNS TABLE (
    relationship_id UUID,
    direction VARCHAR,
    other_entity_id UUID,
    other_entity_name VARCHAR,
    relationship_type VARCHAR,
    strength float
) AS $$
BEGIN
    RETURN QUERY
    -- Outgoing relationships
    SELECT
        r.id,
        'outgoing'::VARCHAR,
        r.to_entity_id,
        e.name,
        r.relationship_type,
        r.strength
    FROM relationships r
    JOIN entities e ON e.id = r.to_entity_id
    WHERE r.from_entity_id = p_entity_id

    UNION ALL

    -- Incoming relationships
    SELECT
        r.id,
        'incoming'::VARCHAR,
        r.from_entity_id,
        e.name,
        r.relationship_type,
        r.strength
    FROM relationships r
    JOIN entities e ON e.id = r.from_entity_id
    WHERE r.to_entity_id = p_entity_id

    ORDER BY strength DESC;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- [FUNC:FIND_CONNECTION] BFS path finding between entities
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION find_connection_path(
    start_entity_id UUID,
    end_entity_id UUID,
    max_depth INT DEFAULT 3
)
RETURNS TABLE (
    path_entities UUID[],
    path_names TEXT[],
    path_relationships TEXT[],
    path_length INT
) AS $$
WITH RECURSIVE entity_paths AS (
    -- Base case: direct connections from start
    SELECT
        ARRAY[start_entity_id, r.to_entity_id] as entities,
        ARRAY[e1.name::TEXT, e2.name::TEXT] as names,
        ARRAY[r.relationship_type::TEXT] as relationships,
        1 as depth
    FROM relationships r
    JOIN entities e1 ON e1.id = start_entity_id
    JOIN entities e2 ON e2.id = r.to_entity_id
    WHERE r.from_entity_id = start_entity_id

    UNION ALL

    -- Recursive case: extend paths
    SELECT
        ep.entities || r.to_entity_id,
        ep.names || e.name::TEXT,
        ep.relationships || r.relationship_type::TEXT,
        ep.depth + 1
    FROM entity_paths ep
    JOIN relationships r ON r.from_entity_id = ep.entities[array_length(ep.entities, 1)]
    JOIN entities e ON e.id = r.to_entity_id
    WHERE ep.depth < max_depth
    AND r.to_entity_id <> ALL(ep.entities)
)
SELECT
    entities as path_entities,
    names as path_names,
    relationships as path_relationships,
    depth as path_length
FROM entity_paths
WHERE entities[array_length(entities, 1)] = end_entity_id
ORDER BY depth ASC
LIMIT 1;
$$ LANGUAGE sql;

-- -----------------------------------------------------------------------------
-- [FUNC:GET_CONTEXT] Get conversation context
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_conversation_context(
    conv_id UUID,
    msg_limit INT DEFAULT 50
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

-- -----------------------------------------------------------------------------
-- [FUNC:INCREMENT_COUNT] Atomic message count increment
-- -----------------------------------------------------------------------------
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
-- [TABLE:WORKSPACE_FILES] Workspace file persistence
-- =============================================================================
-- Stores workspace files (IDENTITY.md, SOUL.md, etc.) for:
-- - Survival across container/server failures
-- - Dashboard access for clients
-- - Version history for rollback
--
-- @version 1.0.0
-- @added 2026-01-29

CREATE TABLE IF NOT EXISTS workspace_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(50) NOT NULL DEFAULT 'aleff',
    file_name VARCHAR(100) NOT NULL,
    file_path VARCHAR(500),
    content TEXT NOT NULL,
    content_hash VARCHAR(64),
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) DEFAULT 'system'
);

-- Unique constraint: only one active file per agent+filename combo
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_files_unique
    ON workspace_files(agent_id, file_name) WHERE is_active = true;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_workspace_files_agent ON workspace_files(agent_id);
CREATE INDEX IF NOT EXISTS idx_workspace_files_updated ON workspace_files(updated_at DESC);

-- =============================================================================
-- [TABLE:WORKSPACE_FILES_HISTORY] Version history for rollback
-- =============================================================================
-- Archives previous versions of workspace files for:
-- - Rollback capability
-- - Audit trail
-- - Change tracking
--
-- @version 1.0.0
-- @added 2026-01-29

CREATE TABLE IF NOT EXISTS workspace_files_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_file_id UUID NOT NULL,
    agent_id VARCHAR(50) NOT NULL,
    file_name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    version INTEGER NOT NULL,
    changed_by VARCHAR(50),
    change_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by file
CREATE INDEX IF NOT EXISTS idx_workspace_history_file ON workspace_files_history(workspace_file_id);
CREATE INDEX IF NOT EXISTS idx_workspace_history_agent ON workspace_files_history(agent_id);
CREATE INDEX IF NOT EXISTS idx_workspace_history_created ON workspace_files_history(created_at DESC);

-- =============================================================================
-- [FUNC:WORKSPACE_UPDATE] Atomic update with history
-- =============================================================================
-- Updates a workspace file and archives the previous version atomically.
-- Returns the new version number.
--
-- @param p_agent_id Agent identifier (default: 'aleff')
-- @param p_file_name File name (e.g., 'IDENTITY.md')
-- @param p_content New file content
-- @param p_changed_by Who made the change (e.g., 'agent', 'dashboard', 'system')
-- @param p_change_reason Optional reason for the change
-- @returns New version number

CREATE OR REPLACE FUNCTION update_workspace_file(
    p_agent_id VARCHAR(50),
    p_file_name VARCHAR(100),
    p_content TEXT,
    p_changed_by VARCHAR(50) DEFAULT 'system',
    p_change_reason TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_existing_id UUID;
    v_existing_content TEXT;
    v_existing_version INTEGER;
    v_new_version INTEGER;
    v_content_hash VARCHAR(64);
BEGIN
    -- [STEP:HASH] Calculate content hash for change detection
    v_content_hash := encode(digest(p_content, 'sha256'), 'hex');

    -- [STEP:LOOKUP] Find existing active file
    SELECT id, content, version INTO v_existing_id, v_existing_content, v_existing_version
    FROM workspace_files
    WHERE agent_id = p_agent_id
      AND file_name = p_file_name
      AND is_active = true;

    IF v_existing_id IS NOT NULL THEN
        -- [STEP:CHECK] Skip if content unchanged
        IF encode(digest(v_existing_content, 'sha256'), 'hex') = v_content_hash THEN
            RETURN v_existing_version;
        END IF;

        -- [STEP:ARCHIVE] Save current version to history
        INSERT INTO workspace_files_history (
            workspace_file_id, agent_id, file_name, content, version, changed_by, change_reason
        ) VALUES (
            v_existing_id, p_agent_id, p_file_name, v_existing_content, v_existing_version,
            p_changed_by, p_change_reason
        );

        -- [STEP:UPDATE] Update to new content
        v_new_version := v_existing_version + 1;
        UPDATE workspace_files
        SET content = p_content,
            content_hash = v_content_hash,
            version = v_new_version,
            updated_at = NOW(),
            created_by = p_changed_by
        WHERE id = v_existing_id;
    ELSE
        -- [STEP:INSERT] Create new file entry
        v_new_version := 1;
        INSERT INTO workspace_files (
            agent_id, file_name, content, content_hash, version, created_by
        ) VALUES (
            p_agent_id, p_file_name, p_content, v_content_hash, v_new_version, p_changed_by
        );
    END IF;

    RETURN v_new_version;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- [FUNC:WORKSPACE_ROLLBACK] Rollback to previous version
-- =============================================================================
-- Rolls back a workspace file to a specific version from history.
--
-- @param p_agent_id Agent identifier
-- @param p_file_name File name
-- @param p_target_version Version to rollback to (or NULL for previous)
-- @returns New version number after rollback

CREATE OR REPLACE FUNCTION rollback_workspace_file(
    p_agent_id VARCHAR(50),
    p_file_name VARCHAR(100),
    p_target_version INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_current_id UUID;
    v_history_record RECORD;
    v_restored_content TEXT;
BEGIN
    -- [STEP:LOOKUP] Get current file
    SELECT id INTO v_current_id
    FROM workspace_files
    WHERE agent_id = p_agent_id
      AND file_name = p_file_name
      AND is_active = true;

    IF v_current_id IS NULL THEN
        RAISE EXCEPTION 'File not found: % / %', p_agent_id, p_file_name;
    END IF;

    -- [STEP:FIND_VERSION] Find target version in history
    IF p_target_version IS NULL THEN
        -- Get latest history entry
        SELECT content INTO v_restored_content
        FROM workspace_files_history
        WHERE workspace_file_id = v_current_id
        ORDER BY version DESC
        LIMIT 1;
    ELSE
        SELECT content INTO v_restored_content
        FROM workspace_files_history
        WHERE workspace_file_id = v_current_id
          AND version = p_target_version;
    END IF;

    IF v_restored_content IS NULL THEN
        RAISE EXCEPTION 'Version not found in history: %', COALESCE(p_target_version, 'latest');
    END IF;

    -- [STEP:RESTORE] Use update function to restore (which archives current)
    RETURN update_workspace_file(p_agent_id, p_file_name, v_restored_content, 'system', 'rollback');
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- [GRANTS:WORKSPACE] Permissions
-- =============================================================================

GRANT ALL ON workspace_files TO aleff;
GRANT ALL ON workspace_files_history TO aleff;

-- =============================================================================
-- [DB:INIT_LOG] Log initialization
-- =============================================================================
INSERT INTO audit_log (action_type, action_detail, success)
VALUES ('schema_init', 'Aleff Memory v2.2 + Workspace Persistence schema initialized', true);

-- =============================================================================
-- [DB:COMPLETE]
-- =============================================================================
