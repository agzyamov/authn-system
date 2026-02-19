import { validateEmail, normalizeEmail } from '../../../src/utils/emailValidator';

/**
 * Unit tests for email validation utility.
 * Tests format validation and normalization.
 */
describe('emailValidator', () => {
  describe('validateEmail', () => {
    describe('valid emails', () => {
      it('should accept a standard email address', () => {
        const result = validateEmail('user@example.com');
        expect(result.isValid).toBe(true);
        expect(result.normalizedEmail).toBe('user@example.com');
      });

      it('should normalize email to lowercase', () => {
        const result = validateEmail('User@Example.COM');
        expect(result.isValid).toBe(true);
        expect(result.normalizedEmail).toBe('user@example.com');
      });

      it('should accept email with subdomains', () => {
        const result = validateEmail('user@mail.example.com');
        expect(result.isValid).toBe(true);
      });

      it('should accept email with dots in local part', () => {
        const result = validateEmail('first.last@example.com');
        expect(result.isValid).toBe(true);
      });

      it('should accept email with plus signs', () => {
        const result = validateEmail('user+tag@example.com');
        expect(result.isValid).toBe(true);
      });

      it('should trim surrounding whitespace', () => {
        const result = validateEmail('  user@example.com  ');
        expect(result.isValid).toBe(true);
        expect(result.normalizedEmail).toBe('user@example.com');
      });
    });

    describe('invalid emails', () => {
      it('should reject an empty string', () => {
        const result = validateEmail('');
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should reject email without @', () => {
        const result = validateEmail('notanemail');
        expect(result.isValid).toBe(false);
      });

      it('should reject email without domain', () => {
        const result = validateEmail('user@');
        expect(result.isValid).toBe(false);
      });

      it('should reject email without local part', () => {
        const result = validateEmail('@example.com');
        expect(result.isValid).toBe(false);
      });

      it('should reject email with spaces', () => {
        const result = validateEmail('user @example.com');
        expect(result.isValid).toBe(false);
      });

      it('should reject email exceeding 255 characters', () => {
        const longEmail = 'a'.repeat(250) + '@b.com';
        const result = validateEmail(longEmail);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('normalizeEmail', () => {
    it('should convert to lowercase', () => {
      expect(normalizeEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
    });

    it('should trim whitespace', () => {
      expect(normalizeEmail('  user@example.com  ')).toBe('user@example.com');
    });
  });
});
