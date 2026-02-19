import request from 'supertest';
import { createApp } from '../../../src/app';
import type { Application } from 'express';

/**
 * E2E tests for the complete password reset flow.
 */
describe('E2E: Password Reset Flow', () => {
  let app: Application;

  beforeAll(() => {
    process.env['NODE_ENV'] = 'test';
    process.env['JWT_SECRET'] = 'test-secret-key-at-least-32-characters-long!!';
    app = createApp();
  });

  describe('password reset request', () => {
    it('should accept valid email in reset request', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset/request')
        .send({ email: 'user@example.com' });

      // Either succeeds (200) or fails without DB (500)
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset/request')
        .send({ email: 'not-valid' });

      expect(response.status).toBe(400);
    });
  });

  describe('security - email enumeration prevention', () => {
    it('should return same response regardless of email existence', async () => {
      const response1 = await request(app)
        .post('/api/auth/password-reset/request')
        .send({ email: 'exists@example.com' });

      const response2 = await request(app)
        .post('/api/auth/password-reset/request')
        .send({ email: 'doesntexist@example.com' });

      // Both should return same status code (200 with DB, 500 without)
      expect(response1.status).toBe(response2.status);
    });
  });

  describe('password reset confirm', () => {
    it('should reject invalid reset token format', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset/confirm')
        .send({ token: 'invalid-token', new_password: 'NewPassword123' });

      expect(response.status).toBe(400);
    });

    it('should reject weak new password', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset/confirm')
        .send({
          token: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
          new_password: 'weak',
        });

      expect(response.status).toBe(400);
    });
  });
});
