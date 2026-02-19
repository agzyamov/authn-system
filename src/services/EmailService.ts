import type { User } from '../models/User.js';

/**
 * EmailService interface for sending transactional emails.
 * Decouples email sending logic from business logic for testability.
 */
export interface EmailService {
  /**
   * Sends a welcome email to a newly registered user.
   * @param user - The newly registered user
   */
  sendWelcome(user: User): Promise<void>;

  /**
   * Sends a password reset email with a time-limited link.
   * @param user - The user requesting the reset
   * @param resetToken - Unique reset token (UUID v4)
   * @param expiryHours - Hours until the reset link expires
   */
  sendPasswordReset(user: User, resetToken: string, expiryHours: number): Promise<void>;
}
