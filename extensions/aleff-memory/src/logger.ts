/**
 * [LOG:MAIN] Structured logger for aleff-memory extension
 *
 * Outputs JSON to stderr for log aggregation (Grafana Loki, etc.)
 * Zero console.log - all output via structured JSON.
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

/**
 * Format a log entry as structured JSON for log aggregation
 */
function formatLog(level: LogLevel, ctx: LogContext, message: string): string {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    plugin: "aleff-memory",
    event: message,
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
