// Database operations for MCP Memory Remote Server
import { Entity, Relation, Env } from './types.js';

export class MemoryDatabase {
  constructor(private env: Env) {}

  // Entity operations
  async createEntity(entity: Omit<Entity, 'id'>): Promise<Entity> {
    const stmt = this.env.DB.prepare(`
      INSERT INTO entities (name, type, observations, properties, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      RETURNING *
    `);
    
    const result = await stmt.bind(
      entity.name,
      entity.type,
      JSON.stringify(entity.observations),
      entity.properties ? JSON.stringify(entity.properties) : null
    ).first<Entity>();

    if (!result) throw new Error('Failed to create entity');
    
    // Cache the entity
    await this.env.ENTITY_CACHE.put(
      `entity:${result.id}`, 
      JSON.stringify(result),
      { expirationTtl: parseInt(this.env.CACHE_TTL) }
    );

    return result;
  }

  async getEntity(id: number): Promise<Entity | null> {
    // Try cache first
    const cached = await this.env.ENTITY_CACHE.get(`entity:${id}`);
    if (cached) return JSON.parse(cached);
    // Query database
    const stmt = this.env.DB.prepare(`
      SELECT * FROM entities WHERE id = ?
    `);
    
    const entity = await stmt.bind(id).first<Entity>();
    if (!entity) return null;

    // Parse JSON fields
    entity.observations = JSON.parse(entity.observations as string);
    if (entity.properties) {
      entity.properties = JSON.parse(entity.properties as string);
    }

    // Cache for future use
    await this.env.ENTITY_CACHE.put(
      `entity:${id}`, 
      JSON.stringify(entity),
      { expirationTtl: parseInt(this.env.CACHE_TTL) }
    );

    return entity;
  }

  async searchEntities(query: string, limit = 50): Promise<Entity[]> {
    // Search using FTS
    const stmt = this.env.DB.prepare(`
      SELECT e.* FROM entities e
      JOIN entities_fts fts ON e.id = fts.rowid
      WHERE entities_fts MATCH ?
      ORDER BY rank LIMIT ?
    `);
    
    const results = await stmt.bind(`"${query}"`, limit).all<Entity>();    
    return results.results?.map(entity => {
      entity.observations = JSON.parse(entity.observations as string);
      if (entity.properties) {
        entity.properties = JSON.parse(entity.properties as string);
      }
      return entity;
    }) || [];
  }

  async createRelation(relation: Omit<Relation, 'id'>): Promise<Relation> {
    const stmt = this.env.DB.prepare(`
      INSERT INTO relations (from_entity_id, to_entity_id, relation_type, properties, strength, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      RETURNING *
    `);
    
    const result = await stmt.bind(
      relation.from_entity_id,
      relation.to_entity_id,
      relation.relation_type,
      relation.properties ? JSON.stringify(relation.properties) : null,
      relation.strength || 1.0
    ).first<Relation>();

    if (!result) throw new Error('Failed to create relation');
    return result;
  }

  async getEntityRelations(entityId: number): Promise<Relation[]> {
    const stmt = this.env.DB.prepare(`
      SELECT * FROM relations 
      WHERE from_entity_id = ? OR to_entity_id = ?
    `);
    
    const results = await stmt.bind(entityId, entityId).all<Relation>();
    return results.results || [];
  }
}