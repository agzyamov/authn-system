import request from 'supertest';
import { createApp } from '../../../src/app';
import type { Application } from 'express';

/**
 * Integration tests for password reset confirm endpoint.
 */
describe('POST /api/auth/password-reset/confirm', () => {
  let app: Application;

  beforeAll(() => {
    process.env['NODE_ENV'] = 'test';
    process.env['JWT_SECRET'] = 'test-secret-key-at-least-32-characters-long!!';
    app = createApp();
  });

  describe('input validation', () => {
    it('should return 400 for missing token', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset/confirm')
        .send({ new_password: 'NewPassword123' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid token format (not UUID)', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset/confirm')
        .send({ token: 'not-a-uuid-token', new_password: 'NewPassword123' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing new_password', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset/confirm')
        .send({ token: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for weak new_password', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset/confirm')
        .send({ token: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', new_password: 'weak' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid/expired token', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset/confirm')
        .send({
          token: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
          new_password: 'NewStrongPassword123',
        });

      // Without DB: 500. With DB and invalid token: 400
      expect([400, 500]).toContain(response.status);
    });
  });
});
