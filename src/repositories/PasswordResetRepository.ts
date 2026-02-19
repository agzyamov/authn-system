import { query } from '../config/database.js';
import type { PasswordReset } from '../models/PasswordReset.js';

/**
 * PasswordResetRepository interface.
 */
export interface PasswordResetRepository {
  /**
   * Creates a new password reset record.
   * @param userId - User requesting reset
   * @param token - Unique UUID token
   * @param expiresAt - Expiration timestamp
   */
  create(userId: string, token: string, expiresAt: Date): Promise<PasswordReset>;

  /**
   * Finds an active (unused, non-expired) reset by token.
   * @param token - Reset token UUID
   * @returns Reset record or null if not found/expired/used
   */
  findActiveByToken(token: string): Promise<PasswordReset | null>;

  /**
   * Marks a reset token as used.
   * @param id - Reset record UUID
   */
  markUsed(id: string): Promise<void>;

  /**
   * Deletes expired and old used reset records (cleanup job).
   * @param olderThanDays - Delete records older than this many days
   */
  deleteExpiredAndUsed(olderThanDays?: number): Promise<number>;
}

/**
 * PostgreSQL implementation of PasswordResetRepository.
 */
export class PostgresPasswordResetRepository implements PasswordResetRepository {
  /**
   * Creates a new password reset record in the database.
   */
  async create(userId: string, token: string, expiresAt: Date): Promise<PasswordReset> {
    const result = await query<PasswordReset>(
      `INSERT INTO password_resets (user_id, reset_token, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, reset_token, created_at, expires_at, used_at`,
      [userId, token, expiresAt],
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create password reset record');
    }
    return row;
  }

  /**
   * Finds a valid (unused and non-expired) reset record by token.
   */
  async findActiveByToken(token: string): Promise<PasswordReset | null> {
    const result = await query<PasswordReset>(
      `SELECT id, user_id, reset_token, created_at, expires_at, used_at
       FROM password_resets
       WHERE reset_token = $1
         AND used_at IS NULL
         AND expires_at > NOW()`,
      [token],
    );

    return result.rows[0] ?? null;
  }

  /**
   * Marks a reset token as used to prevent reuse.
   */
  async markUsed(id: string): Promise<void> {
    await query(`UPDATE password_resets SET used_at = NOW() WHERE id = $1`, [id]);
  }

  /**
   * Deletes expired and old used reset records for cleanup.
   * @returns Number of deleted records
   */
  async deleteExpiredAndUsed(olderThanDays = 7): Promise<number> {
    const result = await query(
      `DELETE FROM password_resets
       WHERE (expires_at < NOW() OR used_at IS NOT NULL)
         AND created_at < NOW() - INTERVAL '${olderThanDays} days'`,
    );

    return result.rowCount ?? 0;
  }
}
