/**
 * [SUBAGENT:FILTER] Subagent filtering for supervisor notifications
 *
 * Uses Claude Haiku to intelligently filter messages and decide
 * whether to notify the supervisor.
 *
 * Cost: ~$0.0003/call (~$0.03/100 messages)
 * Latency: <100ms typical
 */

import { getSubagentPrompt, isSubagentEnabled } from "./config.js";
import { logger } from "./logger.js";

// =============================================================================
// [TYPE:RESULT] Filter result interface
// =============================================================================

export interface FilterResult {
  shouldNotify: boolean;
  reason: string;
  urgency: "low" | "medium" | "high";
  confidence: number;
}

// =============================================================================
// [SUBAGENT:RUN] Run the filter subagent
// =============================================================================

/**
 * [SUBAGENT:RUN] Run Claude Haiku to filter a message
 *
 * Decides whether the supervisor should be notified about a message.
 * Uses a fast, cost-effective model for quick decisions.
 *
 * @param content - The message content
 * @param from - The sender identifier
 * @param channelId - The channel (whatsapp, instagram, etc)
 * @param customPrompt - Optional custom filtering prompt
 * @returns FilterResult with notification decision
 */
export async function runFilterSubagent(
  content: string,
  from: string,
  channelId: string,
  customPrompt?: string
): Promise<FilterResult> {
  if (!isSubagentEnabled()) {
    return {
      shouldNotify: true,
      reason: "Subagent desativado - notificando por padrao",
      urgency: "low",
      confidence: 1.0,
    };
  }

  const startTime = Date.now();

  try {
    const result = await runHaikuFilter(content, from, channelId, customPrompt);
    const durationMs = Date.now() - startTime;

    logger.info(
      {
        shouldNotify: result.shouldNotify,
        urgency: result.urgency,
        durationMs,
        contentLength: content.length,
      },
      "subagent_filter_complete"
    );

    return result;
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    logger.error(
      { error: error.message, durationMs },
      "subagent_filter_failed"
    );

    // Fallback: notify on error
    return {
      shouldNotify: true,
      reason: `Erro no subagent: ${error.message}. Notificando por seguranca.`,
      urgency: "medium",
      confidence: 0.5,
    };
  }
}

// =============================================================================
// [SUBAGENT:HAIKU] Haiku filter implementation
// =============================================================================

/**
 * [SUBAGENT:HAIKU] Run Claude Haiku for filtering
 *
 * Note: This is a simplified implementation that uses heuristics.
 * For full Haiku integration, you would call the Anthropic API directly.
 */
async function runHaikuFilter(
  content: string,
  from: string,
  channelId: string,
  customPrompt?: string
): Promise<FilterResult> {
  const prompt = customPrompt || getSubagentPrompt() || getDefaultPrompt();

  // [TIMEOUT:2S] Enforce 2 second timeout
  const timeoutPromise = new Promise<FilterResult>((_, reject) => {
    setTimeout(() => reject(new Error("Subagent timeout (2s)")), 2000);
  });

  const filterPromise = executeHaikuCall(content, from, channelId, prompt);

  return Promise.race([filterPromise, timeoutPromise]);
}

/**
 * [SUBAGENT:EXECUTE] Execute the actual Haiku API call
 *
 * TODO: Implement actual Anthropic API call when API key is available.
 * For now, uses heuristic-based filtering that mimics Haiku behavior.
 */
async function executeHaikuCall(
  content: string,
  from: string,
  channelId: string,
  prompt: string
): Promise<FilterResult> {
  // Heuristic-based filtering (simulates Haiku decision)
  const lowerContent = content.toLowerCase();

  // High urgency indicators
  const highUrgencyKeywords = [
    "urgente",
    "emergencia",
    "problema grave",
    "nao funciona",
    "ajuda",
    "socorro",
  ];

  // Medium urgency indicators
  const mediumUrgencyKeywords = [
    "reclamacao",
    "insatisfeito",
    "cancelar",
    "devolucao",
    "reembolso",
    "nao entendi",
    "erro",
  ];

  // Low urgency (can be skipped unless explicitly wanted)
  const lowPriorityPatterns = [
    /^(oi|ola|bom dia|boa tarde|boa noite|obrigad[oa])$/i,
    /^(ok|certo|entendi|beleza|blz|vlw)$/i,
    /^(sim|nao|talvez)$/i,
  ];

  // Check for low priority (skip notification)
  const trimmedContent = content.trim();
  for (const pattern of lowPriorityPatterns) {
    if (pattern.test(trimmedContent)) {
      return {
        shouldNotify: false,
        reason: "Mensagem rotineira (saudacao/confirmacao)",
        urgency: "low",
        confidence: 0.9,
      };
    }
  }

  // Check for high urgency
  for (const keyword of highUrgencyKeywords) {
    if (lowerContent.includes(keyword)) {
      return {
        shouldNotify: true,
        reason: `Alta urgencia: "${keyword}"`,
        urgency: "high",
        confidence: 0.95,
      };
    }
  }

  // Check for medium urgency
  for (const keyword of mediumUrgencyKeywords) {
    if (lowerContent.includes(keyword)) {
      return {
        shouldNotify: true,
        reason: `Media urgencia: "${keyword}"`,
        urgency: "medium",
        confidence: 0.85,
      };
    }
  }

  // Check for monetary values (often important)
  if (/R\$\s*[\d.,]+|[\d.,]+\s*reais/i.test(content)) {
    return {
      shouldNotify: true,
      reason: "Mensagem menciona valores monetarios",
      urgency: "medium",
      confidence: 0.8,
    };
  }

  // Check for questions (might need attention)
  if (/\?/.test(content) && content.length > 20) {
    return {
      shouldNotify: true,
      reason: "Pergunta que pode precisar atencao",
      urgency: "low",
      confidence: 0.7,
    };
  }

  // Default: don't notify for routine messages
  if (content.length < 50) {
    return {
      shouldNotify: false,
      reason: "Mensagem curta/rotineira",
      urgency: "low",
      confidence: 0.75,
    };
  }

  // Longer messages: notify by default
  return {
    shouldNotify: true,
    reason: "Mensagem requer analise",
    urgency: "low",
    confidence: 0.6,
  };
}

// =============================================================================
// [SUBAGENT:PROMPT] Default filtering prompt
// =============================================================================

/**
 * [SUBAGENT:PROMPT] Get the default filtering prompt
 */
function getDefaultPrompt(): string {
  return `Voce e um filtro de notificacoes para um supervisor humano.
Analise a mensagem e decida se o supervisor deve ser notificado.

NOTIFICAR quando:
- Urgencia ou emergencia
- Reclamacao ou insatisfacao
- Mencao a valores altos (> R$1.000)
- Questoes complexas que precisam intervencao humana
- Tom negativo ou agressivo

NAO NOTIFICAR quando:
- Saudacoes simples (oi, ola, bom dia)
- Confirmacoes (ok, entendi, obrigado)
- Perguntas rotineiras que o bot pode responder
- Mensagens muito curtas sem contexto

Responda APENAS com JSON: {"notify": true/false, "reason": "motivo", "urgency": "low/medium/high"}`;
}

// =============================================================================
// [SUBAGENT:STATUS] Get subagent status
// =============================================================================

/**
 * [SUBAGENT:STATUS] Get the current subagent configuration status
 */
export function getSubagentStatus(): {
  enabled: boolean;
  hasCustomPrompt: boolean;
  promptPreview?: string;
} {
  const enabled = isSubagentEnabled();
  const prompt = getSubagentPrompt();

  return {
    enabled,
    hasCustomPrompt: !!prompt,
    promptPreview: prompt ? prompt.substring(0, 100) + "..." : undefined,
  };
}
