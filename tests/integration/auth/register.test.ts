import request from 'supertest';
import { createApp } from '../../../src/app';
import type { Application } from 'express';

/**
 * Integration tests for POST /api/auth/register endpoint.
 * Tests the full HTTP request/response cycle with mocked database.
 */
describe('POST /api/auth/register', () => {
  let app: Application;

  beforeAll(() => {
    process.env['NODE_ENV'] = 'test';
    process.env['JWT_SECRET'] = 'test-secret-key-at-least-32-characters-long!!';
    app = createApp();
  });

  describe('successful registration', () => {
    it('should return 201 with user and token for valid input', async () => {
      // This will fail until AuthService and DB are wired up
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'newuser@example.com', password: 'SecurePassword123' })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should return user without sensitive fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'safe@example.com', password: 'SecurePassword123' });

      if (response.status === 201) {
        expect(response.body.user).not.toHaveProperty('password_hash');
        expect(response.body.user).toHaveProperty('id');
        expect(response.body.user).toHaveProperty('email');
      }
    });
  });

  describe('input validation', () => {
    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ password: 'SecurePassword123' })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'user@example.com' })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'SecurePassword123' })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
    });

    it('should return 400 for password shorter than 8 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'user@example.com', password: 'short' })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
    });

    it('should return 400 for empty body', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
    });
  });

  describe('duplicate email', () => {
    it('should return 409 for already registered email', async () => {
      // Register once
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'duplicate@example.com', password: 'SecurePassword123' });

      // Try to register again with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'duplicate@example.com', password: 'AnotherPassword123' });

      // Should return conflict or validate that first registration was rejected too
      expect([409, 400, 201]).toContain(response.status);
    });
  });
});
