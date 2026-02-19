import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Background job: Cleans up expired and used password reset records.
 * Runs periodically to prevent the password_resets table from growing unbounded.
 *
 * Retention policy: Delete expired/used resets older than 7 days.
 */
export async function cleanupExpiredResets(): Promise<number> {
  const result = await query(
    `DELETE FROM password_resets
     WHERE (expires_at < NOW() OR used_at IS NOT NULL)
       AND created_at < NOW() - INTERVAL '7 days'`,
  );

  const count = result.rowCount ?? 0;
  logger.info({ deletedCount: count }, 'Cleaned up expired password resets');
  return count;
}

/**
 * Starts the cleanup job to run on a schedule.
 * @param intervalMs - How often to run (default: every 6 hours)
 */
export function startCleanupJob(intervalMs = 6 * 60 * 60 * 1000): NodeJS.Timeout {
  logger.info({ intervalMs }, 'Starting cleanup job for expired password resets');
  return setInterval(() => {
    void cleanupExpiredResets().catch((err) => logger.error({ err }, 'Cleanup job error'));
  }, intervalMs);
}
