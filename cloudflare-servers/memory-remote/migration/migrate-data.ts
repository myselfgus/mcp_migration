// Migration script: knowledge_graph.json → D1 Database
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface LegacyEntity {
  type: "entity";
  name: string;
  entityType: string;
  observations: string[];
}

interface LegacyRelation {
  type: "relation";
  from: string;
  to: string;
  relationType: string;
}

export async function migrateKnowledgeGraph(
  db: D1Database, 
  sourceFile: string = "A:\\MCP-Servers\\Memory\\knowledge_graph.json"
): Promise<{ entities: number; relations: number; errors: string[] }> {
  const errors: string[] = [];
  let entitiesCount = 0;
  let relationsCount = 0;

  try {
    // Read and parse the source file
    const content = readFileSync(sourceFile, 'utf-8');
    const lines = content.trim().split('\n');
    
    console.log(`Processing ${lines.length} lines from ${sourceFile}`);

    // First pass: Create entities
    const entityMap = new Map<string, number>();
    
    for (const line of lines) {
      try {
        const item = JSON.parse(line) as LegacyEntity | LegacyRelation;
        
        if (item.type === 'entity') {          const entity = item as LegacyEntity;
          
          // Insert entity into D1
          const stmt = db.prepare(`
            INSERT INTO entities (name, type, observations, created_at, updated_at)
            VALUES (?, ?, ?, datetime('now'), datetime('now'))
          `);
          
          const result = await stmt.bind(
            entity.name,
            entity.entityType,
            JSON.stringify(entity.observations)
          ).run();
          
          if (result.success && result.meta.last_row_id) {
            entityMap.set(entity.name, result.meta.last_row_id as number);
            entitiesCount++;
          } else {
            errors.push(`Failed to create entity: ${entity.name}`);
          }
        }
      } catch (parseError) {
        errors.push(`Failed to parse line: ${parseError.message}`);
      }
    }

    console.log(`Created ${entitiesCount} entities`);

    // Second pass: Create relations
    for (const line of lines) {
      try {
        const item = JSON.parse(line) as LegacyEntity | LegacyRelation;
        
        if (item.type === 'relation') {
          const relation = item as LegacyRelation;
          
          const fromId = entityMap.get(relation.from);
          const toId = entityMap.get(relation.to);
          
          if (!fromId || !toId) {
            errors.push(`Missing entity for relation: ${relation.from} → ${relation.to}`);
            continue;
          }          
          // Insert relation into D1
          const stmt = db.prepare(`
            INSERT INTO relations (from_entity_id, to_entity_id, relation_type, created_at, updated_at)
            VALUES (?, ?, ?, datetime('now'), datetime('now'))
          `);
          
          const result = await stmt.bind(
            fromId,
            toId,
            relation.relationType
          ).run();
          
          if (result.success) {
            relationsCount++;
          } else {
            errors.push(`Failed to create relation: ${relation.from} → ${relation.to}`);
          }
        }
      } catch (parseError) {
        errors.push(`Failed to parse relation line: ${parseError.message}`);
      }
    }

    console.log(`Created ${relationsCount} relations`);

    // Update migration metadata
    const metadataStmt = db.prepare(`
      INSERT OR REPLACE INTO migration_metadata (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
    `);
    
    await metadataStmt.bind('migration_completed', new Date().toISOString()).run();
    await metadataStmt.bind('entities_migrated', entitiesCount.toString()).run();
    await metadataStmt.bind('relations_migrated', relationsCount.toString()).run();

  } catch (error) {
    errors.push(`Migration failed: ${error.message}`);
  }

  return { entities: entitiesCount, relations: relationsCount, errors };
}