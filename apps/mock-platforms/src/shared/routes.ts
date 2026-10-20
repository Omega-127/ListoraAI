import { Router, Request, Response } from 'express';
import type { PlatformStore } from './store.js';

/**
 * Builds GET /listing/:id and PATCH /listing/:id handlers.
 *
 * @param store       - In-memory data store for this platform.
 * @param canWrite    - Function returning true when the write is permitted.
 * @param blockedMsg  - Message to include in the 403 body when writes are denied.
 */
export function buildRoutes(
  store: PlatformStore,
  canWrite: (id: string, fields: Record<string, unknown>) => boolean,
  blockedMsg: string,
): Router {
  const router = Router();

  router.get('/listing/:id', (req: Request, res: Response) => {
    const listing = store.get(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    return res.json(listing);
  });

  router.patch('/listing/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const fields = req.body as Record<string, unknown>;

    const existing = store.get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (!canWrite(id, fields)) {
      return res.status(403).json({ error: blockedMsg, reason: 'platform_blocked' });
    }

    const updated = store.patch(id, fields);
    return res.json(updated);
  });

  return router;
}

export const buildListingRouter = buildRoutes;
