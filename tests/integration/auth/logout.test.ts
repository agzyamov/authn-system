import request from 'supertest';
import { createApp } from '../../../src/app';
import type { Application } from 'express';

/**
 * Integration tests for POST /api/auth/logout endpoint.
 */
describe('POST /api/auth/logout', () => {
  let app: Application;

  beforeAll(() => {
    process.env['NODE_ENV'] = 'test';
    process.env['JWT_SECRET'] = 'test-secret-key-at-least-32-characters-long!!';
    app = createApp();
  });

  describe('authentication required', () => {
    it('should return 401 without token', async () => {
      const response = await request(app).post('/api/auth/logout');
      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
    });
  });
});
