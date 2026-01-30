/**
 * [LOG:MAIN] Structured logger for aleff-workspace extension
 *
 * Outputs JSON to stderr for log aggregation (Grafana Loki, etc.)
 * Zero console.log - all output via structured JSON.
 *
 * @version 1.0.0
 * @created 2026-01-29
 */

// =============================================================================
// [LOG:TYPES] Type definitions
// =============================================================================

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

interface StructuredLogger {
  debug(ctx: LogContext, message: string): void;
  info(ctx: LogContext, message: string): void;
  warn(ctx: LogContext, message: string): void;
  error(ctx: LogContext, message: string): void;
}

// =============================================================================
// [LOG:FORMAT] Format log entry as JSON
// =============================================================================

/**
 * [FUNC:FORMAT] Format a log entry as structured JSON for log aggregation
 *
 * @param level Log level (debug, info, warn, error)
 * @param ctx Context object with additional fields
 * @param message Event message/identifier
 * @returns JSON string
 */
function formatLog(level: LogLevel, ctx: LogContext, message: string): string {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    plugin: "aleff-workspace",
    event: message,
    ...ctx,
  };
  return JSON.stringify(entry);
}

// =============================================================================
// [LOG:EXPORT] Exported logger instance
// =============================================================================

/**
 * [LOGGER:INSTANCE] Default structured logger that outputs JSON to stderr
 *
 * This format is compatible with log aggregation tools (Grafana Loki, etc.)
 * Debug logs only appear when LOG_LEVEL=debug or DEBUG is set.
 */
export const logger: StructuredLogger = {
  debug(ctx: LogContext, message: string): void {
    if (process.env.LOG_LEVEL === "debug" || process.env.DEBUG) {
      process.stderr.write(formatLog("debug", ctx, message) + "\n");
    }
  },

  info(ctx: LogContext, message: string): void {
    process.stderr.write(formatLog("info", ctx, message) + "\n");
  },

  warn(ctx: LogContext, message: string): void {
    process.stderr.write(formatLog("warn", ctx, message) + "\n");
  },

  error(ctx: LogContext, message: string): void {
    process.stderr.write(formatLog("error", ctx, message) + "\n");
  },
};
