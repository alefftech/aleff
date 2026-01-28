/**
 * Knowledge Graph functions for Founder Memory
 *
 * Manages entities, relationships, and facts in PostgreSQL
 * for long conversations and semantic connections
 */

import { query, queryOne, isPostgresConfigured } from "./postgres.js";

// =============================================================================
// Types
// =============================================================================

export type EntityType = 'person' | 'company' | 'project' | 'concept';
export type RelationshipType = 'works_at' | 'manages' | 'owns' | 'part_of' | 'knows' | 'related_to';
export type FactType = 'preference' | 'decision' | 'observation' | 'skill' | 'status';

export interface Entity {
  id: string;
  entity_type: EntityType;
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface Relationship {
  id: string;
  from_entity_id: string;
  to_entity_id: string;
  relationship_type: RelationshipType;
  strength: number;
  metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface Fact {
  id: string;
  entity_id: string;
  fact_type: FactType;
  content: string;
  confidence: number;
  source_message_id?: string;
  valid_from: Date;
  valid_to?: Date;
  metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface EntityWithRelationships extends Entity {
  outgoing: Array<{ to: string; type: string; strength: number }>;
  incoming: Array<{ from: string; type: string; strength: number }>;
}

// =============================================================================
// Entity Operations
// =============================================================================

/**
 * Create or update an entity (upsert)
 */
export async function upsertEntity(params: {
  type: EntityType;
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
}): Promise<Entity | null> {
  if (!isPostgresConfigured()) return null;

  try {
    const result = await queryOne<Entity>(
      `INSERT INTO entities (entity_type, name, description, metadata, embedding, updated_at)
       VALUES ($1, $2, $3, $4, $5::vector, NOW())
       ON CONFLICT (entity_type, name)
       DO UPDATE SET
         description = COALESCE($3, entities.description),
         metadata = COALESCE($4, entities.metadata),
         embedding = COALESCE($5::vector, entities.embedding),
         updated_at = NOW()
       RETURNING *`,
      [
        params.type,
        params.name,
        params.description || null,
        params.metadata ? JSON.stringify(params.metadata) : null,
        params.embedding ? `[${params.embedding.join(',')}]` : null
      ]
    );
    return result;
  } catch (err) {
    console.error('[knowledge-graph] Failed to upsert entity:', err);
    return null;
  }
}

/**
 * Find entity by name (case-insensitive)
 */
export async function findEntity(name: string): Promise<Entity | null> {
  if (!isPostgresConfigured()) return null;

  try {
    return await queryOne<Entity>(
      `SELECT * FROM get_entity_by_name($1)`,
      [name]
    );
  } catch (err) {
    console.error('[knowledge-graph] Failed to find entity:', err);
    return null;
  }
}

/**
 * Search entities by vector similarity
 */
export async function searchEntities(params: {
  embedding: number[];
  threshold?: number;
  limit?: number;
}): Promise<Array<Entity & { similarity: number }>> {
  if (!isPostgresConfigured()) return [];

  try {
    const threshold = params.threshold ?? 0.7;
    const limit = params.limit ?? 10;
    const embeddingStr = `[${params.embedding.join(',')}]`;

    return await query<Entity & { similarity: number }>(
      `SELECT * FROM search_entities_by_vector($1::vector, $2, $3)`,
      [embeddingStr, threshold, limit]
    );
  } catch (err) {
    console.error('[knowledge-graph] Failed to search entities:', err);
    return [];
  }
}

// =============================================================================
// Relationship Operations
// =============================================================================

/**
 * Create a relationship between two entities
 */
export async function createRelationship(params: {
  from: string;  // entity name
  to: string;    // entity name
  type: RelationshipType;
  strength?: number;
  metadata?: Record<string, unknown>;
}): Promise<Relationship | null> {
  if (!isPostgresConfigured()) return null;

  try {
    // Get entity IDs
    const fromEntity = await findEntity(params.from);
    const toEntity = await findEntity(params.to);

    if (!fromEntity || !toEntity) {
      console.warn('[knowledge-graph] Cannot create relationship: entity not found');
      return null;
    }

    const result = await queryOne<Relationship>(
      `INSERT INTO relationships (from_entity_id, to_entity_id, relationship_type, strength, metadata, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (from_entity_id, to_entity_id, relationship_type)
       DO UPDATE SET
         strength = $4,
         metadata = COALESCE($5, relationships.metadata),
         updated_at = NOW()
       RETURNING *`,
      [
        fromEntity.id,
        toEntity.id,
        params.type,
        params.strength ?? 1.0,
        params.metadata ? JSON.stringify(params.metadata) : null
      ]
    );
    return result;
  } catch (err) {
    console.error('[knowledge-graph] Failed to create relationship:', err);
    return null;
  }
}

/**
 * Get all relationships for an entity
 */
export async function getEntityRelationships(entityName: string): Promise<{
  entity: Entity | null;
  outgoing: Array<{ to: string; type: string; strength: number }>;
  incoming: Array<{ from: string; type: string; strength: number }>;
}> {
  if (!isPostgresConfigured()) {
    return { entity: null, outgoing: [], incoming: [] };
  }

  try {
    const entity = await findEntity(entityName);
    if (!entity) {
      return { entity: null, outgoing: [], incoming: [] };
    }

    const rels = await query<{
      direction: 'outgoing' | 'incoming';
      other_entity_name: string;
      relationship_type: string;
      strength: number;
    }>(
      `SELECT * FROM get_entity_relationships($1)`,
      [entity.id]
    );

    const outgoing = rels
      .filter(r => r.direction === 'outgoing')
      .map(r => ({
        to: r.other_entity_name,
        type: r.relationship_type,
        strength: r.strength
      }));

    const incoming = rels
      .filter(r => r.direction === 'incoming')
      .map(r => ({
        from: r.other_entity_name,
        type: r.relationship_type,
        strength: r.strength
      }));

    return { entity, outgoing, incoming };
  } catch (err) {
    console.error('[knowledge-graph] Failed to get relationships:', err);
    return { entity: null, outgoing: [], incoming: [] };
  }
}

/**
 * Find connection path between two entities
 */
export async function findConnectionPath(params: {
  from: string;
  to: string;
  maxDepth?: number;
}): Promise<{
  found: boolean;
  path?: {
    entities: string[];
    relationships: string[];
    length: number;
  };
} | null> {
  if (!isPostgresConfigured()) return null;

  try {
    const fromEntity = await findEntity(params.from);
    const toEntity = await findEntity(params.to);

    if (!fromEntity || !toEntity) {
      return { found: false };
    }

    const result = await queryOne<{
      path_names: string[];
      path_relationships: string[];
      path_length: number;
    }>(
      `SELECT * FROM find_connection_path($1, $2, $3)`,
      [fromEntity.id, toEntity.id, params.maxDepth ?? 3]
    );

    if (!result) {
      return { found: false };
    }

    return {
      found: true,
      path: {
        entities: result.path_names,
        relationships: result.path_relationships,
        length: result.path_length
      }
    };
  } catch (err) {
    console.error('[knowledge-graph] Failed to find connection path:', err);
    return { found: false };
  }
}

// =============================================================================
// Fact Operations
// =============================================================================

/**
 * Add a fact about an entity
 */
export async function addFact(params: {
  entity: string;  // entity name
  type: FactType;
  content: string;
  confidence?: number;
  embedding?: number[];
  sourceMessageId?: string;
  metadata?: Record<string, unknown>;
}): Promise<Fact | null> {
  if (!isPostgresConfigured()) return null;

  try {
    const entity = await findEntity(params.entity);
    if (!entity) {
      console.warn('[knowledge-graph] Cannot add fact: entity not found');
      return null;
    }

    const result = await queryOne<Fact>(
      `INSERT INTO facts (entity_id, fact_type, content, confidence, embedding, source_message_id, metadata)
       VALUES ($1, $2, $3, $4, $5::vector, $6, $7)
       RETURNING *`,
      [
        entity.id,
        params.type,
        params.content,
        params.confidence ?? 0.9,
        params.embedding ? `[${params.embedding.join(',')}]` : null,
        params.sourceMessageId || null,
        params.metadata ? JSON.stringify(params.metadata) : null
      ]
    );
    return result;
  } catch (err) {
    console.error('[knowledge-graph] Failed to add fact:', err);
    return null;
  }
}

/**
 * Search facts by vector similarity
 */
export async function searchFacts(params: {
  embedding: number[];
  threshold?: number;
  limit?: number;
}): Promise<Array<Fact & { entity_name: string; similarity: number }>> {
  if (!isPostgresConfigured()) return [];

  try {
    const threshold = params.threshold ?? 0.7;
    const limit = params.limit ?? 10;
    const embeddingStr = `[${params.embedding.join(',')}]`;

    return await query<Fact & { entity_name: string; similarity: number }>(
      `SELECT * FROM search_facts_by_vector($1::vector, $2, $3)`,
      [embeddingStr, threshold, limit]
    );
  } catch (err) {
    console.error('[knowledge-graph] Failed to search facts:', err);
    return [];
  }
}

/**
 * Get all facts about an entity
 */
export async function getEntityFacts(entityName: string, params?: {
  type?: FactType;
  minConfidence?: number;
  limit?: number;
}): Promise<Fact[]> {
  if (!isPostgresConfigured()) return [];

  try {
    const entity = await findEntity(entityName);
    if (!entity) return [];

    let sql = `
      SELECT * FROM facts
      WHERE entity_id = $1
      AND valid_to IS NULL
    `;
    const queryParams: any[] = [entity.id];
    let paramIndex = 2;

    if (params?.type) {
      sql += ` AND fact_type = $${paramIndex}`;
      queryParams.push(params.type);
      paramIndex++;
    }

    if (params?.minConfidence !== undefined) {
      sql += ` AND confidence >= $${paramIndex}`;
      queryParams.push(params.minConfidence);
      paramIndex++;
    }

    sql += ` ORDER BY confidence DESC, created_at DESC`;

    if (params?.limit) {
      sql += ` LIMIT $${paramIndex}`;
      queryParams.push(params.limit);
    }

    return await query<Fact>(sql, queryParams);
  } catch (err) {
    console.error('[knowledge-graph] Failed to get entity facts:', err);
    return [];
  }
}
