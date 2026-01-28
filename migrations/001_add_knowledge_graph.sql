-- =============================================================================
-- Migration 001: Add Knowledge Graph Tables
-- Created: 2026-01-28
-- Purpose: Add entities, relationships, and facts for knowledge graph
-- =============================================================================

-- ENTITIES: Pessoas, empresas, projetos, conceitos
CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,  -- 'person', 'company', 'project', 'concept'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_entity_type_name UNIQUE(entity_type, name)
);

-- RELATIONSHIPS: Grafo de relacionamentos
CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    to_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100) NOT NULL,  -- 'works_at', 'manages', 'owns', 'part_of'
    strength FLOAT DEFAULT 1.0 CHECK (strength >= 0 AND strength <= 1),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_relationship UNIQUE(from_entity_id, to_entity_id, relationship_type)
);

-- FACTS: Informações sobre entidades (complementa messages com estrutura)
CREATE TABLE IF NOT EXISTS facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    fact_type VARCHAR(50) NOT NULL,  -- 'preference', 'decision', 'observation', 'skill', 'status'
    content TEXT NOT NULL,
    embedding vector(1536),
    confidence FLOAT DEFAULT 0.9 CHECK (confidence >= 0 AND confidence <= 1),
    source_message_id UUID,  -- Referência para messages(id)
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_to TIMESTAMPTZ,  -- NULL = ainda válido
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

-- Entities
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name);
CREATE INDEX IF NOT EXISTS idx_entities_embedding ON entities
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Relationships
CREATE INDEX IF NOT EXISTS idx_relationships_from ON relationships(from_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_to ON relationships(to_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_relationships_strength ON relationships(strength DESC);

-- Facts
CREATE INDEX IF NOT EXISTS idx_facts_entity ON facts(entity_id);
CREATE INDEX IF NOT EXISTS idx_facts_type ON facts(fact_type);
CREATE INDEX IF NOT EXISTS idx_facts_valid ON facts(valid_from, valid_to) WHERE valid_to IS NULL;
CREATE INDEX IF NOT EXISTS idx_facts_embedding ON facts
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_facts_content_fts ON facts
  USING GIN(to_tsvector('portuguese', content));
CREATE INDEX IF NOT EXISTS idx_facts_confidence ON facts(confidence DESC);

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Get entity by name (case-insensitive)
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

-- Get all relationships for an entity
CREATE OR REPLACE FUNCTION get_entity_relationships(entity_id UUID)
RETURNS TABLE (
    relationship_id UUID,
    direction VARCHAR,  -- 'outgoing' or 'incoming'
    other_entity_id UUID,
    other_entity_name VARCHAR,
    relationship_type VARCHAR,
    strength FLOAT
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
    WHERE r.from_entity_id = entity_id

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
    WHERE r.to_entity_id = entity_id

    ORDER BY strength DESC;
END;
$$ LANGUAGE plpgsql;

-- Search entities by vector similarity
CREATE OR REPLACE FUNCTION search_entities_by_vector(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    entity_type VARCHAR,
    name VARCHAR,
    description TEXT,
    similarity FLOAT
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

-- Search facts by vector similarity
CREATE OR REPLACE FUNCTION search_facts_by_vector(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    entity_id UUID,
    entity_name VARCHAR,
    fact_type VARCHAR,
    content TEXT,
    confidence FLOAT,
    similarity FLOAT,
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
    AND f.valid_to IS NULL  -- Only active facts
    AND 1 - (f.embedding <=> query_embedding) > match_threshold
    ORDER BY f.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Find connection path between two entities (BFS, max depth 3)
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
        ARRAY[e1.name, e2.name] as names,
        ARRAY[r.relationship_type] as relationships,
        1 as depth
    FROM relationships r
    JOIN entities e1 ON e1.id = start_entity_id
    JOIN entities e2 ON e2.id = r.to_entity_id
    WHERE r.from_entity_id = start_entity_id

    UNION ALL

    -- Recursive case: extend paths
    SELECT
        ep.entities || r.to_entity_id,
        ep.names || e.name,
        ep.relationships || r.relationship_type,
        ep.depth + 1
    FROM entity_paths ep
    JOIN relationships r ON r.from_entity_id = ep.entities[array_length(ep.entities, 1)]
    JOIN entities e ON e.id = r.to_entity_id
    WHERE ep.depth < max_depth
    AND r.to_entity_id <> ALL(ep.entities)  -- Avoid cycles
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
$$ LANGUAGE SQL;

-- =============================================================================
-- Grants
-- =============================================================================
GRANT ALL ON entities TO aleff;
GRANT ALL ON relationships TO aleff;
GRANT ALL ON facts TO aleff;
GRANT EXECUTE ON FUNCTION get_entity_by_name(TEXT) TO aleff;
GRANT EXECUTE ON FUNCTION get_entity_relationships(UUID) TO aleff;
GRANT EXECUTE ON FUNCTION search_entities_by_vector(vector, FLOAT, INT) TO aleff;
GRANT EXECUTE ON FUNCTION search_facts_by_vector(vector, FLOAT, INT) TO aleff;
GRANT EXECUTE ON FUNCTION find_connection_path(UUID, UUID, INT) TO aleff;

-- Log migration
INSERT INTO audit_log (action_type, action_detail, success)
VALUES ('migration', 'Applied migration 001: Add Knowledge Graph tables', true);
