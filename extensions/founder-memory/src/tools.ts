import type { AnyAgentTool } from "../../../src/agents/tools/common.js";
import { saveToMemoryIndex, searchMessages, getConversationContext } from "./persist.js";
import { isPostgresConfigured } from "./postgres.js";

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
