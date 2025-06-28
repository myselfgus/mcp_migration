-- Knowledge Graph Schema for MCP Memory Remote
-- Optimized for Claude.ai integration and Voither medical AI use cases

-- Entities table: stores all knowledge graph entities
CREATE TABLE entities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, 
  observations TEXT NOT NULL, -- JSON array of observations
  properties TEXT, -- Additional JSON properties
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- Relations table: stores relationships between entities
CREATE TABLE relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_entity_id INTEGER NOT NULL,
  to_entity_id INTEGER NOT NULL,
  relation_type TEXT NOT NULL,
  properties TEXT, -- JSON properties for the relation
  strength REAL DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1,
  FOREIGN KEY (from_entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  FOREIGN KEY (to_entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  UNIQUE(from_entity_id, to_entity_id, relation_type)
);

-- Indexes for performance optimization
CREATE INDEX idx_entities_name ON entities(name);
CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_updated ON entities(updated_at DESC);

CREATE INDEX idx_relations_from ON relations(from_entity_id);
CREATE INDEX idx_relations_to ON relations(to_entity_id);
CREATE INDEX idx_relations_type ON relations(relation_type);
CREATE INDEX idx_relations_strength ON relations(strength DESC);
CREATE INDEX idx_relations_updated ON relations(updated_at DESC);

-- Search optimization: Full-text search virtual table
CREATE VIRTUAL TABLE entities_fts USING fts5(
  name,
  type,
  observations,
  content='entities',
  content_rowid='id'
);

-- Triggers to maintain FTS index
CREATE TRIGGER entities_ai AFTER INSERT ON entities BEGIN
  INSERT INTO entities_fts(rowid, name, type, observations) 
  VALUES (new.id, new.name, new.type, new.observations);
END;

CREATE TRIGGER entities_ad AFTER DELETE ON entities BEGIN
  INSERT INTO entities_fts(entities_fts, rowid, name, type, observations) 
  VALUES('delete', old.id, old.name, old.type, old.observations);
END;

CREATE TRIGGER entities_au AFTER UPDATE ON entities BEGIN
  INSERT INTO entities_fts(entities_fts, rowid, name, type, observations) 
  VALUES('delete', old.id, old.name, old.type, old.observations);
  INSERT INTO entities_fts(rowid, name, type, observations) 
  VALUES (new.id, new.name, new.type, new.observations);
END;

-- Metadata table for migration tracking
CREATE TABLE migration_metadata (
  id INTEGER PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial metadata
INSERT INTO migration_metadata (key, value) VALUES 
  ('schema_version', '1.0.0'),
  ('migration_source', 'knowledge_graph.json'),
  ('max_entities', '10000'),
  ('max_relations', '50000'),
  ('created_by', 'mcp-memory-remote');
