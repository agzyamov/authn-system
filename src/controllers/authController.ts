import type { Request, Response, NextFunction } from 'express';
import type { AuthService } from '../services/AuthService.js';
import type { PasswordResetService } from '../services/PasswordResetService.js';
import type { UserRepository } from '../repositories/UserRepository.js';
import type { UserDTO } from '../types/api.js';

/**
 * Authentication controller.
 * Handles all HTTP request/response logic for auth endpoints.
 * Business logic is delegated to AuthService.
 */

/**
 * Creates auth controller functions with injected dependencies.
 */
export function createAuthController(
  authService: AuthService,
  passwordResetService: PasswordResetService,
  userRepository: UserRepository,
): {
  register(req: Request, res: Response, next: NextFunction): Promise<void>;
  login(req: Request, res: Response, next: NextFunction): Promise<void>;
  getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void>;
  logout(req: Request, res: Response, next: NextFunction): Promise<void>;
  requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void>;
  confirmPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void>;
  changePassword(req: Request, res: Response, next: NextFunction): Promise<void>;
} {
  return {
    /**
     * POST /api/auth/register
     * Registers a new user with email and password.
     */
    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { email, password } = req.body as { email: string; password: string };
        const result = await authService.registerUser({ email, password });
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },

    /**
     * POST /api/auth/login
     * Authenticates user and returns JWT token.
     */
    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { email, password } = req.body as { email: string; password: string };
        const result = await authService.loginUser({
          email,
          password,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },

    /**
     * GET /api/auth/me
     * Returns the current authenticated user's data.
     */
    async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        if (!req.user) {
          res.status(401).json({ user: undefined as unknown as UserDTO });
          return;
        }

        const user = await userRepository.findById(req.user.sub);
        if (!user) {
          res.status(404).json({ user: undefined as unknown as UserDTO });
          return;
        }

        const userDTO: UserDTO = {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        };

        res.status(200).json({ user: userDTO });
      } catch (err) {
        next(err);
      }
    },

    /**
     * POST /api/auth/logout
     * Invalidates the current JWT token.
     */
    async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        if (!req.user) {
          res.status(401).json({ message: 'Unauthorized' });
          return;
        }

        const token = req.headers.authorization?.split(' ')[1] ?? '';
        await authService.logoutUser(req.user.sub, token);
        res.status(200).json({ message: 'Logged out successfully' });
      } catch (err) {
        next(err);
      }
    },

    /**
     * POST /api/auth/password-reset/request
     * Initiates password reset flow by sending email.
     */
    async requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { email } = req.body as { email: string };
        await passwordResetService.requestPasswordReset(email);
        // Always return 200 to prevent email enumeration
        res
          .status(200)
          .json({ message: 'If your email is registered, you will receive a reset link.' });
      } catch (err) {
        next(err);
      }
    },

    /**
     * POST /api/auth/password-reset/confirm
     * Validates reset token and updates password.
     */
    async confirmPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { token, new_password } = req.body as { token: string; new_password: string };
        await passwordResetService.confirmPasswordReset(token, new_password);
        res.status(200).json({ message: 'Password reset successfully' });
      } catch (err) {
        next(err);
      }
    },

    /**
     * POST /api/auth/password-change
     * Changes password for authenticated user.
     */
    async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        if (!req.user) {
          res.status(401).json({ message: 'Unauthorized' });
          return;
        }

        const { current_password, new_password } = req.body as {
          current_password: string;
          new_password: string;
        };

        await authService.changePassword({
          userId: req.user.sub,
          currentPassword: current_password,
          newPassword: new_password,
        });

        res.status(200).json({ message: 'Password changed successfully' });
      } catch (err) {
        next(err);
      }
    },
  };
}
