import bcrypt from 'bcrypt';
import type { UserRepository } from '../repositories/UserRepository.js';
import type { TokenService } from './TokenService.js';
import type { EmailService } from './EmailService.js';
import type { AuthEventRepository } from '../repositories/AuthEventRepository.js';
import { AuthEventType } from '../models/AuthEvent.js';
import { AppError } from '../middleware/errorHandler.js';
import { normalizeEmail } from '../utils/emailValidator.js';
import type { AuthResponse, UserDTO } from '../types/api.js';
import type { User } from '../models/User.js';

/** bcrypt cost factor — NIST recommended minimum. */
const BCRYPT_ROUNDS = 12;

/**
 * Input for user registration.
 */
export interface RegisterInput {
  email: string;
  password: string;
}

/**
 * Input for user login.
 */
export interface LoginInput {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Input for password change.
 */
export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

/**
 * AuthService interface — core authentication business logic.
 */
export interface AuthService {
  registerUser(input: RegisterInput): Promise<AuthResponse>;
  loginUser(input: LoginInput): Promise<AuthResponse>;
  logoutUser(userId: string, token: string): Promise<void>;
  changePassword(input: ChangePasswordInput): Promise<void>;
}

/**
 * Converts a User entity to a safe DTO (without password_hash).
 */
function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
  };
}

/**
 * Factory function for creating AuthService instances.
 * Enables dependency injection for testing.
 */
export function createAuthService(
  userRepository: UserRepository,
  tokenService: TokenService,
  emailService: EmailService,
  authEventRepository: AuthEventRepository,
): AuthService {
  return {
    /**
     * Registers a new user with email and password.
     * - Validates email uniqueness
     * - Hashes password with bcrypt (cost 12)
     * - Creates user record
     * - Sends welcome email
     * - Logs registration event
     * - Returns user data and JWT token
     */
    async registerUser(input: RegisterInput): Promise<AuthResponse> {
      const normalizedEmail = normalizeEmail(input.email);

      // Check for existing email
      const existing = await userRepository.findByEmail(normalizedEmail);
      if (existing) {
        throw new AppError('Email already registered', 409);
      }

      // Hash password with bcrypt (never store plaintext)
      const password_hash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

      // Create user record
      const user = await userRepository.create({
        email: normalizedEmail,
        password_hash,
      });

      // Generate JWT token
      const token = tokenService.generateJWT(user);

      // Send welcome email (non-blocking, failure logged but not thrown)
      void emailService.sendWelcome(user);

      // Log registration event
      void authEventRepository
        .logEvent({
          user_id: user.id,
          event_type: AuthEventType.REGISTRATION,
        })
        .catch(() => {
          // Event logging failure should not affect registration
        });

      return {
        user: toUserDTO(user),
        token,
      };
    },

    /**
     * Authenticates a user with email and password.
     * - Uses generic error message (no email enumeration)
     * - Logs success/failure events
     */
    async loginUser(input: LoginInput): Promise<AuthResponse> {
      const normalizedEmail = normalizeEmail(input.email);
      const logContext = { ip_address: input.ipAddress, user_agent: input.userAgent };

      // Find user — use generic error to prevent email enumeration
      const user = await userRepository.findByEmail(normalizedEmail);
      if (!user) {
        void authEventRepository
          .logEvent({
            user_id: null,
            event_type: AuthEventType.LOGIN_FAILURE,
            ...logContext,
          })
          .catch(() => undefined);
        throw new AppError('Invalid credentials', 401);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(input.password, user.password_hash);
      if (!isValidPassword) {
        void authEventRepository
          .logEvent({
            user_id: user.id,
            event_type: AuthEventType.LOGIN_FAILURE,
            ...logContext,
          })
          .catch(() => undefined);
        throw new AppError('Invalid credentials', 401);
      }

      // Generate token
      const token = tokenService.generateJWT(user);

      // Log success
      void authEventRepository
        .logEvent({
          user_id: user.id,
          event_type: AuthEventType.LOGIN_SUCCESS,
          ...logContext,
        })
        .catch(() => undefined);

      return {
        user: toUserDTO(user),
        token,
      };
    },

    /**
     * Logs out a user. Logs the logout event.
     * Token invalidation via Redis blacklist is handled in authenticate middleware.
     */
    logoutUser(userId: string, _token: string): Promise<void> {
      void authEventRepository
        .logEvent({
          user_id: userId,
          event_type: AuthEventType.LOGOUT,
        })
        .catch(() => undefined);
      return Promise.resolve();
    },

    /**
     * Changes a user's password after verifying the current password.
     * Logs the password change event.
     */
    async changePassword(input: ChangePasswordInput): Promise<void> {
      const user = await userRepository.findById(input.userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const isValidPassword = await bcrypt.compare(input.currentPassword, user.password_hash);
      if (!isValidPassword) {
        throw new AppError('Current password is incorrect', 401);
      }

      const newPasswordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
      await userRepository.updatePassword(input.userId, newPasswordHash);

      void authEventRepository
        .logEvent({
          user_id: input.userId,
          event_type: AuthEventType.PASSWORD_CHANGE,
        })
        .catch(() => undefined);
    },
  };
}

export type { AuthResponse };
