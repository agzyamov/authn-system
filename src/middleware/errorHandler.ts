import type { Request, Response, NextFunction } from 'express';
import type { ErrorResponse } from '../types/api.js';
import { logger } from '../utils/logger.js';

/**
 * Custom application error with HTTP status code.
 */
export class AppError extends Error {
  /** HTTP status code */
  readonly statusCode: number;

  /** Whether this error is operational (expected) vs programming error */
  readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Determines the HTTP status code from an error.
 * @param err - The error to inspect
 * @returns HTTP status code
 */
function getStatusCode(err: Error): number {
  if (err instanceof AppError) {
    return err.statusCode;
  }
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
    return 401;
  }
  if (err.name === 'TokenExpiredError') {
    return 401;
  }
  return 500;
}

/**
 * Global Express error handling middleware.
 * Converts errors to standardized API error responses.
 * Logs programming errors (5xx) but not operational errors (4xx).
 *
 * @param err - The error
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function (required signature)
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const statusCode = getStatusCode(err);
  const isServerError = statusCode >= 500;

  if (isServerError) {
    logger.error({ err, req: { method: req.method, url: req.url } }, 'Server error');
  }

  // For expired/invalid JWT tokens, return clear Unauthorized message
  if (err.name === 'TokenExpiredError') {
    const response: ErrorResponse = { error: 'Token expired. Please log in again.' };
    res.status(401).json(response);
    return;
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
    const response: ErrorResponse = { error: 'Unauthorized' };
    res.status(401).json(response);
    return;
  }

  // Expose message for operational errors, generic message for 5xx
  const message =
    isServerError && !(err instanceof AppError) ? 'Internal server error' : err.message;

  const response: ErrorResponse = { error: message };
  res.status(statusCode).json(response);
}
