/**
 * Structured logger for founder-memory extension
 *
 * Uses the main moltbot logger when available, falls back to console with structured format.
 * All log messages include the [founder-memory] prefix for easy filtering.
 */

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

const PREFIX = "[founder-memory]";

/**
 * Format a log entry as structured JSON for log aggregation
 */
function formatLog(level: LogLevel, ctx: LogContext, message: string): string {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    component: "founder-memory",
    message,
    ...ctx,
  };
  return JSON.stringify(entry);
}

/**
 * Default structured logger that outputs JSON to stderr
 * This format is compatible with log aggregation tools (Grafana Loki, etc.)
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
