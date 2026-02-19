import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import type { JwtPayload } from '../types/api.js';
import type { User } from '../models/User.js';

/**
 * TokenService interface for JWT operations.
 */
export interface TokenService {
  /**
   * Generates a signed JWT token for an authenticated user.
   * @param user - The authenticated user
   * @returns Signed JWT string
   */
  generateJWT(user: User): string;

  /**
   * Verifies and decodes a JWT token.
   * @param token - JWT string to verify
   * @returns Decoded payload if valid
   * @throws JsonWebTokenError if invalid, TokenExpiredError if expired
   */
  verifyJWT(token: string): JwtPayload;

  /**
   * Decodes a JWT token without verifying signature (for reading headers).
   * @param token - JWT string
   * @returns Decoded payload or null
   */
  decodeJWT(token: string): JwtPayload | null;
}

/**
 * JWT-based TokenService implementation.
 * Signs tokens with HS256 algorithm using the configured secret.
 */
export class JwtTokenService implements TokenService {
  /**
   * Generates a JWT token with user identity and 24-hour expiry.
   */
  generateJWT(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiry as `${number}${'s' | 'm' | 'h' | 'd'}`,
      algorithm: 'HS256',
    });
  }

  /**
   * Verifies a JWT token using the configured secret.
   * Throws on invalid signature, expiry, or malformed token.
   */
  verifyJWT(token: string): JwtPayload {
    const decoded = jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'],
    });

    return decoded as JwtPayload;
  }

  /**
   * Decodes a JWT token without signature verification.
   * Use only for reading non-sensitive header information.
   */
  decodeJWT(token: string): JwtPayload | null {
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded === 'string') {
      return null;
    }
    return decoded as JwtPayload;
  }
}

/** Singleton token service instance. */
export const tokenService = new JwtTokenService();
