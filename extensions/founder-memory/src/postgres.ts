import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool | null {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    // Try individual env vars
    const host = process.env.POSTGRES_HOST;
    const port = process.env.POSTGRES_PORT || "5432";
    const user = process.env.POSTGRES_USER;
    const password = process.env.POSTGRES_PASSWORD;
    const database = process.env.POSTGRES_DB;

    if (!host || !user || !password || !database) {
      return null;
    }

    pool = new Pool({
      host,
      port: parseInt(port, 10),
      user,
      password,
      database,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  } else {
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }

  // Handle pool errors
  pool.on("error", (err) => {
    console.error("[founder-memory] Postgres pool error:", err.message);
  });

  return pool;
}

export function isPostgresConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL ||
    (process.env.POSTGRES_HOST && process.env.POSTGRES_USER && process.env.POSTGRES_PASSWORD && process.env.POSTGRES_DB)
  );
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const pool = getPool();
  if (!pool) {
    throw new Error("Postgres not configured");
  }
  
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}
