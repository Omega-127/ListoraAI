/**
 * API route tests using Supertest.
 *
 * NOTE: These tests use a real (test) database if DATABASE_URL is set.
 * If DATABASE_URL is not set (CI without DB), the tests that hit routes requiring
 * auth/DB will be skipped gracefully.
 *
 * Health check and 401 guard tests run without a DB connection.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';

// Set minimal env vars for tests before creating the app
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/test';
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? 'test-key-placeholder';
process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? 'test-secret-that-is-at-least-32-characters-long';
process.env.OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'test@example.com';
process.env.OWNER_PASSWORD_HASH = process.env.OWNER_PASSWORD_HASH ?? '$2a$10$test.hash.placeholder.value.here.xx';
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS ?? 'http://localhost:5173';
process.env.MOCK_PLATFORM_URLS = process.env.MOCK_PLATFORM_URLS ?? 'http://localhost:4100';
process.env.NODE_ENV = 'test';

const app = createApp();

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth guards', () => {
  const PROTECTED = [
    '/api/v1/profile',
    '/api/v1/listings',
    '/api/v1/mismatches',
    '/api/v1/proposals',
    '/api/v1/score',
    '/api/v1/audit',
    '/api/v1/alerts',
  ];

  for (const path of PROTECTED) {
    it(`GET ${path} returns 401 without session cookie`, async () => {
      const res = await request(app).get(path);
      expect(res.status).toBe(401);
    });
  }
});

describe('POST /auth/login', () => {
  it('returns 400 for invalid body', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('returns 401 for wrong credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/v1/profile (validation)', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).put('/api/v1/profile').send({ name: 'New Name' });
    expect(res.status).toBe(401);
  });
});
