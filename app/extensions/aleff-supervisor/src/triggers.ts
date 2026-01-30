/**
 * [TRIGGERS:ANALYZE] Trigger analysis for supervisor notifications
 *
 * Analyzes incoming messages against configured triggers to determine
 * if the supervisor should be notified.
 */

import { getTriggers, type SupervisorTrigger } from "./config.js";
import { logger } from "./logger.js";

// =============================================================================
// [TYPE:RESULT] Trigger analysis result
// =============================================================================

export interface TriggerResult {
  matched: boolean;
  matchedTriggers: SupervisorTrigger[];
  reasons: string[];
}

// =============================================================================
// [ANALYZE:MAIN] Main trigger analysis function
// =============================================================================

/**
 * [ANALYZE:MAIN] Analyze a message against all configured triggers
 *
 * @param content - The message content to analyze
 * @param from - The sender identifier
 * @param metadata - Additional message metadata
 * @returns TriggerResult indicating if any triggers matched
 */
export function analyzeTriggers(
  content: string,
  from: string,
  metadata?: Record<string, unknown>
): TriggerResult {
  const triggers = getTriggers().filter((t) => t.enabled);

  if (triggers.length === 0) {
    return { matched: false, matchedTriggers: [], reasons: [] };
  }

  const matchedTriggers: SupervisorTrigger[] = [];
  const reasons: string[] = [];

  for (const trigger of triggers) {
    const result = checkTrigger(trigger, content, from, metadata);
    if (result.matched) {
      matchedTriggers.push(trigger);
      reasons.push(result.reason);
    }
  }

  const matched = matchedTriggers.length > 0;

  if (matched) {
    logger.info(
      {
        matchCount: matchedTriggers.length,
        triggerIds: matchedTriggers.map((t) => t.id),
        contentLength: content.length,
      },
      "triggers_matched"
    );
  }

  return { matched, matchedTriggers, reasons };
}

// =============================================================================
// [ANALYZE:SINGLE] Check a single trigger
// =============================================================================

/**
 * [ANALYZE:SINGLE] Check if a single trigger matches the content
 */
function checkTrigger(
  trigger: SupervisorTrigger,
  content: string,
  from: string,
  metadata?: Record<string, unknown>
): { matched: boolean; reason: string } {
  const lowerContent = content.toLowerCase();

  switch (trigger.type) {
    case "keyword":
      return checkKeywordTrigger(trigger, lowerContent);

    case "regex":
      return checkRegexTrigger(trigger, content);

    case "value":
      return checkValueTrigger(trigger, content);

    case "sentiment":
      return checkSentimentTrigger(trigger, lowerContent);

    default:
      return { matched: false, reason: "" };
  }
}

// =============================================================================
// [TRIGGER:KEYWORD] Keyword trigger check
// =============================================================================

/**
 * [TRIGGER:KEYWORD] Check for keyword matches
 *
 * Pattern format: comma-separated keywords
 * Example: "urgente,problema,reclamacao"
 */
function checkKeywordTrigger(
  trigger: SupervisorTrigger,
  lowerContent: string
): { matched: boolean; reason: string } {
  const keywords = trigger.pattern
    .toLowerCase()
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  for (const keyword of keywords) {
    if (lowerContent.includes(keyword)) {
      return {
        matched: true,
        reason: `Keyword "${keyword}" encontrado`,
      };
    }
  }

  return { matched: false, reason: "" };
}

// =============================================================================
// [TRIGGER:REGEX] Regex trigger check
// =============================================================================

/**
 * [TRIGGER:REGEX] Check for regex pattern matches
 *
 * Pattern format: Regular expression (without delimiters)
 * Example: "R\$\s*\d+\.?\d*" for currency
 */
function checkRegexTrigger(
  trigger: SupervisorTrigger,
  content: string
): { matched: boolean; reason: string } {
  try {
    const regex = new RegExp(trigger.pattern, "gi");
    const match = content.match(regex);

    if (match) {
      return {
        matched: true,
        reason: `Regex match: "${match[0]}"`,
      };
    }
  } catch (error) {
    logger.warn(
      { triggerId: trigger.id, pattern: trigger.pattern, error: String(error) },
      "trigger_regex_invalid"
    );
  }

  return { matched: false, reason: "" };
}

// =============================================================================
// [TRIGGER:VALUE] Value/amount trigger check
// =============================================================================

/**
 * [TRIGGER:VALUE] Check for monetary values above threshold
 *
 * Pattern format: Number (minimum value)
 * Example: "10000" to trigger on values >= R$10.000
 */
function checkValueTrigger(
  trigger: SupervisorTrigger,
  content: string
): { matched: boolean; reason: string } {
  const threshold = parseFloat(trigger.pattern);
  if (isNaN(threshold)) {
    return { matched: false, reason: "" };
  }

  // Match various currency formats: R$ 10.000, 10000, R$10.000,00
  const valuePatterns = [
    /R\$\s*([\d.,]+)/gi, // Brazilian Real
    /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:reais|R\$)/gi, // "10.000 reais"
    /(?:valor|preco|custo|total)[:\s]*R?\$?\s*([\d.,]+)/gi, // "valor: 10000"
  ];

  for (const pattern of valuePatterns) {
    const matches = [...content.matchAll(pattern)];
    for (const match of matches) {
      const valueStr = match[1]
        ?.replace(/\./g, "")  // Remove thousands separator
        .replace(",", ".");    // Convert decimal separator

      const value = parseFloat(valueStr || "0");
      if (!isNaN(value) && value >= threshold) {
        return {
          matched: true,
          reason: `Valor R$${value.toLocaleString("pt-BR")} >= R$${threshold.toLocaleString("pt-BR")}`,
        };
      }
    }
  }

  return { matched: false, reason: "" };
}

// =============================================================================
// [TRIGGER:SENTIMENT] Sentiment trigger check
// =============================================================================

/**
 * [TRIGGER:SENTIMENT] Check for negative sentiment indicators
 *
 * Pattern format: sentiment type
 * Example: "negative" to trigger on complaints/issues
 */
function checkSentimentTrigger(
  trigger: SupervisorTrigger,
  lowerContent: string
): { matched: boolean; reason: string } {
  const sentimentType = trigger.pattern.toLowerCase();

  if (sentimentType === "negative" || sentimentType === "negativo") {
    // Keywords indicating negative sentiment in Portuguese
    const negativeIndicators = [
      "reclamacao",
      "problema",
      "urgente",
      "insatisfeito",
      "raiva",
      "decepcionado",
      "absurdo",
      "vergonha",
      "nao funciona",
      "pessimo",
      "horrivel",
      "cancelar",
      "reembolso",
      "devolucao",
      "advogado",
      "procon",
      "processo",
      "reclame aqui",
    ];

    for (const indicator of negativeIndicators) {
      if (lowerContent.includes(indicator)) {
        return {
          matched: true,
          reason: `Sentimento negativo: "${indicator}"`,
        };
      }
    }
  }

  if (sentimentType === "urgent" || sentimentType === "urgente") {
    const urgentIndicators = [
      "urgente",
      "emergencia",
      "socorro",
      "ajuda",
      "rapido",
      "agora",
      "imediato",
      "pressa",
      "preciso",
    ];

    for (const indicator of urgentIndicators) {
      if (lowerContent.includes(indicator)) {
        return {
          matched: true,
          reason: `Urgencia detectada: "${indicator}"`,
        };
      }
    }
  }

  return { matched: false, reason: "" };
}

// =============================================================================
// [FORMAT:TRIGGERS] Format triggers for display
// =============================================================================

/**
 * [FORMAT:TRIGGERS] Format trigger list as readable string
 */
export function formatTriggers(): string {
  const triggers = getTriggers();

  if (triggers.length === 0) {
    return "Nenhum trigger configurado.";
  }

  const lines: string[] = ["**Triggers Configurados:**\n"];

  for (const trigger of triggers) {
    const status = trigger.enabled ? "[ON]" : "[OFF]";
    const typeLabel = {
      keyword: "Keyword",
      regex: "Regex",
      value: "Valor",
      sentiment: "Sentimento",
    }[trigger.type];

    lines.push(`${status} **${typeLabel}**: ${trigger.pattern}`);
    if (trigger.description) {
      lines.push(`    ${trigger.description}`);
    }
    lines.push(`    ID: ${trigger.id}`);
  }

  return lines.join("\n");
}
