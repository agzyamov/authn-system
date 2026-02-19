import { query } from '../config/database.js';
import type { AuthEvent, AuthEventType } from '../models/AuthEvent.js';

/**
 * Input for logging an authentication event.
 */
export interface LogEventInput {
  user_id: string | null;
  event_type: AuthEventType;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * AuthEventRepository interface for security audit logging.
 */
export interface AuthEventRepository {
  /**
   * Logs a security event to the audit trail.
   * Never logs plaintext passwords or tokens.
   * @param input - Event details
   */
  logEvent(input: LogEventInput): Promise<void>;

  /**
   * Retrieves recent events for a user (for security analysis).
   * @param userId - User UUID
   * @param limit - Max events to return
   */
  findByUserId(userId: string, limit?: number): Promise<AuthEvent[]>;
}

/**
 * PostgreSQL implementation of AuthEventRepository.
 */
export class PostgresAuthEventRepository implements AuthEventRepository {
  /**
   * Logs a security event to the auth_events table.
   * Fires and forgets — logging failure should not block auth operations.
   */
  async logEvent(input: LogEventInput): Promise<void> {
    await query(
      `INSERT INTO auth_events (user_id, event_type, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        input.user_id,
        input.event_type,
        input.ip_address ?? null,
        input.user_agent ?? null,
        input.metadata ? JSON.stringify(input.metadata) : null,
      ],
    );
  }

  /**
   * Retrieves the most recent auth events for a user.
   */
  async findByUserId(userId: string, limit = 50): Promise<AuthEvent[]> {
    const result = await query<AuthEvent>(
      `SELECT id, user_id, event_type, ip_address, user_agent, metadata, created_at
       FROM auth_events
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
  }
}
