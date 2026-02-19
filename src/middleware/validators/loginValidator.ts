import { body } from 'express-validator';

/**
 * Validation middleware chain for POST /api/auth/login.
 * Validates that email and password are provided.
 */
export const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail({ gmail_remove_dots: false }),

  body('password').notEmpty().withMessage('Password is required'),
];
