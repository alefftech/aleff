-- =============================================================================
-- [MIGRATION:003] Add Workspace Persistence
-- =============================================================================
--
-- Purpose: Add workspace file persistence for:
--   - Survive container/server failures
--   - Enable dashboard access for clients
--   - Maintain version history for rollback
--
-- Usage:
--   docker exec -i aleff-postgres psql -U aleff -d aleff_memory < app/migrations/003_add_workspace_persistence.sql
--
-- @version 1.0.0
-- @date 2026-01-29
-- =============================================================================

BEGIN;

-- =============================================================================
-- [EXTENSION:PGCRYPTO] Required for SHA-256 hashing
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- [TABLE:WORKSPACE_FILES] Workspace file persistence
-- =============================================================================

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
-- [AUDIT:LOG] Migration record
-- =============================================================================

INSERT INTO audit_log (action_type, action_detail, success)
VALUES ('migration', '003_add_workspace_persistence applied', true);

COMMIT;

-- =============================================================================
-- [MIGRATION:COMPLETE] 003_add_workspace_persistence
-- =============================================================================
