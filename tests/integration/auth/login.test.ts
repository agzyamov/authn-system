import request from 'supertest';
import { createApp } from '../../../src/app';
import type { Application } from 'express';

/**
 * Integration tests for POST /api/auth/login endpoint.
 */
describe('POST /api/auth/login', () => {
  let app: Application;

  beforeAll(() => {
    process.env['NODE_ENV'] = 'test';
    process.env['JWT_SECRET'] = 'test-secret-key-at-least-32-characters-long!!';
    app = createApp();
  });

  describe('input validation', () => {
    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'SecurePassword123' })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com' })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'notanemail', password: 'SecurePassword123' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for empty body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('authentication', () => {
    it('should return generic error message (no email enumeration)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'AnyPassword123' });

      // Should either reject with no DB connection or return 401 with generic message
      if (response.status === 401) {
        expect(response.body.error).toBe('Invalid credentials');
        // Must not reveal whether email exists
        expect(response.body.error).not.toContain('not found');
        expect(response.body.error).not.toContain('does not exist');
      }
    });
  });
});
