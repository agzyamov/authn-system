import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import type { ErrorResponse, ValidationError } from '../types/api.js';

/**
 * Express middleware that checks for express-validator validation errors.
 * If errors exist, returns a 400 response with structured error details.
 * If no errors, calls next() to proceed to the route handler.
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export function validationErrorHandler(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const details: ValidationError[] = errors.array().map((err) => ({
      field: err.type === 'field' ? err.path : 'unknown',
      message: err.msg as string,
    }));

    const response: ErrorResponse = {
      error: 'Validation failed',
      details,
    };

    res.status(400).json(response);
    return;
  }

  next();
}
