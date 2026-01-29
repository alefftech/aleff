-- =============================================================================
-- Migration 002: Add agent_id column for multi-agent support
-- Created: 2026-01-28
-- Purpose: Separate memory by agent (aleff vs garagem vs other agents)
-- =============================================================================

-- Add agent_id to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS agent_id VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_conversations_agent ON conversations(agent_id);

-- Add agent_id to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS agent_id VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_messages_agent ON messages(agent_id);

-- Add agent_id to memory_index
ALTER TABLE memory_index ADD COLUMN IF NOT EXISTS agent_id VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_memory_index_agent ON memory_index(agent_id);

-- Update existing rows to set agent_id='aleff' (default bot)
UPDATE conversations SET agent_id = 'aleff' WHERE agent_id IS NULL;
UPDATE messages SET agent_id = 'aleff' WHERE agent_id IS NULL;
UPDATE memory_index SET agent_id = 'aleff' WHERE agent_id IS NULL;

-- Log migration
INSERT INTO audit_log (action_type, action_detail, success)
VALUES ('migration', 'Applied migration 002: Add agent_id column for multi-agent support', true);
