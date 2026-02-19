import request from 'supertest';
import { createApp } from '../../../src/app';
import type { Application } from 'express';

/**
 * Integration tests for GET /api/auth/me endpoint.
 */
describe('GET /api/auth/me', () => {
  let app: Application;

  beforeAll(() => {
    process.env['NODE_ENV'] = 'test';
    process.env['JWT_SECRET'] = 'test-secret-key-at-least-32-characters-long!!';
    app = createApp();
  });

  describe('authentication required', () => {
    it('should return 401 without Authorization header', async () => {
      const response = await request(app).get('/api/auth/me');
      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid Bearer token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token');

      expect(response.status).toBe(401);
    });

    it('should return 401 with non-Bearer auth scheme', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Basic dXNlcjpwYXNz');

      expect(response.status).toBe(401);
    });
  });
});
