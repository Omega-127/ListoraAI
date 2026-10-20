import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      ANTHROPIC_API_KEY: 'test-key-placeholder',
      SESSION_SECRET: 'test-secret-that-is-at-least-32-characters-long',
      OWNER_EMAIL: 'test@example.com',
      OWNER_PASSWORD_HASH: '$2a$10$test.hash.placeholder.value.here.xx',
      CORS_ORIGINS: 'http://localhost:5173',
      MOCK_PLATFORM_URLS: 'http://localhost:4100',
      NODE_ENV: 'test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@bizlisting/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
});
