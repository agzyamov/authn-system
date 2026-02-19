/**
 * Password validation utility.
 * Validates raw password strength per NIST 800-63B guidelines.
 * Focus on length over complexity requirements.
 */

/** Minimum password length requirement. */
const MIN_PASSWORD_LENGTH = 8;

/** Maximum password length (bcrypt handles up to 72 bytes). */
const MAX_PASSWORD_LENGTH = 72;

/**
 * Result of password validation.
 */
export interface PasswordValidationResult {
  /** Whether the password is valid */
  isValid: boolean;

  /** Error message if invalid, undefined if valid */
  error?: string;
}

/**
 * Validates a raw (unhashed) password against security requirements.
 * Requirements:
 * - Minimum 8 characters (FR-003)
 * - Maximum 72 characters (bcrypt limitation)
 * - Must not be empty or whitespace-only
 *
 * @param password - Raw password to validate
 * @returns Validation result with isValid flag and optional error message
 */
export function validatePassword(password: string): PasswordValidationResult {
  if (!password || password.trim().length === 0) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      isValid: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    };
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return {
      isValid: false,
      error: `Password must not exceed ${MAX_PASSWORD_LENGTH} characters`,
    };
  }

  return { isValid: true };
}

/**
 * Checks if a password meets the minimum length requirement only.
 * Used in validators where express-validator handles other checks.
 * @param password - Raw password string
 * @returns True if password meets minimum length
 */
export function isPasswordLongEnough(password: string): boolean {
  return typeof password === 'string' && password.length >= MIN_PASSWORD_LENGTH;
}
