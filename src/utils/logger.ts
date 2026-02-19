import pino from 'pino';
import { config } from '../config/env.js';

const isDevelopment = config.nodeEnv === 'development';
const isTest = config.nodeEnv === 'test';

/**
 * Application logger instance.
 * Uses pino for structured JSON logging in production.
 * Uses pino-pretty for human-readable output in development.
 * Silent in test environment to avoid noise during tests.
 */
export const logger = pino({
  level: isTest ? 'silent' : isDevelopment ? 'debug' : 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  redact: {
    paths: ['password', 'password_hash', 'reset_token', 'token', '*.password', '*.token'],
    censor: '[REDACTED]',
  },
});
