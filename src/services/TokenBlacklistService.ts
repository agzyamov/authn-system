import { logger } from '../utils/logger.js';

/**
 * TokenBlacklistService interface.
 * Manages immediate token invalidation (for logout and password change).
 * Redis-backed implementation for production; in-memory for development.
 */
export interface TokenBlacklistService {
  /**
   * Adds a JWT token to the blacklist.
   * @param token - The JWT string to blacklist
   * @param expirySeconds - How long to keep in blacklist (should match JWT expiry)
   */
  blacklist(token: string, expirySeconds: number): Promise<void>;

  /**
   * Checks whether a token is blacklisted.
   * @param token - The JWT string to check
   * @returns True if the token has been blacklisted
   */
  isBlacklisted(token: string): Promise<boolean>;
}

/**
 * In-memory token blacklist implementation.
 * For development and testing. Does NOT survive server restarts.
 * Production should use Redis-backed implementation.
 */
export class InMemoryTokenBlacklistService implements TokenBlacklistService {
  private readonly blacklistedTokens = new Map<string, number>();

  blacklist(token: string, expirySeconds: number): Promise<void> {
    const expiresAt = Date.now() + expirySeconds * 1000;
    this.blacklistedTokens.set(token, expiresAt);
    this.cleanup();
    logger.debug({ tokenPrefix: token.slice(0, 20) }, 'Token blacklisted');
    return Promise.resolve();
  }

  isBlacklisted(token: string): Promise<boolean> {
    const expiresAt = this.blacklistedTokens.get(token);
    if (!expiresAt) return Promise.resolve(false);
    if (Date.now() > expiresAt) {
      this.blacklistedTokens.delete(token);
      return Promise.resolve(false);
    }
    return Promise.resolve(true);
  }

  /** Removes expired entries to prevent memory leaks. */
  private cleanup(): void {
    const now = Date.now();
    for (const [token, expiresAt] of this.blacklistedTokens.entries()) {
      if (now > expiresAt) {
        this.blacklistedTokens.delete(token);
      }
    }
  }
}

/** Singleton blacklist instance (in-memory for development). */
export const tokenBlacklist = new InMemoryTokenBlacklistService();
