import { Router, Request, Response } from 'express';
import { Store } from './store';
import { PlatformPermissions, PatchResponse } from './types';

/**
 * Builds a shared Express router that implements:
 *   GET  /listing/:id  — returns the listing's current values
 *   PATCH /listing/:id — updates fields if permissions allow
 *
 * Each platform passes its own Store and Permissions to customise behaviour.
 */
export function buildListingRouter(store: Store, permissions: PlatformPermissions): Router {
  const router = Router();

  /** GET /listing/:id */
  router.get('/listing/:id', (req: Request, res: Response) => {
    if (!permissions.canRead) {
      res.status(403).json({ error: 'This platform does not allow reading listings.' });
      return;
    }

    const listing = store.get(req.params.id);
    if (!listing) {
      res.status(404).json({ error: `Listing '${req.params.id}' not found.` });
      return;
    }

    res.json({ id: req.params.id, ...listing });
  });

  /** PATCH /listing/:id */
  router.patch('/listing/:id', (req: Request, res: Response) => {
    if (!permissions.canWrite) {
      const response: PatchResponse = {
        success: false,
        error: 'This platform is read-only. Updates are not permitted.',
        reason: 'read_only',
      };
      res.status(403).json(response);
      return;
    }

    // Check if today is a blocked date
    if (permissions.blockedDates && permissions.blockedDates.length > 0) {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      if (permissions.blockedDates.includes(today)) {
        const response: PatchResponse = {
          success: false,
          error: `Updates are blocked on ${today} (holiday schedule).`,
          reason: 'holiday_block',
        };
        res.status(403).json(response);
        return;
      }
    }

    const listing = store.get(req.params.id);
    if (!listing) {
      res.status(404).json({ error: `Listing '${req.params.id}' not found.` });
      return;
    }

    // Only accept a plain object body
    const body = req.body as Record<string, unknown>;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      res.status(400).json({ error: 'Request body must be a JSON object.' });
      return;
    }

    const updated = store.patch(req.params.id, body);
    if (!updated) {
      res.status(500).json({ error: 'Patch failed unexpectedly.' });
      return;
    }

    const response: PatchResponse = {
      success: true,
      listing: { id: req.params.id, ...updated } as typeof updated,
    };
    res.json(response);
  });

  return router;
}

export const buildRoutes = buildListingRouter;
