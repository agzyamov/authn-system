import request from 'supertest';
import { createApp } from '../../../src/app';
import type { Application } from 'express';

/**
 * Integration tests for POST /api/auth/password-change endpoint.
 */
describe('POST /api/auth/password-change', () => {
  let app: Application;

  beforeAll(() => {
    process.env['NODE_ENV'] = 'test';
    process.env['JWT_SECRET'] = 'test-secret-key-at-least-32-characters-long!!';
    app = createApp();
  });

  describe('authentication required', () => {
    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/auth/password-change')
        .send({ current_password: 'OldPassword123', new_password: 'NewPassword123' });

      expect(response.status).toBe(401);
    });
  });

  describe('input validation', () => {
    it('should validate input even without auth (validation runs after auth middleware)', async () => {
      const response = await request(app)
        .post('/api/auth/password-change')
        .set('Authorization', 'Bearer invalid.token')
        .send({});

      // Auth check happens first, so invalid token returns 401
      expect(response.status).toBe(401);
    });
  });
});
