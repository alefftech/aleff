/**
 * [DB:SHARED] Shared PostgreSQL Connection Pool
 *
 * Global singleton connection pool for all plugins.
 * Uses Symbol.for() to guarantee single instance across module reloads.
 *
 * @version 1.1.0
 * @updated 2026-01-30
 */

import pg from "pg";

// [IMPORT:RETRY] Import retry utility for cold boot scenarios
import { retryAsync, type RetryOptions } from "../../infra/retry.js";

const { Pool } = pg;

// =============================================================================
// [DB:GLOBAL_SYMBOL] Global singleton key
// =============================================================================
// Using Symbol.for() ensures same symbol across all module instances.
// This is critical because jiti may load this module multiple times.

const POOL_SYMBOL = Symbol.for("aleffai.postgres.pool");
const POOL_STATE_SYMBOL = Symbol.for("aleffai.postgres.state");

interface PoolState {
  pool: pg.Pool | null;
  initialized: boolean;
  error: Error | null;
}

// =============================================================================
// [DB:CONFIG] Pool configuration
// =============================================================================

const DEFAULT_POOL_CONFIG = {
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// =============================================================================
// [DB:STATE] Get or initialize global state
// =============================================================================

function getGlobalState(): PoolState {
  const globalAny = globalThis as Record<symbol, PoolState>;

  if (!globalAny[POOL_STATE_SYMBOL]) {
    globalAny[POOL_STATE_SYMBOL] = {
      pool: null,
      initialized: false,
      error: null,
    };
  }

  return globalAny[POOL_STATE_SYMBOL];
}

// =============================================================================
// [DB:LOGGING] Structured logging helper
// =============================================================================

function log(level: "info" | "error" | "debug", event: string, data?: Record<string, unknown>): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    module: "shared-postgres",
    event,
    ...data,
  };
  process.stderr.write(JSON.stringify(entry) + "\n");
}

// =============================================================================
// [DB:POOL] Pool management functions
// =============================================================================

/**
 * [FUNC:GET_POOL] Get or create the shared PostgreSQL connection pool
 *
 * @returns Pool instance or null if not configured
 */
export function getPool(): pg.Pool | null {
  const state = getGlobalState();

  // [POOL:CACHED] Return existing pool
  if (state.pool) {
    return state.pool;
  }

  // [POOL:ERROR] Return null if previous init failed
  if (state.initialized && state.error) {
    return null;
  }

  // [CONFIG:CHECK] Check if PostgreSQL is configured
  if (!isPostgresConfigured()) {
    return null;
  }

  state.initialized = true;

  try {
    const connectionString = process.env.DATABASE_URL;

    // [CONFIG:BUILD] Create pool
    if (connectionString) {
      state.pool = new Pool({
        connectionString,
        ...DEFAULT_POOL_CONFIG,
      });
    } else {
      state.pool = new Pool({
        host: process.env.POSTGRES_HOST,
        port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
        ...DEFAULT_POOL_CONFIG,
      });
    }

    // [POOL:CREATED] Log creation
    log("info", "pool_created", {
      config: {
        max: DEFAULT_POOL_CONFIG.max,
        connectionTimeoutMillis: DEFAULT_POOL_CONFIG.connectionTimeoutMillis,
      },
    });

    // [POOL:ERROR_HANDLER] Handle pool errors
    state.pool.on("error", (err) => {
      log("error", "pool_error", { error: err.message, stack: err.stack });
    });

    return state.pool;
  } catch (err) {
    state.error = err instanceof Error ? err : new Error(String(err));
    log("error", "pool_creation_failed", { error: state.error.message });
    return null;
  }
}

// =============================================================================
// [DB:HELPERS] Query helper functions
// =============================================================================

/**
 * [FUNC:CONFIGURED] Check if PostgreSQL is configured
 */
export function isPostgresConfigured(): boolean {
  if (process.env.DATABASE_URL) {
    return true;
  }

  return Boolean(
    process.env.POSTGRES_HOST &&
    process.env.POSTGRES_USER &&
    process.env.POSTGRES_PASSWORD &&
    process.env.POSTGRES_DB
  );
}

/**
 * [FUNC:QUERY] Execute a query and return all rows
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const pool = getPool();
  if (!pool) {
    throw new Error("PostgreSQL not configured.");
  }

  const result = await pool.query(text, params);
  return result.rows as T[];
}

/**
 * [FUNC:QUERY_ONE] Execute a query and return first row or null
 */
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

/**
 * [FUNC:EXECUTE] Execute a query without returning rows
 */
export async function execute(text: string, params?: unknown[]): Promise<number> {
  const pool = getPool();
  if (!pool) {
    throw new Error("PostgreSQL not configured.");
  }

  const result = await pool.query(text, params);
  return result.rowCount || 0;
}

/**
 * [FUNC:TRANSACTION] Execute queries in a transaction
 */
export async function transaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  if (!pool) {
    throw new Error("PostgreSQL not configured.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * [FUNC:HEALTH_CHECK] Check if PostgreSQL connection is healthy
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query<{ ok: number }>("SELECT 1 as ok");
    return result.length === 1 && result[0].ok === 1;
  } catch {
    return false;
  }
}

/**
 * [FUNC:CLOSE] Close the connection pool
 */
export async function closePool(): Promise<void> {
  const state = getGlobalState();
  if (state.pool) {
    await state.pool.end();
    state.pool = null;
    state.initialized = false;
    state.error = null;
  }
}

// =============================================================================
// [DB:RETRY] Pool with retry for cold boot scenarios
// =============================================================================

// [CONFIG:RETRY] Pool retry configuration for cold boot
const POOL_RETRY_CONFIG: RetryOptions = {
  attempts: 5,
  minDelayMs: 1000,
  maxDelayMs: 30000,
  jitter: 0.2,
  label: "postgres-pool",
  shouldRetry: (err) => {
    const msg = String(err).toLowerCase();
    return (
      msg.includes("econnrefused") ||
      msg.includes("etimedout") ||
      msg.includes("connection") ||
      msg.includes("timeout")
    );
  },
  onRetry: (info) => {
    log("info", "pool_retry_attempt", {
      attempt: info.attempt,
      maxAttempts: info.maxAttempts,
      delayMs: info.delayMs,
      error: String(info.err),
    });
  },
};

/**
 * [FUNC:GET_POOL_RETRY] Get pool with retry on cold boot
 *
 * Uses exponential backoff when postgres is not ready.
 * Essential for cold boot when both containers start together.
 *
 * @returns Pool or throws after max retries
 */
export async function getPoolWithRetry(): Promise<pg.Pool> {
  return retryAsync(async () => {
    const pool = getPool();
    if (!pool) {
      throw new Error("PostgreSQL not configured or pool creation failed");
    }
    // [STEP:VERIFY] Test connection is actually working
    await pool.query("SELECT 1");
    return pool;
  }, POOL_RETRY_CONFIG);
}
