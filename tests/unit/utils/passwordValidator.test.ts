import { validatePassword, isPasswordLongEnough } from '../../../src/utils/passwordValidator';

/**
 * Unit tests for password validation utility.
 * These tests define the expected behavior for password strength checks.
 */
describe('passwordValidator', () => {
  describe('validatePassword', () => {
    describe('valid passwords', () => {
      it('should accept a password with exactly 8 characters', () => {
        const result = validatePassword('Password');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept a longer password', () => {
        const result = validatePassword('SecurePassword123!');
        expect(result.isValid).toBe(true);
      });

      it('should accept a password with 72 characters (bcrypt max)', () => {
        const password = 'a'.repeat(72);
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
      });

      it('should accept passwords with special characters', () => {
        const result = validatePassword('P@ssw0rd!#$%');
        expect(result.isValid).toBe(true);
      });
    });

    describe('invalid passwords', () => {
      it('should reject an empty string', () => {
        const result = validatePassword('');
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should reject a whitespace-only string', () => {
        const result = validatePassword('        ');
        expect(result.isValid).toBe(false);
      });

      it('should reject a password shorter than 8 characters', () => {
        const result = validatePassword('short');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('8');
      });

      it('should reject a 7-character password', () => {
        const result = validatePassword('1234567');
        expect(result.isValid).toBe(false);
      });

      it('should reject a password longer than 72 characters', () => {
        const password = 'a'.repeat(73);
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('72');
      });
    });
  });

  describe('isPasswordLongEnough', () => {
    it('should return true for an 8-character password', () => {
      expect(isPasswordLongEnough('Password')).toBe(true);
    });

    it('should return false for a short password', () => {
      expect(isPasswordLongEnough('short')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isPasswordLongEnough('')).toBe(false);
    });
  });
});
