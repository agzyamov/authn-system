import { query } from '../config/database.js';
import type { User } from '../models/User.js';
import { normalizeEmail } from '../utils/emailValidator.js';

/**
 * Input for creating a new user.
 */
export interface CreateUserInput {
  email: string;
  password_hash: string;
}

/**
 * UserRepository interface for dependency injection and testing.
 */
export interface UserRepository {
  /**
   * Creates a new user record in the database.
   * @param input - User creation data (email + bcrypt hash)
   * @returns The created user
   */
  create(input: CreateUserInput): Promise<User>;

  /**
   * Finds a user by their email address.
   * @param email - Email to search (normalized to lowercase)
   * @returns The user or null if not found
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Finds a user by their UUID.
   * @param id - User UUID
   * @returns The user or null if not found
   */
  findById(id: string): Promise<User | null>;

  /**
   * Updates the password hash for a user.
   * @param userId - User UUID
   * @param passwordHash - New bcrypt password hash
   */
  updatePassword(userId: string, passwordHash: string): Promise<void>;
}

/**
 * PostgreSQL implementation of UserRepository.
 */
export class PostgresUserRepository implements UserRepository {
  /**
   * Creates a new user in the database.
   * Normalizes email to lowercase before storage.
   */
  async create(input: CreateUserInput): Promise<User> {
    const normalizedEmail = normalizeEmail(input.email);
    const result = await query<User>(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, password_hash, created_at, updated_at`,
      [normalizedEmail, input.password_hash],
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create user');
    }
    return row;
  }

  /**
   * Finds a user by email (case-insensitive lookup).
   */
  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = normalizeEmail(email);
    const result = await query<User>(
      `SELECT id, email, password_hash, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [normalizedEmail],
    );

    return result.rows[0] ?? null;
  }

  /**
   * Finds a user by their UUID.
   */
  async findById(id: string): Promise<User | null> {
    const result = await query<User>(
      `SELECT id, email, password_hash, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [id],
    );

    return result.rows[0] ?? null;
  }

  /**
   * Updates the password hash for a user and refreshes updated_at.
   */
  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, userId]);
  }
}
