<<<<<<< HEAD
import express from 'express';
import cors from 'cors';
import { Store } from '../../shared/store.js';
import { buildListingRouter } from '../../shared/routes.js';
import { mockMapsAPermissions } from './permissions.js';
import seedData from './data.json' assert { type: 'json' };
import { ListingValues } from '../../shared/types.js';

/**
 * mockMapsA — a fully read-write listing platform.
 *
 * Demo purpose: demonstrates the happy path where all updates succeed
 * and the listing is subsequently verified.
 *
 * Endpoints:
 *   GET  /listing/:id  → returns current listing values
 *   PATCH /listing/:id → updates fields (always permitted)
 */
export function createMockMapsAApp(): express.Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const store = new Store(seedData as Record<string, ListingValues>);

  app.use('/', buildListingRouter(store, mockMapsAPermissions));

  app.get('/health', (_req, res) => {
    res.json({ platform: 'mockMapsA', status: 'ok', listings: store.ids() });
  });

  // Reset endpoint for use in E2E tests
  app.post('/reset', (_req, res) => {
    store.reset();
    res.json({ message: 'mockMapsA data reset to seed state.' });
  });

  return app;
}
=======
/**
 * mock-maps-a — Full read-write platform.
 * All PATCH requests are allowed.
 */
import { createStore } from '../../shared/store';
import { buildRoutes } from '../../shared/routes';
import seedData from './data.json';

const store = createStore(seedData as Record<string, Record<string, unknown>>);

export const mockMapsARouter = buildRoutes(
  store,
  () => true, // always permitted
  'Write not permitted', // never returned
);
>>>>>>> 6d768f43304f1e607cd016ddcba2b8a70ef97568
