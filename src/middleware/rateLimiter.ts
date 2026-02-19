import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

/**
 * Global rate limiter middleware.
 * Applies to all API endpoints.
 */
export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

/**
 * Stricter rate limiter for authentication endpoints.
 * Protects against brute-force attacks on login, register, and password reset.
 */
export const authRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
  skipSuccessfulRequests: false,
});
