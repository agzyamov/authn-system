/**
 * AuthEventType enum.
 * All possible security events logged to the audit trail.
 */
export enum AuthEventType {
  REGISTRATION = 'registration',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_COMPLETE = 'password_reset_complete',
  PASSWORD_RESET_FAILURE = 'password_reset_failure',
  PASSWORD_CHANGE = 'password_change',
}

/**
 * AuthEvent entity interface.
 * Represents a security-relevant authentication event for the audit log.
 * Never stores plaintext passwords, tokens, or other sensitive data.
 */
export interface AuthEvent {
  /** Unique event identifier (UUID v4) */
  id: string;

  /** User ID associated with the event (null for failed login attempts on unknown emails) */
  user_id: string | null;

  /** Type of authentication event */
  event_type: AuthEventType;

  /** Client IP address (anonymized if needed for GDPR) */
  ip_address: string | null;

  /** Client user agent string */
  user_agent: string | null;

  /** Additional non-sensitive event metadata */
  metadata: Record<string, unknown> | null;

  /** Event timestamp */
  created_at: Date;
}
