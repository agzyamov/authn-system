import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

/** Retention period for auth events in days. */
const AUTH_EVENT_RETENTION_DAYS = 90;

/**
 * Background job: Removes auth events older than 90 days.
 * Maintains audit log size within manageable bounds.
 *
 * @returns Number of deleted records
 */
export async function cleanupOldAuthEvents(): Promise<number> {
  const result = await query(
    `DELETE FROM auth_events
     WHERE created_at < NOW() - INTERVAL '${AUTH_EVENT_RETENTION_DAYS} days'`,
  );

  const count = result.rowCount ?? 0;
  logger.info({ deletedCount: count }, 'Cleaned up old auth events');
  return count;
}

/**
 * Starts the auth events cleanup job.
 * @param intervalMs - How often to run (default: every 24 hours)
 */
export function startAuthEventsCleanupJob(intervalMs = 24 * 60 * 60 * 1000): NodeJS.Timeout {
  logger.info({ intervalMs }, 'Starting cleanup job for old auth events');
  return setInterval(() => {
    void cleanupOldAuthEvents().catch((err) =>
      logger.error({ err }, 'Auth events cleanup job error'),
    );
  }, intervalMs);
}
