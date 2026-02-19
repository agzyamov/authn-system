import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import type { PasswordResetRepository } from '../repositories/PasswordResetRepository.js';
import type { UserRepository } from '../repositories/UserRepository.js';
import type { EmailService } from './EmailService.js';
import type { AuthEventRepository } from '../repositories/AuthEventRepository.js';
import { AuthEventType } from '../models/AuthEvent.js';
import { AppError } from '../middleware/errorHandler.js';
import { config } from '../config/env.js';
import { normalizeEmail } from '../utils/emailValidator.js';

/** bcrypt cost factor for new passwords. */
const BCRYPT_ROUNDS = 12;

/**
 * PasswordResetService interface.
 */
export interface PasswordResetService {
  /**
   * Initiates a password reset request.
   * Sends reset email if user exists (silent if not, prevents enumeration).
   */
  requestPasswordReset(email: string): Promise<void>;

  /**
   * Validates the reset token and updates the user's password.
   * @throws AppError if token is invalid, expired, or already used
   */
  confirmPasswordReset(token: string, newPassword: string): Promise<void>;
}

/**
 * Factory function for PasswordResetService with dependency injection.
 */
export function createPasswordResetService(
  userRepository: UserRepository,
  passwordResetRepository: PasswordResetRepository,
  emailService: EmailService,
  authEventRepository: AuthEventRepository,
): PasswordResetService {
  return {
    /**
     * Requests a password reset.
     * Always returns successfully to prevent email enumeration.
     * If user exists, creates a reset record and sends email.
     */
    async requestPasswordReset(email: string): Promise<void> {
      const normalizedEmail = normalizeEmail(email);
      const user = await userRepository.findByEmail(normalizedEmail);

      if (!user) {
        // Silent return — don't reveal whether email exists
        return;
      }

      const token = uuidv4();
      const expiresAt = new Date(Date.now() + config.passwordResetExpiryHours * 60 * 60 * 1000);

      await passwordResetRepository.create(user.id, token, expiresAt);
      await emailService.sendPasswordReset(user, token, config.passwordResetExpiryHours);

      void authEventRepository
        .logEvent({
          user_id: user.id,
          event_type: AuthEventType.PASSWORD_RESET_REQUEST,
        })
        .catch(() => undefined);
    },

    /**
     * Confirms a password reset by validating token and updating password.
     * Marks the token as used after successful reset.
     */
    async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
      const resetRecord = await passwordResetRepository.findActiveByToken(token);

      if (!resetRecord) {
        void authEventRepository
          .logEvent({
            user_id: null,
            event_type: AuthEventType.PASSWORD_RESET_FAILURE,
          })
          .catch(() => undefined);
        throw new AppError('Invalid or expired reset token', 400);
      }

      const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      await userRepository.updatePassword(resetRecord.user_id, newPasswordHash);
      await passwordResetRepository.markUsed(resetRecord.id);

      void authEventRepository
        .logEvent({
          user_id: resetRecord.user_id,
          event_type: AuthEventType.PASSWORD_RESET_COMPLETE,
        })
        .catch(() => undefined);
    },
  };
}
