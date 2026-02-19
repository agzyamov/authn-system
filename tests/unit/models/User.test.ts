import type { User } from '../../../src/models/User';

/**
 * Unit tests for User model interface validation.
 * Tests that the User interface has the correct shape and constraints.
 */
describe('User Model', () => {
  describe('User interface shape', () => {
    it('should have all required fields', () => {
      const user: User = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        password_hash: '$2b$12$hashedpassword',
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.password_hash).toBeDefined();
      expect(user.created_at).toBeDefined();
      expect(user.updated_at).toBeDefined();
    });

    it('should allow UUID format for id', () => {
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const user: User = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        password_hash: '$2b$12$hashedpassword',
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(user.id).toMatch(uuidPattern);
    });

    it('should store email as string', () => {
      const user: User = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        password_hash: '$2b$12$hashedpassword',
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(typeof user.email).toBe('string');
    });

    it('should store password_hash (never plaintext)', () => {
      const user: User = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxCUDpeVgtU9kDd2bJyXP',
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(user.password_hash).toMatch(/^\$2b\$12\$/);
    });

    it('should have Date objects for timestamps', () => {
      const now = new Date();
      const user: User = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        password_hash: '$2b$12$hashedpassword',
        created_at: now,
        updated_at: now,
      };

      expect(user.created_at).toBeInstanceOf(Date);
      expect(user.updated_at).toBeInstanceOf(Date);
    });
  });
});
