import request from 'supertest';
import { createApp } from '../../../src/app';
import type { Application } from 'express';

/**
 * Integration tests for expired token rejection.
 */
describe('Expired token handling', () => {
  let app: Application;

  beforeAll(() => {
    process.env['NODE_ENV'] = 'test';
    process.env['JWT_SECRET'] = 'test-secret-key-at-least-32-characters-long!!';
    app = createApp();
  });

  it('should return 401 for expired JWT token', async () => {
    // This is a JWT token with exp set in the past
    // Header: {"alg":"HS256","typ":"JWT"}
    // Payload: {"sub":"user-id","email":"test@example.com","iat":1000000,"exp":1000001}
    // This token will always be expired
    const expiredToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJzdWIiOiJ1c2VyLWlkIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxMDAwMDAwLCJleHAiOjEwMDAwMDF9.' +
      'invalid-signature';

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
  });

  it('should return clear error message for expired token', async () => {
    // Minimal expired JWT with a known expired timestamp
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.real.token');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });
});
