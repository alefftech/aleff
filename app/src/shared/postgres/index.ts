/**
 * [DB:SHARED] Shared PostgreSQL Module
 *
 * Provides a singleton connection pool for all plugins.
 *
 * @version 1.0.0
 * @created 2026-01-29
 */

export {
  getPool,
  getPoolWithRetry,
  isPostgresConfigured,
  query,
  queryOne,
  execute,
  transaction,
  healthCheck,
  closePool,
} from "./pool.js";
