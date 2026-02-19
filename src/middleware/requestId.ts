import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Extends Express Request to include a unique request ID for distributed tracing.
 */
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      /** Unique request ID for distributed tracing */
      requestId?: string;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

/**
 * Request ID middleware.
 * Assigns a UUID to each incoming request for distributed tracing and log correlation.
 * Uses the X-Request-ID header if provided, otherwise generates a new UUID.
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string | undefined) ?? uuidv4();

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}
