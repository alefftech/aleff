/**
 * [DB:PROXY] PostgreSQL connection proxy for Aleff Memory
 *
 * Re-exports from shared postgres module to maintain backward compatibility.
 * The shared module provides a singleton pool used by all plugins.
 *
 * @version 2.0.0
 * @updated 2026-01-29
 */

// [EXPORT:SHARED] Re-export from shared postgres module
export {
  getPool,
  isPostgresConfigured,
  query,
  queryOne,
  execute,
  transaction,
  healthCheck,
} from "../../../src/shared/postgres/index.js";
