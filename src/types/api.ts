/**
 * API response types for the authentication system.
 * These types define the shape of all HTTP responses.
 */

/**
 * User data transfer object.
 * Safe for API responses — excludes password_hash.
 */
export interface UserDTO {
  /** Unique user identifier */
  id: string;

  /** User's email address */
  email: string;

  /** Account creation timestamp */
  created_at: Date;
}

/**
 * Authentication response returned after successful login or registration.
 */
export interface AuthResponse {
  /** User information (without sensitive fields) */
  user: UserDTO;

  /** JWT token valid for 24 hours */
  token: string;
}

/**
 * Standard API error response.
 */
export interface ErrorResponse {
  /** Human-readable error message */
  error: string;

  /** Optional array of field-level validation errors */
  details?: ValidationError[];
}

/**
 * Individual field validation error.
 */
export interface ValidationError {
  /** The field that failed validation */
  field: string;

  /** Validation error message */
  message: string;
}

/**
 * Standard success message response.
 */
export interface MessageResponse {
  /** Success message */
  message: string;
}

/**
 * Health check response.
 */
export interface HealthResponse {
  /** Service status */
  status: 'ok' | 'degraded' | 'down';

  /** Current timestamp */
  timestamp: string;
}

/**
 * JWT payload structure (decoded token).
 */
export interface JwtPayload {
  /** User ID */
  sub: string;

  /** User email */
  email: string;

  /** Issued at timestamp */
  iat: number;

  /** Expiry timestamp */
  exp: number;
}
