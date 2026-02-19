import dotenv from 'dotenv';
import type { AppConfig } from '../types/config.js';

dotenv.config();

/**
 * Reads a required environment variable, throwing if missing.
 * @param key - Environment variable name
 * @returns The environment variable value
 * @throws Error if the variable is not set
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Reads an optional environment variable with a default fallback.
 * @param key - Environment variable name
 * @param defaultValue - Default value if not set
 * @returns The environment variable value or the default
 */
function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

/**
 * Parses and validates all application configuration from environment variables.
 * Throws an error early if any required variable is missing.
 * @returns Validated application configuration object
 */
export function loadConfig(): AppConfig {
  return {
    nodeEnv: optionalEnv('NODE_ENV', 'development'),
    port: parseInt(optionalEnv('PORT', '3000'), 10),
    db: {
      host: optionalEnv('DB_HOST', 'localhost'),
      port: parseInt(optionalEnv('DB_PORT', '5432'), 10),
      name: optionalEnv('DB_NAME', 'authn_system'),
      user: optionalEnv('DB_USER', 'postgres'),
      password: optionalEnv('DB_PASSWORD', ''),
      poolMin: parseInt(optionalEnv('DB_POOL_MIN', '2'), 10),
      poolMax: parseInt(optionalEnv('DB_POOL_MAX', '10'), 10),
      ssl: optionalEnv('DB_SSL', 'false') === 'true',
    },
    jwt: {
      secret: requireEnv('JWT_SECRET'),
      expiry: optionalEnv('JWT_EXPIRY', '24h'),
    },
    smtp: {
      host: optionalEnv('SMTP_HOST', 'localhost'),
      port: parseInt(optionalEnv('SMTP_PORT', '587'), 10),
      user: optionalEnv('SMTP_USER', ''),
      pass: optionalEnv('SMTP_PASS', ''),
      from: optionalEnv('SMTP_FROM', 'noreply@example.com'),
    },
    appUrl: optionalEnv('APP_URL', 'http://localhost:3000'),
    passwordResetExpiryHours: parseInt(optionalEnv('PASSWORD_RESET_EXPIRY_HOURS', '1'), 10),
    rateLimit: {
      windowMs: parseInt(optionalEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10),
      maxRequests: parseInt(optionalEnv('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
      authMaxRequests: parseInt(optionalEnv('AUTH_RATE_LIMIT_MAX', '10'), 10),
    },
  };
}

/** Singleton application configuration instance. */
export const config = loadConfig();
