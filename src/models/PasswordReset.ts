/**
 * PasswordReset entity interface.
 * Represents a time-limited, single-use password reset request.
 */
export interface PasswordReset {
  /** Unique reset request identifier (UUID v4) */
  id: string;

  /** User ID who requested the reset */
  user_id: string;

  /** Unique reset token sent via email (UUID v4) */
  reset_token: string;

  /** Timestamp when reset was requested */
  created_at: Date;

  /** Token expiration time (created_at + 1 hour) */
  expires_at: Date;

  /** Timestamp when token was used (null means unused) */
  used_at: Date | null;
}
