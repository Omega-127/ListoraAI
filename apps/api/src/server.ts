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

  // Render Free Tier Keep-Alive: Ping external URL every 13 minutes to prevent the 15-minute inactivity spin-down
  if (env.NODE_ENV === 'production') {
    const externalUrl = process.env.RENDER_EXTERNAL_URL || 'https://listora-api.onrender.com';
    const HEARTBEAT_INTERVAL_MS = 13 * 60 * 1000; // 13 minutes

    setInterval(async () => {
      try {
        const res = await fetch(`${externalUrl}/health`);
        if (res.ok) {
          logger.info('Keep-alive heartbeat succeeded — preventing free-tier idle spin-down');
        }
      } catch (err: any) {
        logger.warn('Keep-alive heartbeat attempt', { error: err.message });
      }
    }, HEARTBEAT_INTERVAL_MS);
  }
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
