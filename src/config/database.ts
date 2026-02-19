import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

/**
 * PostgreSQL connection pool configuration.
 * Uses environment variables for all connection parameters.
 */
const poolConfig = {
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  min: config.db.poolMin,
  max: config.db.poolMax,
  ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

/**
 * Application-wide PostgreSQL connection pool.
 * Reuses connections across requests for performance.
 */
export const pool = new Pool(poolConfig);

// Log pool errors without crashing the process
pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected PostgreSQL pool error');
});

/**
 * Executes a parameterized SQL query using the connection pool.
 * @param text - SQL query string with $1, $2, ... placeholders
 * @param params - Query parameter values (prevents SQL injection)
 * @returns Query result from PostgreSQL
 */
export async function query<T extends QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  logger.debug({ query: text, duration, rows: result.rowCount }, 'Executed query');
  return result;
}

/**
 * Acquires a dedicated client for transaction management.
 * Caller is responsible for releasing the client.
 * @returns Pool client with release method
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Tests the database connection by executing a simple query.
 * @throws Error if the database connection fails
 */
export async function testConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    logger.info('Database connection verified');
  } finally {
    client.release();
  }
}

/**
 * Gracefully closes all pool connections.
 * Should be called on application shutdown.
 */
export async function closePool(): Promise<void> {
  await pool.end();
  logger.info('Database pool closed');
}
