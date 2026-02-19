/**
 * Application environment configuration type.
 * All configuration values are loaded from environment variables.
 */
export interface AppConfig {
  /** Node environment (development, production, test) */
  nodeEnv: string;

  /** HTTP port to listen on */
  port: number;

  /** Database configuration */
  db: DbConfig;

  /** JWT configuration */
  jwt: JwtConfig;

  /** Email (SMTP) configuration */
  smtp: SmtpConfig;

  /** Application URL (used in email links) */
  appUrl: string;

  /** Password reset link expiry in hours */
  passwordResetExpiryHours: number;

  /** Rate limiting configuration */
  rateLimit: RateLimitConfig;
}

/**
 * PostgreSQL database connection configuration.
 */
export interface DbConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  poolMin: number;
  poolMax: number;
  ssl: boolean;
}

/**
 * JWT signing and verification configuration.
 */
export interface JwtConfig {
  /** Secret key for signing JWT tokens (min 32 characters) */
  secret: string;

  /** Token expiry duration (e.g., "24h", "7d") */
  expiry: string;
}

/**
 * SMTP email configuration.
 */
export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

/**
 * Rate limiting configuration.
 */
export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;

  /** Max requests per window (global) */
  maxRequests: number;

  /** Max requests per window (auth endpoints) */
  authMaxRequests: number;
}
