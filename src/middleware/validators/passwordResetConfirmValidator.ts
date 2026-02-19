import { body } from 'express-validator';

/**
 * Validation for POST /api/auth/password-reset/confirm.
 * Validates token (UUID format) and new password strength.
 */
export const passwordResetConfirmValidator = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Reset token is required')
    .isUUID()
    .withMessage('Invalid reset token format'),

  body('new_password')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .isLength({ max: 72 })
    .withMessage('Password must not exceed 72 characters'),
];
