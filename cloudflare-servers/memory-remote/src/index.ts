// MCP Memory Remote Server - Simplified Implementation
import { MemoryDatabase } from './database.js';
import { Env, Entity, Relation } from './types.js';

export class MemoryRemoteServer {
  private db: MemoryDatabase;
  private env: Env;

  constructor(env: Env) {
    this.env = env;
    this.db = new MemoryDatabase(this.env);
  }

  async handleRequest(request: any): Promise<any> {
    const { method, params } = request;

    switch (method) {
      case 'tools/list':
        return this.listTools();
      
      case 'tools/call':
        return this.callTool(params.name, params.arguments);
      
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  private listTools() {
    return {
      tools: [
        {
          name: "create_entities",
          description: "Create multiple entities in the knowledge graph",
          inputSchema: {
            type: "object",
            properties: {
              entities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Unique name for the entity" },
                    entityType: { type: "string", description: "Type/category of the entity" },
                    observations: { 
                      type: "array", 
                      items: { type: "string" },
                      description: "Array of observations about the entity" 
                    }
                  },
                  required: ["name", "entityType", "observations"]
                }
              }
            },
            required: ["entities"]
          }
        },
        {
          name: "search_nodes",
          description: "Search for nodes in the knowledge graph",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query to match against entity names and observations" }
            },
            required: ["query"]
          }
        },
        {
          name: "create_relations",
          description: "Create relationships between entities",
          inputSchema: {
            type: "object",
            properties: {
              relations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    from: { type: "string", description: "Name of the source entity" },
                    to: { type: "string", description: "Name of the target entity" },
                    relationType: { type: "string", description: "Type of relationship" }
                  },
                  required: ["from", "to", "relationType"]
                }
              }
            },
            required: ["relations"]
          }
        },
        {
          name: "read_graph",
          description: "Get overview of the knowledge graph",
          inputSchema: {
            type: "object",
            properties: {}
          }
        }
      ]
    };
  }
  private async callTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'create_entities':
        return this.createEntities(args);
      
      case 'search_nodes':
        return this.searchNodes(args);
      
      case 'create_relations':
        return this.createRelations(args);
      
      case 'read_graph':
        return this.readGraph();
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async createEntities(args: { entities: any[] }) {
    const { entities } = args;
    const results = [];
    
    for (const entityData of entities) {
      try {
        const entity = await this.db.createEntity({
          name: entityData.name,
          type: entityData.entityType,
          observations: entityData.observations
        });
        results.push({ success: true, entity });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error.message,
          name: entityData.name 
        });
      }
    }
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ created: results.length, results }, null, 2)
      }]
    };
  }

  private async searchNodes(args: { query: string }) {
    const { query } = args;
    
    try {
      const entities = await this.db.searchEntities(query);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ 
            query, 
            found: entities.length, 
            entities 
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ error: error.message }, null, 2)
        }]
      };
    }
  }
  private async createRelations(args: { relations: any[] }) {
    const { relations } = args;
    const results = [];
    
    for (const rel of relations) {
      try {
        // Find entities by name
        const fromEntity = await this.findEntityByName(rel.from);
        const toEntity = await this.findEntityByName(rel.to);
        
        if (!fromEntity || !toEntity) {
          results.push({
            success: false,
            error: `Entity not found: ${!fromEntity ? rel.from : rel.to}`,
            relation: rel
          });
          continue;
        }

        const relation = await this.db.createRelation({
          from_entity_id: fromEntity.id!,
          to_entity_id: toEntity.id!,
          relation_type: rel.relationType
        });
        
        results.push({ success: true, relation });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error.message,
          relation: rel 
        });
      }
    }
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ created: results.length, results }, null, 2)
      }]
    };
  }

  private async readGraph() {
    try {
      const entitiesStmt = this.env.DB.prepare("SELECT COUNT(*) as count FROM entities");
      const relationsStmt = this.env.DB.prepare("SELECT COUNT(*) as count FROM relations");
      
      const entitiesCount = await entitiesStmt.first<{count: number}>();
      const relationsCount = await relationsStmt.first<{count: number}>();
      
      // Get recent entities as sample
      const recentStmt = this.env.DB.prepare(`
        SELECT * FROM entities 
        ORDER BY updated_at DESC 
        LIMIT 10
      `);
      const recentEntities = await recentStmt.all<Entity>();
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            summary: {
              total_entities: entitiesCount?.count || 0,
              total_relations: relationsCount?.count || 0,
              max_entities: this.env.MAX_ENTITIES,
              max_relations: this.env.MAX_RELATIONS
            },
            recent_entities: recentEntities.results || []
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ error: error.message }, null, 2)
        }]
      };
    }
  }
  // Helper method to find entity by name
  private async findEntityByName(name: string): Promise<Entity | null> {
    const stmt = this.env.DB.prepare("SELECT * FROM entities WHERE name = ?");
    const entity = await stmt.bind(name).first<Entity>();
    
    if (entity) {
      entity.observations = JSON.parse(entity.observations as string);
      if (entity.properties) {
        entity.properties = JSON.parse(entity.properties as string);
      }
    }
    
    return entity || null;
  }
}

// Export handler for Cloudflare Workers
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const server = new MemoryRemoteServer(env);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Handle MCP requests
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        const result = await server.handleRequest(body);
        return new Response(JSON.stringify(result), {
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    }
    
    // Health check endpoint
    return new Response(JSON.stringify({ 
      service: 'MCP Memory Remote Server',
      version: env.MEMORY_VERSION || '1.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString()
    }), { 
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
};
