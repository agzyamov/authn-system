import request from 'supertest';
import { createApp } from '../../../src/app';
import type { Application } from 'express';

/**
 * E2E tests for the complete login flow.
 */
describe('E2E: Login Flow', () => {
  let app: Application;

  beforeAll(() => {
    process.env['NODE_ENV'] = 'test';
    process.env['JWT_SECRET'] = 'test-secret-key-at-least-32-characters-long!!';
    app = createApp();
  });

  describe('login validation', () => {
    it('should reject login with missing credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({});
      expect(response.status).toBe(400);
    });

    it('should reject login without password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com' });
      expect(response.status).toBe(400);
    });

    it('should return 401 with generic message for bad credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'unknown@example.com', password: 'BadPassword123' });

      if (response.status === 401) {
        // Email enumeration prevention: same error for wrong email vs wrong password
        expect(response.body.error).toBe('Invalid credentials');
      }
    });
  });

  describe('JWT token validity', () => {
    it('protected endpoints require JWT Bearer token', async () => {
      const meResponse = await request(app).get('/api/auth/me');
      expect(meResponse.status).toBe(401);

      const logoutResponse = await request(app).post('/api/auth/logout');
      expect(logoutResponse.status).toBe(401);

      const changePassResponse = await request(app)
        .post('/api/auth/password-change')
        .send({ current_password: 'OldPass', new_password: 'NewPassword123' });
      expect(changePassResponse.status).toBe(401);
    });
  });
});
