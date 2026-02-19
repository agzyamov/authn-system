import type { TokenService } from '../../../src/services/TokenService';

/**
 * Unit tests for TokenService JWT operations.
 */
describe('TokenService', () => {
  let tokenService: TokenService;

  beforeAll(() => {
    process.env['JWT_SECRET'] = 'test-secret-key-at-least-32-characters-long!!';
    process.env['JWT_EXPIRY'] = '24h';
    process.env['NODE_ENV'] = 'test';
    // Reload module after setting env vars
    const { JwtTokenService } = jest.requireActual(
      '../../../src/services/TokenService',
    ) as typeof import('../../../src/services/TokenService');
    tokenService = new JwtTokenService();
  });

  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    password_hash: '$2b$12$hash',
    created_at: new Date(),
    updated_at: new Date(),
  };

  describe('generateJWT', () => {
    it('should generate a JWT token', () => {
      const token = tokenService.generateJWT(mockUser);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include user id and email in payload', () => {
      const token = tokenService.generateJWT(mockUser);
      const decoded = tokenService.decodeJWT(token);

      expect(decoded?.sub).toBe(mockUser.id);
      expect(decoded?.email).toBe(mockUser.email);
    });

    it('should set token expiry', () => {
      const token = tokenService.generateJWT(mockUser);
      const decoded = tokenService.decodeJWT(token);

      expect(decoded?.exp).toBeDefined();
      // Should expire in the future
      const now = Math.floor(Date.now() / 1000);
      expect(decoded?.exp).toBeGreaterThan(now);
    });
  });

  describe('verifyJWT', () => {
    it('should verify a valid token', () => {
      const token = tokenService.generateJWT(mockUser);
      const payload = tokenService.verifyJWT(token);

      expect(payload.sub).toBe(mockUser.id);
      expect(payload.email).toBe(mockUser.email);
    });

    it('should throw for an invalid token', () => {
      expect(() => tokenService.verifyJWT('invalid.token.here')).toThrow();
    });

    it('should throw for a tampered token', () => {
      const token = tokenService.generateJWT(mockUser);
      const tampered = token.slice(0, -5) + 'xxxxx';
      expect(() => tokenService.verifyJWT(tampered)).toThrow();
    });
  });

  describe('decodeJWT', () => {
    it('should decode a valid token without verifying', () => {
      const token = tokenService.generateJWT(mockUser);
      const decoded = tokenService.decodeJWT(token);

      expect(decoded?.sub).toBe(mockUser.id);
    });

    it('should return null for an invalid token', () => {
      const decoded = tokenService.decodeJWT('not-a-jwt');
      expect(decoded).toBeNull();
    });
  });
});
