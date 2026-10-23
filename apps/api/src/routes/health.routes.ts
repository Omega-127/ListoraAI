/**
 * Health check route.
 * Returns 200 + DB connectivity when healthy, 503 when the database is unreachable.
 * Used by Render's health monitor (healthCheckPath: /health in render.yaml).
 */
import { Router } from 'express';
import { prisma } from '../db/prisma';

const router = Router();

router.get('/', async (_req, res) => {
  let dbOk = false;
  let dbError: string | undefined;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  const status = dbOk ? 'ok' : 'degraded';
  const httpStatus = dbOk ? 200 : 503;

  res.status(httpStatus).json({
    status,
    service: 'listora-ai-api',
    db: dbOk ? 'connected' : 'unreachable',
    ...(dbError && { dbError }),
    timestamp: new Date().toISOString(),
  });
});

export default router;
