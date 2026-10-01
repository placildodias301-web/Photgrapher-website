import mysql, { type ResultSetHeader } from "mysql2/promise";

// Single shared pool, reused across hot-reloads in dev so we don't
// exhaust MySQL's connection limit every time Next.js recompiles.
declare global {
  var __mysqlPool: mysql.Pool | undefined;
}

function createPool() {
  const p = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pascoal_photography",
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
    // Everything is stored and exchanged as UTC; the browser formats it in the viewer's timezone.
    timezone: "Z",
  });
  p.on("connection", (conn) => { conn.query("SET time_zone = '+00:00'"); });
  return p;
}

export const pool = global.__mysqlPool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  global.__mysqlPool = pool;
}

/** Run a query and get back typed rows. */
export async function query<T = unknown>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

/** Run a query expected to return exactly zero or one row. */
export async function queryOne<T = unknown>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** Run INSERT/UPDATE/DELETE and get affected rows / insertId. */
export async function exec(sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
  const [res] = await pool.query<ResultSetHeader>(sql, params);
  return res;
}
