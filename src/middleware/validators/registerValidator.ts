import { body } from 'express-validator';

/**
 * Validation middleware chain for POST /api/auth/register.
 * Validates email format and password strength.
 * Use together with validationErrorHandler middleware.
 */
export const registerValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters')
    .normalizeEmail({ gmail_remove_dots: false }),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .isLength({ max: 72 })
    .withMessage('Password must not exceed 72 characters'),
];
