<<<<<<< HEAD
import { Router, Request, Response } from 'express';
import { Store } from './store.js';
import { PlatformPermissions, PatchResponse } from './types.js';

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
=======
import { Router } from 'express';
import type { PlatformStore } from './store';

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

  router.get('/listing/:id', (req, res) => {
    const listing = store.get(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    return res.json(listing);
  });

  router.patch('/listing/:id', (req, res) => {
    const { id } = req.params;
    const fields = req.body as Record<string, unknown>;

    const existing = store.get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (!canWrite(id, fields)) {
      return res.status(403).json({ error: blockedMsg });
    }

    const updated = store.patch(id, fields);
    return res.json(updated);
>>>>>>> 6d768f43304f1e607cd016ddcba2b8a70ef97568
  });

  return router;
}
