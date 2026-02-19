import type { AuthService } from '../../../src/services/AuthService';
import type { UserRepository } from '../../../src/repositories/UserRepository';
import type { TokenService } from '../../../src/services/TokenService';
import type { EmailService } from '../../../src/services/EmailService';
import type { AuthEventRepository } from '../../../src/repositories/AuthEventRepository';

// Mock bcrypt to avoid slow hashing in unit tests
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$mockedHash'),
  compare: jest.fn().mockResolvedValue(true),
}));

/**
 * Unit tests for AuthService.
 * Tests all authentication business logic with mocked dependencies.
 */
describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockTokenService: jest.Mocked<TokenService>;
  let mockEmailService: jest.Mocked<EmailService>;
  let mockAuthEventRepository: jest.Mocked<AuthEventRepository>;

  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxCUDpeVgtU9kDd2bJyXP',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    mockUserRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      updatePassword: jest.fn(),
    } as jest.Mocked<UserRepository>;

    mockTokenService = {
      generateJWT: jest.fn(),
      verifyJWT: jest.fn(),
      decodeJWT: jest.fn(),
    } as jest.Mocked<TokenService>;

    mockEmailService = {
      sendWelcome: jest.fn(),
      sendPasswordReset: jest.fn(),
    } as jest.Mocked<EmailService>;

    mockAuthEventRepository = {
      logEvent: jest.fn(),
      findByUserId: jest.fn(),
    } as jest.Mocked<AuthEventRepository>;

    // Will be replaced with actual import after implementation
    const { createAuthService } = jest.requireActual('../../../src/services/AuthService') as {
      createAuthService: (
        userRepo: UserRepository,
        tokenService: TokenService,
        emailService: EmailService,
        authEventRepo: AuthEventRepository,
      ) => AuthService;
    };
    authService = createAuthService(
      mockUserRepository,
      mockTokenService,
      mockEmailService,
      mockAuthEventRepository,
    );
  });

  describe('registerUser', () => {
    const registerInput = {
      email: 'newuser@example.com',
      password: 'SecurePassword123',
    };

    it('should register a new user and return token', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockTokenService.generateJWT.mockReturnValue('jwt.token.here');
      mockEmailService.sendWelcome.mockResolvedValue(undefined);
      mockAuthEventRepository.logEvent.mockResolvedValue(undefined);

      const result = await authService.registerUser(registerInput);

      expect(result.user.email).toBe(mockUser.email);
      expect(result.token).toBe('jwt.token.here');
      expect(mockUserRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should throw conflict error when email already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.registerUser(registerInput)).rejects.toThrow();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should normalize email to lowercase', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockTokenService.generateJWT.mockReturnValue('jwt.token.here');
      mockEmailService.sendWelcome.mockResolvedValue(undefined);
      mockAuthEventRepository.logEvent.mockResolvedValue(undefined);

      await authService.registerUser({
        email: 'NewUser@Example.COM',
        password: 'SecurePassword123',
      });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('newuser@example.com');
    });

    it('should log registration event on success', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockTokenService.generateJWT.mockReturnValue('jwt.token.here');
      mockEmailService.sendWelcome.mockResolvedValue(undefined);
      mockAuthEventRepository.logEvent.mockResolvedValue(undefined);

      await authService.registerUser(registerInput);

      expect(mockAuthEventRepository.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event_type: 'registration' }),
      );
    });

    it('should send welcome email on successful registration', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockTokenService.generateJWT.mockReturnValue('jwt.token.here');
      mockEmailService.sendWelcome.mockResolvedValue(undefined);
      mockAuthEventRepository.logEvent.mockResolvedValue(undefined);

      await authService.registerUser(registerInput);

      expect(mockEmailService.sendWelcome).toHaveBeenCalledWith(
        expect.objectContaining({ email: mockUser.email }),
      );
    });

    it('should never store plaintext password', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockTokenService.generateJWT.mockReturnValue('jwt.token.here');
      mockEmailService.sendWelcome.mockResolvedValue(undefined);
      mockAuthEventRepository.logEvent.mockResolvedValue(undefined);

      await authService.registerUser(registerInput);

      const createCall = mockUserRepository.create.mock.calls[0];
      expect(createCall).toBeDefined();
      // The create call should pass a hashed password, not plaintext
      const createArg = createCall?.[0] as { password_hash?: string };
      expect(createArg?.password_hash).not.toBe(registerInput.password);
      expect(createArg?.password_hash).toMatch(/^\$2b\$12\$/);
    });
  });

  describe('loginUser', () => {
    const loginInput = {
      email: 'test@example.com',
      password: 'SecurePassword123',
    };

    it('should return auth response on valid credentials', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockTokenService.generateJWT.mockReturnValue('jwt.token.here');
      mockAuthEventRepository.logEvent.mockResolvedValue(undefined);

      // bcrypt.compare will need to be mocked; implemented in auth service
      const result = await authService.loginUser(loginInput);

      expect(result.token).toBeDefined();
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw unauthorized error for non-existent email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockAuthEventRepository.logEvent.mockResolvedValue(undefined);

      await expect(authService.loginUser(loginInput)).rejects.toThrow();
    });

    it('should log login_failure event on bad credentials', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockAuthEventRepository.logEvent.mockResolvedValue(undefined);

      await expect(authService.loginUser(loginInput)).rejects.toThrow();

      expect(mockAuthEventRepository.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event_type: 'login_failure' }),
      );
    });
  });
});
