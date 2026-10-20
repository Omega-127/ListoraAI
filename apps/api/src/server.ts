/**
 * HTTP server entry point.
 * Validates environment variables (via config/env.ts import) before starting.
 */
import './config/env'; // validates env — must be first
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`ListoraAI API started`, {
    port: env.PORT,
    env: env.NODE_ENV,
    health: `http://localhost:${env.PORT}/health`,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received — shutting down');
  server.close(() => process.exit(0));
});

export { app };
