/**
 * User entity interface.
 * Represents a registered user account in the system.
 */
export interface User {
  /** Unique user identifier (UUID v4) */
  id: string;

  /** User's email address (unique, stored lowercase) */
  email: string;

  /** bcrypt password hash (cost factor 12, never exposed in API responses) */
  password_hash: string;

  /** Account creation timestamp */
  created_at: Date;

  /** Last modification timestamp */
  updated_at: Date;
}
