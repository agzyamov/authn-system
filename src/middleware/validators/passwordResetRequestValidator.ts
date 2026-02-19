import { body } from 'express-validator';

/**
 * Validation for POST /api/auth/password-reset/request.
 * Only validates email format.
 */
export const passwordResetRequestValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail({ gmail_remove_dots: false }),
];
