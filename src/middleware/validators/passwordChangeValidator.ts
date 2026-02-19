import { body } from 'express-validator';

/**
 * Validation for POST /api/auth/password-change.
 * Validates both current and new passwords.
 */
export const passwordChangeValidator = [
  body('current_password').notEmpty().withMessage('Current password is required'),

  body('new_password')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .isLength({ max: 72 })
    .withMessage('Password must not exceed 72 characters'),
];
