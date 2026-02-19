import { createApp } from './app.js';
import { config } from './config/env.js';
import { testConnection, closePool } from './config/database.js';
import { logger } from './utils/logger.js';
import { startCleanupJob } from './jobs/cleanupExpiredResets.js';
import { startAuthEventsCleanupJob } from './jobs/cleanupOldAuthEvents.js';

/**
 * Application entry point.
 * Starts the Express HTTP server after verifying database connectivity.
 */
async function startServer(): Promise<void> {
  // Verify database connection before accepting traffic
  await testConnection();

  const app = createApp();

  const server = app.listen(config.port, () => {
    logger.info(
      { port: config.port, nodeEnv: config.nodeEnv },
      `Server started on port ${config.port}`,
    );

    // Start background maintenance jobs
    startCleanupJob();
    startAuthEventsCleanupJob();
  });

  // Graceful shutdown handlers
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Received shutdown signal');

    await new Promise<void>((resolve) => {
      server.close(() => {
        resolve();
      });
    });
    logger.info('HTTP server closed');
    await closePool();
    logger.info('Shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled rejection');
    process.exit(1);
  });
}

void startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
