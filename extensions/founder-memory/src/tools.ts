import type { AnyAgentTool } from "../../../src/agents/tools/common.js";
import { saveToMemoryIndex, searchMessages, getConversationContext, vectorSearch } from "./persist.js";
import { isPostgresConfigured } from "./postgres.js";
import {
  upsertEntity,
  findEntity,
  getEntityRelationships,
  findConnectionPath,
  addFact,
  getEntityFacts,
  type EntityType,
  type RelationshipType,
  type FactType
} from "./knowledge-graph.js";

/**
 * Tool for agent to explicitly save important information to memory
 */
export function createSaveToMemoryTool(): AnyAgentTool {
  return {
    name: "save_to_memory",
    description:
      "Salva um fato, decisao ou informacao importante na memoria institucional permanente. " +
      "Use para preservar decisoes estrategicas, preferencias do Founder, ou conhecimento que deve ser lembrado.",
    inputSchema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "O conteudo a ser salvo (fato, decisao, preferencia)",
        },
        category: {
          type: "string",
          enum: ["decision", "fact", "preference", "todo", "idea", "learning"],
          description: "Categoria do conteudo",
        },
        name: {
          type: "string",
          description: "Nome curto/identificador para facil recuperacao",
        },
        importance: {
          type: "number",
          minimum: 1,
          maximum: 10,
          description: "Nivel de importancia (1-10, default 5)",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags para organizacao e busca",
        },
      },
      required: ["content", "category", "name"],
    },
    async execute(params: {
      content: string;
      category: string;
      name: string;
      importance?: number;
      tags?: string[];
    }) {
      if (!isPostgresConfigured()) {
        return {
          success: false,
          error: "PostgreSQL not configured. Set DATABASE_URL or POSTGRES_* env vars.",
        };
      }

      const saved = await saveToMemoryIndex({
        content: params.content,
        keyType: params.category,
        keyName: params.name,
        importance: params.importance,
        tags: params.tags,
      });

      if (saved) {
        return {
          success: true,
          message: `Salvo na memoria: [${params.category}] ${params.name}`,
        };
      }

      return {
        success: false,
        error: "Failed to save to memory",
      };
    },
  };
}

/**
 * Tool for agent to search historical conversations and memories
 */
export function createSearchMemoryTool(): AnyAgentTool {
  return {
    name: "search_memory",
    description:
      "Busca na memoria institucional por conversas e fatos relevantes. " +
      "Use para recuperar contexto historico, decisoes anteriores, ou informacoes que o Founder ja compartilhou.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Termo de busca ou pergunta",
        },
        limit: {
          type: "number",
          minimum: 1,
          maximum: 50,
          description: "Numero maximo de resultados (default 10)",
        },
      },
      required: ["query"],
    },
    async execute(params: { query: string; limit?: number }) {
      if (!isPostgresConfigured()) {
        return {
          success: false,
          error: "PostgreSQL not configured. Set DATABASE_URL or POSTGRES_* env vars.",
          memories: [],
        };
      }

      const results = await searchMessages({
        query: params.query,
        limit: params.limit ?? 10,
      });

      return {
        success: true,
        count: results.length,
        memories: results.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.created_at,
        })),
      };
    },
  };
}

/**
 * Tool for semantic vector search using embeddings
 */
export function createVectorSearchTool(): AnyAgentTool {
  return {
    name: "semantic_search",
    description:
      "Busca semântica na memória usando embeddings (pgvector). " +
      "Encontra conversas e informações semanticamente similares, mesmo que não contenham as mesmas palavras exatas. " +
      "Melhor para perguntas conceituais como 'o que discutimos sobre arquitetura?' ou 'decisões sobre infraestrutura'.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Pergunta ou termo de busca semântica",
        },
        limit: {
          type: "number",
          minimum: 1,
          maximum: 20,
          description: "Número máximo de resultados (default 5)",
        },
        threshold: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Limiar de similaridade (0-1, default 0.7). Maior = mais preciso, menor = mais resultados.",
        },
      },
      required: ["query"],
    },
    async execute(params: { query: string; limit?: number; threshold?: number }) {
      if (!isPostgresConfigured()) {
        return {
          success: false,
          error: "PostgreSQL not configured. Set DATABASE_URL or POSTGRES_* env vars.",
          memories: [],
        };
      }

      const results = await vectorSearch({
        query: params.query,
        limit: params.limit ?? 5,
        threshold: params.threshold ?? 0.7,
      });

      return {
        success: true,
        count: results.length,
        method: results.length > 0 && results[0].similarity > 0 ? "vector" : "fallback_fts",
        memories: results.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.created_at,
          similarity: m.similarity,
        })),
      };
    },
  };
}

/**
 * Tool for agent to get recent conversation context
 */
export function createGetContextTool(): AnyAgentTool {
  return {
    name: "get_conversation_context",
    description:
      "Recupera o contexto recente da conversa atual. " +
      "Use quando precisar relembrar o que foi discutido recentemente.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          minimum: 1,
          maximum: 100,
          description: "Numero maximo de mensagens (default 20)",
        },
      },
    },
    async execute(
      params: { limit?: number },
      ctx?: { sessionKey?: string; messageChannel?: string },
    ) {
      if (!isPostgresConfigured()) {
        return {
          success: false,
          error: "PostgreSQL not configured",
          messages: [],
        };
      }

      // Extract user ID from session key if available
      const userId = ctx?.sessionKey ?? "unknown";
      const channel = ctx?.messageChannel ?? "telegram";

      const messages = await getConversationContext({
        userId,
        channel,
        limit: params.limit ?? 20,
      });

      return {
        success: true,
        count: messages.length,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.created_at,
        })),
      };
    },
  };
}

/**
 * Tool for querying the knowledge graph (entities and relationships)
 */
export function createKnowledgeGraphTool(): AnyAgentTool {
  return {
    name: "query_knowledge_graph",
    description:
      "Consulta o grafo de conhecimento para encontrar entidades e suas conexões. " +
      "Útil para conversas longas onde você precisa lembrar quem é quem, quem trabalha onde, etc.",
    inputSchema: {
      type: "object",
      properties: {
        entity: {
          type: "string",
          description: "Nome da entidade para consultar (pessoa, empresa, projeto)",
        },
        include_facts: {
          type: "boolean",
          description: "Incluir fatos conhecidos sobre a entidade",
        },
      },
      required: ["entity"],
    },
    async execute(params: { entity: string; include_facts?: boolean }) {
      if (!isPostgresConfigured()) {
        return {
          success: false,
          error: "PostgreSQL not configured",
        };
      }

      const entity = await findEntity(params.entity);
      if (!entity) {
        return {
          success: false,
          message: `Entidade "${params.entity}" não encontrada no grafo`,
        };
      }

      const { outgoing, incoming } = await getEntityRelationships(params.entity);

      const result: any = {
        success: true,
        entity: {
          name: entity.name,
          type: entity.entity_type,
          description: entity.description,
        },
        relationships: {
          outgoing: outgoing.map((r) => `${r.type} → ${r.to}`),
          incoming: incoming.map((r) => `${r.from} → ${r.type}`),
        },
      };

      if (params.include_facts) {
        const facts = await getEntityFacts(params.entity, { limit: 10 });
        result.facts = facts.map((f) => ({
          type: f.fact_type,
          content: f.content,
          confidence: f.confidence,
        }));
      }

      return result;
    },
  };
}

/**
 * Tool for finding connections between entities
 */
export function createFindConnectionTool(): AnyAgentTool {
  return {
    name: "find_connection",
    description:
      "Encontra o caminho de conexão entre duas entidades no grafo. " +
      "Por exemplo: como Ronald está conectado a MENTORINGBASE?",
    inputSchema: {
      type: "object",
      properties: {
        from: {
          type: "string",
          description: "Entidade de origem",
        },
        to: {
          type: "string",
          description: "Entidade de destino",
        },
      },
      required: ["from", "to"],
    },
    async execute(params: { from: string; to: string }) {
      if (!isPostgresConfigured()) {
        return {
          success: false,
          error: "PostgreSQL not configured",
        };
      }

      const result = await findConnectionPath({
        from: params.from,
        to: params.to,
        maxDepth: 3,
      });

      if (!result || !result.found) {
        return {
          success: true,
          found: false,
          message: `Nenhuma conexão encontrada entre "${params.from}" e "${params.to}"`,
        };
      }

      // Format path nicely
      const pathStr = result.path!.entities
        .map((entity, i) => {
          if (i === result.path!.entities.length - 1) return entity;
          return `${entity} --[${result.path!.relationships[i]}]--> `;
        })
        .join("");

      return {
        success: true,
        found: true,
        path: pathStr,
        length: result.path!.length,
        details: {
          entities: result.path!.entities,
          relationships: result.path!.relationships,
        },
      };
    },
  };
}

/**
 * Tool for learning new facts about entities
 */
export function createLearnFactTool(): AnyAgentTool {
  return {
    name: "learn_fact",
    description:
      "Aprende um novo fato sobre uma entidade (pessoa, empresa, projeto). " +
      "Use quando o Founder compartilhar informações importantes que devem ser lembradas.",
    inputSchema: {
      type: "object",
      properties: {
        about: {
          type: "string",
          description: "Sobre quem/o quê é o fato",
        },
        type: {
          type: "string",
          enum: ["preference", "decision", "observation", "skill", "status"],
          description: "Tipo do fato",
        },
        fact: {
          type: "string",
          description: "O conteúdo do fato",
        },
        confidence: {
          type: "number",
          description: "Nível de confiança (0-1, padrão 0.9)",
          minimum: 0,
          maximum: 1,
        },
      },
      required: ["about", "type", "fact"],
    },
    async execute(params: {
      about: string;
      type: FactType;
      fact: string;
      confidence?: number;
    }) {
      if (!isPostgresConfigured()) {
        return {
          success: false,
          error: "PostgreSQL not configured",
        };
      }

      // Try to find entity, create if doesn't exist
      let entity = await findEntity(params.about);
      if (!entity) {
        // Infer entity type (basic heuristics)
        const type: EntityType = params.about.toUpperCase() === params.about
          ? "company"
          : "person";

        entity = await upsertEntity({
          type,
          name: params.about,
        });

        if (!entity) {
          return {
            success: false,
            error: `Failed to create entity "${params.about}"`,
          };
        }
      }

      const fact = await addFact({
        entity: params.about,
        type: params.type,
        content: params.fact,
        confidence: params.confidence,
      });

      if (!fact) {
        return {
          success: false,
          error: "Failed to save fact",
        };
      }

      return {
        success: true,
        message: `Aprendi: ${params.about} → [${params.type}] ${params.fact}`,
        fact_id: fact.id,
      };
    },
  };
}
