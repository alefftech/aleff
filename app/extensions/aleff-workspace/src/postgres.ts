/**
 * [DB:PROXY] PostgreSQL connection proxy for Aleff Workspace
 *
 * Re-exports from shared postgres module to maintain local interface.
 * This allows the plugin to use the shared connection pool while
 * keeping its own namespace for potential future customizations.
 *
 * @version 1.0.0
 * @created 2026-01-29
 */

// [EXPORT:SHARED] Re-export from shared postgres module
export {
  getPool,
  getPoolWithRetry,
  isPostgresConfigured,
  query,
  queryOne,
  execute,
  transaction,
  healthCheck,
} from "../../../src/shared/postgres/index.js";
