import type { Router, Request, Response } from 'express';
import { Router as createRouter } from 'express';
import type { HealthResponse } from '../types/api.js';

/**
 * Health check router.
 * Provides a simple endpoint for monitoring and load balancer checks.
 */
const router: Router = createRouter();

/**
 * GET /api/health
 * Returns service health status (no authentication required).
 */
router.get('/', (_req: Request, res: Response<HealthResponse>): void => {
  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(response);
});

export default router;
