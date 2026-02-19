import type { PasswordReset } from '../../../src/models/PasswordReset';

/**
 * Unit tests for PasswordReset model interface.
 */
describe('PasswordReset Model', () => {
  it('should have all required fields', () => {
    const now = new Date();
    const reset: PasswordReset = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      reset_token: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      created_at: now,
      expires_at: new Date(now.getTime() + 3600000),
      used_at: null,
    };

    expect(reset.id).toBeDefined();
    expect(reset.user_id).toBeDefined();
    expect(reset.reset_token).toBeDefined();
    expect(reset.created_at).toBeInstanceOf(Date);
    expect(reset.expires_at).toBeInstanceOf(Date);
    expect(reset.used_at).toBeNull();
  });

  it('should allow used_at to be a Date when token is used', () => {
    const now = new Date();
    const reset: PasswordReset = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      reset_token: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      created_at: now,
      expires_at: new Date(now.getTime() + 3600000),
      used_at: new Date(),
    };

    expect(reset.used_at).toBeInstanceOf(Date);
  });

  it('should have expires_at after created_at (1 hour)', () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 3600000);

    const reset: PasswordReset = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      reset_token: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      created_at: now,
      expires_at: oneHourLater,
      used_at: null,
    };

    expect(reset.expires_at.getTime()).toBeGreaterThan(reset.created_at.getTime());
    expect(reset.expires_at.getTime() - reset.created_at.getTime()).toBe(3600000);
  });
});
