import fs from 'fs';
import path from 'path';
import { pool } from '../src/config/database.js';

/**
 * Database migration runner.
 * Applies or rolls back SQL migration files in order.
 * Tracks applied migrations in a migrations table.
 */

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const MIGRATIONS_TABLE = 'schema_migrations';

/**
 * Creates the migrations tracking table if it doesn't exist.
 */
async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);
}

/**
 * Returns list of already-applied migration filenames.
 */
async function getAppliedMigrations(): Promise<string[]> {
  const result = await pool.query<{ filename: string }>(
    `SELECT filename FROM ${MIGRATIONS_TABLE} ORDER BY filename ASC`,
  );
  return result.rows.map((r) => r.filename);
}

/**
 * Applies all pending UP migrations in alphabetical order.
 */
async function runUp(): Promise<void> {
  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql') && !f.startsWith('down'))
    .sort();

  const pending = files.filter((f) => !applied.includes(f));

  if (pending.length === 0) {
    console.log('No pending migrations.');
    return;
  }

  for (const file of pending) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(`INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES ($1)`, [file]);
      await client.query('COMMIT');
      console.log(`✓ Applied: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`✗ Failed: ${file}`, err);
      throw err;
    } finally {
      client.release();
    }
  }
}

/**
 * Rolls back all migrations using the down.sql file.
 */
async function runDown(): Promise<void> {
  const downFile = path.join(MIGRATIONS_DIR, 'down.sql');
  if (!fs.existsSync(downFile)) {
    console.error('No down.sql file found');
    process.exit(1);
  }

  const sql = fs.readFileSync(downFile, 'utf8');
  await pool.query(sql);
  console.log('✓ Rolled back all migrations');
}

/**
 * Main entry point for migration runner.
 * Usage: ts-node database/migrate.ts [up|down]
 */
async function main(): Promise<void> {
  const direction = process.argv[2] ?? 'up';

  try {
    if (direction === 'up') {
      await runUp();
    } else if (direction === 'down') {
      await runDown();
    } else {
      console.error(`Unknown direction: ${direction}. Use 'up' or 'down'.`);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

void main().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
