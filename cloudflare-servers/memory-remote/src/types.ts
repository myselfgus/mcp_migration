// Types and interfaces for MCP Memory Remote Server
export interface Env {
  DB: D1Database;
  ENTITY_CACHE: KVNamespace;
  SEARCH_INDEX: KVNamespace;
  MEMORY_VERSION: string;
  MAX_ENTITIES: string;
  MAX_RELATIONS: string;
  CACHE_TTL: string;
}

export interface Entity {
  id?: number;
  name: string;
  type: string;
  observations: string[];
  properties?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  version?: number;
}

export interface Relation {
  id?: number;
  from_entity_id: number;
  to_entity_id: number;
  relation_type: string;
  properties?: Record<string, any>;
  strength?: number;
  created_at?: string;
  updated_at?: string;
  version?: number;
}
