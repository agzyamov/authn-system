import express, { type Application } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import docsRouter from './routes/docs.js';
import { config } from './config/env.js';

/**
 * Creates and configures the Express application.
 * Sets up middleware, routes, and error handling.
 * @returns Configured Express application
 */
export function createApp(): Application {
  const app = express();

  // Parse JSON request bodies
  app.use(express.json({ limit: '10kb' }));

  // Parse URL-encoded request bodies
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Assign and propagate a unique request ID for distributed tracing
  app.use(requestIdMiddleware);

  // CORS configuration
  app.use(
    cors({
      origin: config.nodeEnv === 'production' ? config.appUrl : '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // Request logging (skip in test environment)
  if (config.nodeEnv !== 'test') {
    app.use(requestLogger);
  }

  // Global rate limiter
  const globalLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });
  app.use(globalLimiter);

  // Routes
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/docs', docsRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
