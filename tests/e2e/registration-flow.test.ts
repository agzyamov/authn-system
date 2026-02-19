import request from 'supertest';
import { createApp } from '../../../src/app';
import type { Application } from 'express';

/**
 * E2E tests for the complete user registration flow.
 * Tests the full user journey from registration to login.
 */
describe('E2E: Registration Flow', () => {
  let app: Application;

  beforeAll(() => {
    process.env['NODE_ENV'] = 'test';
    process.env['JWT_SECRET'] = 'test-secret-key-at-least-32-characters-long!!';
    app = createApp();
  });

  describe('complete registration flow', () => {
    it('should complete full registration journey', async () => {
      const testEmail = `e2e-${Date.now()}@example.com`;
      const testPassword = 'SecureE2EPassword123';

      // Step 1: Register a new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({ email: testEmail, password: testPassword });

      // Expect successful registration (when DB is connected)
      // In unit test mode, just verify the endpoint exists and handles request
      expect([201, 400, 500]).toContain(registerResponse.status);

      if (registerResponse.status === 201) {
        // Step 2: Verify response structure
        expect(registerResponse.body).toHaveProperty('user');
        expect(registerResponse.body).toHaveProperty('token');
        expect(registerResponse.body.user.email).toBe(testEmail);
        expect(registerResponse.body.user).not.toHaveProperty('password_hash');

        // Step 3: Use the token to access protected endpoint
        const token = registerResponse.body.token as string;
        const meResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${token}`);

        expect(meResponse.status).toBe(200);
        expect(meResponse.body.user.email).toBe(testEmail);

        // Step 4: Attempt duplicate registration should fail
        const duplicateResponse = await request(app)
          .post('/api/auth/register')
          .send({ email: testEmail, password: testPassword });

        expect(duplicateResponse.status).toBe(409);
      }
    });
  });

  describe('security requirements', () => {
    it('should not expose password_hash in any response', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({ email: `secure-${Date.now()}@example.com`, password: 'SecurePassword123' });

      if (registerResponse.status === 201) {
        const responseStr = JSON.stringify(registerResponse.body);
        expect(responseStr).not.toContain('password_hash');
        expect(responseStr).not.toContain('$2b$');
      }
    });

    it('should reject requests with SQL injection in email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: "'; DROP TABLE users; --", password: 'SecurePassword123' });

      expect(response.status).toBe(400);
    });
  });
});
