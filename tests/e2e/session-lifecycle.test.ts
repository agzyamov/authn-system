import request from 'supertest';
import { createApp } from '../../../src/app';
import type { Application } from 'express';

/**
 * E2E tests for session lifecycle management.
 */
describe('E2E: Session Lifecycle', () => {
  let app: Application;

  beforeAll(() => {
    process.env['NODE_ENV'] = 'test';
    process.env['JWT_SECRET'] = 'test-secret-key-at-least-32-characters-long!!';
    app = createApp();
  });

  describe('invalid tokens are rejected', () => {
    it('should reject malformed JWT', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not.a.valid.jwt');

      expect(response.status).toBe(401);
    });

    it('should reject JWT with wrong signature', async () => {
      // Valid JWT structure but signed with wrong key
      const wrongKeyToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        'eyJzdWIiOiJ0ZXN0IiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwiaWF0IjoxNjE2MjM5MDIyfQ.' +
        'wrongsignaturehere';

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${wrongKeyToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('logout endpoint', () => {
    it('should require authentication for logout', async () => {
      const response = await request(app).post('/api/auth/logout');
      expect(response.status).toBe(401);
    });
  });
});
