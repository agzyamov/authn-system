/**
 * Email format validation utility.
 * Validates email addresses against RFC 5322 guidelines.
 */

/**
 * Rough RFC 5322 compliant email regex.
 * Validates common email formats without being overly restrictive.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Maximum email length per database constraint. */
const MAX_EMAIL_LENGTH = 255;

/**
 * Result of email validation.
 */
export interface EmailValidationResult {
  /** Whether the email is valid */
  isValid: boolean;

  /** Error message if invalid */
  error?: string;

  /** Normalized email (lowercase) if valid */
  normalizedEmail?: string;
}

/**
 * Validates and normalizes an email address.
 * Normalizes to lowercase to prevent duplicate registrations
 * (e.g., User@Example.com and user@example.com are the same).
 *
 * @param email - Email address to validate
 * @returns Validation result with normalized email if valid
 */
export function validateEmail(email: string): EmailValidationResult {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is required' };
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    return {
      isValid: false,
      error: `Email must not exceed ${MAX_EMAIL_LENGTH} characters`,
    };
  }

  const trimmed = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true, normalizedEmail: trimmed };
}

/**
 * Normalizes an email address to lowercase.
 * @param email - Email address to normalize
 * @returns Lowercase email address
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
