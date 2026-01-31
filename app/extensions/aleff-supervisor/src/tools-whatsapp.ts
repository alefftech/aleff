/**
 * [TOOL:WHATSAPP_MESSAGES] Consulta mensagens do WhatsApp
 *
 * Tool para o supervisor consultar historico de mensagens do WhatsApp.
 * Substitui as notificacoes automaticas que poluiam o chat.
 *
 * SECURITY: Apenas supervisor (Telegram) pode usar, pois a tool
 * esta registrada no plugin supervisor que roda apenas no contexto
 * do agente "aleff" no Telegram.
 *
 * @version 1.0.0
 * @created 2026-01-31
 */

import { query, isPostgresConfigured } from "../../../src/shared/postgres/index.js";
import { type AnyAgentTool, jsonResult } from "../../../src/agents/tools/common.js";
import { logger } from "./logger.js";

// =============================================================================
// [TYPE:PARAMS] Tool parameters
// =============================================================================

interface WhatsAppMessagesParams {
  limit?: number;
  phone?: string;
  days?: number;
  search?: string;
}

// =============================================================================
// [TOOL:CREATE] Create whatsapp_messages tool
// =============================================================================

export function createWhatsAppMessagesTool(): AnyAgentTool {
  return {
    name: "whatsapp_messages",
    description:
      "Consulta mensagens recebidas no WhatsApp. " +
      "Filtros: limit (max 100, default 20), phone (numero ex: 5511999999999), " +
      "days (periodo em dias, default 7), search (buscar texto no conteudo). " +
      "Retorna lista de mensagens com phone, name, role, content e timestamp.",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximo de mensagens a retornar (default: 20, max: 100)",
        },
        phone: {
          type: "string",
          description: "Filtrar por numero de telefone (ex: 5511999999999)",
        },
        days: {
          type: "number",
          description: "Ultimos N dias (default: 7)",
        },
        search: {
          type: "string",
          description: "Buscar texto no conteudo das mensagens",
        },
      },
      required: [],
    },
    async execute(_toolCallId: string, params: WhatsAppMessagesParams) {
      // [GUARD:POSTGRES] Check if postgres is configured
      if (!isPostgresConfigured()) {
        return jsonResult({
          success: false,
          error: "PostgreSQL nao configurado. Configure DATABASE_URL ou POSTGRES_* env vars.",
        });
      }

      // [PARAMS:VALIDATE] Validate and normalize parameters
      const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
      const days = Math.max(params.days ?? 7, 1);

      try {
        // [QUERY:BUILD] Build SQL query with filters
        let sql = `
          SELECT
            m.role,
            m.content,
            m.created_at,
            c.user_id as phone,
            c.user_name as name
          FROM messages m
          JOIN conversations c ON m.conversation_id = c.id
          WHERE c.channel = 'whatsapp'
          AND m.created_at > NOW() - INTERVAL '${days} days'
        `;

        const queryParams: unknown[] = [];
        let paramIndex = 1;

        // [FILTER:PHONE] Filter by phone number
        if (params.phone) {
          sql += ` AND c.user_id LIKE $${paramIndex}`;
          queryParams.push(`%${params.phone}%`);
          paramIndex++;
        }

        // [FILTER:SEARCH] Filter by content search
        if (params.search) {
          sql += ` AND m.content ILIKE $${paramIndex}`;
          queryParams.push(`%${params.search}%`);
          paramIndex++;
        }

        sql += ` ORDER BY m.created_at DESC LIMIT ${limit}`;

        // [QUERY:EXECUTE] Run the query
        const results = await query<{
          role: string;
          content: string;
          created_at: Date;
          phone: string;
          name: string;
        }>(sql, queryParams);

        logger.info(
          {
            count: results.length,
            days,
            phone: params.phone ? "***filtered***" : undefined,
            search: params.search ? "***filtered***" : undefined,
          },
          "whatsapp_messages_queried"
        );

        // [RESULT:FORMAT] Format results
        return jsonResult({
          success: true,
          count: results.length,
          period: `ultimos ${days} dias`,
          filters: {
            phone: params.phone || null,
            search: params.search || null,
          },
          messages: results.map((m) => ({
            phone: m.phone,
            name: m.name || "Desconhecido",
            role: m.role,
            content: m.content?.substring(0, 500) || "(sem conteudo)",
            timestamp: m.created_at,
          })),
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({ error: errorMessage }, "whatsapp_messages_query_failed");
        return jsonResult({
          success: false,
          error: errorMessage,
        });
      }
    },
  };
}
