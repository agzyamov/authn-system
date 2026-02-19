import { Router, type Request, type Response, type NextFunction } from 'express';
import { createAuthController } from '../controllers/authController.js';
import { createAuthService } from '../services/AuthService.js';
import { createPasswordResetService } from '../services/PasswordResetService.js';
import { JwtTokenService } from '../services/TokenService.js';
import { NodemailerEmailService } from '../services/NodemailerEmailService.js';
import { PostgresUserRepository } from '../repositories/UserRepository.js';
import { PostgresAuthEventRepository } from '../repositories/AuthEventRepository.js';
import { PostgresPasswordResetRepository } from '../repositories/PasswordResetRepository.js';
import { authenticate } from '../middleware/authenticate.js';
import { validationErrorHandler } from '../middleware/validationErrorHandler.js';
import { registerValidator } from '../middleware/validators/registerValidator.js';
import { loginValidator } from '../middleware/validators/loginValidator.js';
import { passwordResetRequestValidator } from '../middleware/validators/passwordResetRequestValidator.js';
import { passwordResetConfirmValidator } from '../middleware/validators/passwordResetConfirmValidator.js';
import { passwordChangeValidator } from '../middleware/validators/passwordChangeValidator.js';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

/**
 * Auth router with all authentication endpoints.
 * Sets up dependency injection for services and repositories.
 */
const router = Router();

// Initialize repositories
const userRepository = new PostgresUserRepository();
const authEventRepository = new PostgresAuthEventRepository();
const passwordResetRepository = new PostgresPasswordResetRepository();

// Initialize services
const tokenService = new JwtTokenService();
const emailService = new NodemailerEmailService();

const authService = createAuthService(
  userRepository,
  tokenService,
  emailService,
  authEventRepository,
);

const passwordResetService = createPasswordResetService(
  userRepository,
  passwordResetRepository,
  emailService,
  authEventRepository,
);

// Create controller
const controller = createAuthController(authService, passwordResetService, userRepository);

// Auth-specific rate limiter (stricter than global)
const authRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
});

// POST /api/auth/register
router.post(
  '/register',
  authRateLimiter,
  registerValidator,
  validationErrorHandler,
  (req: Request, res: Response, next: NextFunction) => void controller.register(req, res, next),
);

// POST /api/auth/login
router.post(
  '/login',
  authRateLimiter,
  loginValidator,
  validationErrorHandler,
  (req: Request, res: Response, next: NextFunction) => void controller.login(req, res, next),
);

// GET /api/auth/me (protected)
router.get(
  '/me',
  authenticate,
  (req: Request, res: Response, next: NextFunction) =>
    void controller.getCurrentUser(req, res, next),
);

// POST /api/auth/logout (protected)
router.post(
  '/logout',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => void controller.logout(req, res, next),
);

// POST /api/auth/password-reset/request
router.post(
  '/password-reset/request',
  authRateLimiter,
  passwordResetRequestValidator,
  validationErrorHandler,
  (req: Request, res: Response, next: NextFunction) =>
    void controller.requestPasswordReset(req, res, next),
);

// POST /api/auth/password-reset/confirm
router.post(
  '/password-reset/confirm',
  authRateLimiter,
  passwordResetConfirmValidator,
  validationErrorHandler,
  (req: Request, res: Response, next: NextFunction) =>
    void controller.confirmPasswordReset(req, res, next),
);

// POST /api/auth/password-change (protected)
router.post(
  '/password-change',
  authenticate,
  passwordChangeValidator,
  validationErrorHandler,
  (req: Request, res: Response, next: NextFunction) =>
    void controller.changePassword(req, res, next),
);

export default router;
