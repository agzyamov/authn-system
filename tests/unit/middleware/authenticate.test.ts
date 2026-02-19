import type { Request, Response, NextFunction } from 'express';

// Mock the config before imports
jest.mock('../../../src/config/env', () => ({
  config: {
    jwt: { secret: 'test-secret-key-at-least-32-characters-long!!', expiry: '24h' },
    nodeEnv: 'test',
  },
}));

/**
 * Unit tests for JWT authentication middleware.
 */
describe('authenticate middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('should call next() with valid Bearer token', () => {
    const { JwtTokenService } = jest.requireActual(
      '../../../src/services/TokenService',
    ) as typeof import('../../../src/services/TokenService');
    const ts = new JwtTokenService();
    const mockUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com',
      password_hash: '$2b$12$hash',
      created_at: new Date(),
      updated_at: new Date(),
    };
    const token = ts.generateJWT(mockUser);

    mockReq.headers = { authorization: `Bearer ${token}` };

    const { authenticate } = jest.requireActual(
      '../../../src/middleware/authenticate',
    ) as typeof import('../../../src/middleware/authenticate');

    authenticate(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    const reqWithUser = mockReq as Request;
    expect(reqWithUser.user).toBeDefined();
    expect(reqWithUser.user?.sub).toBe(mockUser.id);
  });

  it('should return 401 when no Authorization header', () => {
    const { authenticate } = jest.requireActual(
      '../../../src/middleware/authenticate',
    ) as typeof import('../../../src/middleware/authenticate');

    authenticate(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when Authorization is not Bearer', () => {
    mockReq.headers = { authorization: 'Basic dXNlcjpwYXNz' };

    const { authenticate } = jest.requireActual(
      '../../../src/middleware/authenticate',
    ) as typeof import('../../../src/middleware/authenticate');

    authenticate(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next(err) with invalid token', () => {
    mockReq.headers = { authorization: 'Bearer invalid.token.here' };

    const { authenticate } = jest.requireActual(
      '../../../src/middleware/authenticate',
    ) as typeof import('../../../src/middleware/authenticate');

    authenticate(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});
