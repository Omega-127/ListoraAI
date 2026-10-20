<<<<<<< HEAD
import express from 'express';
import cors from 'cors';
import { Store } from '../../shared/store.js';
import { buildListingRouter } from '../../shared/routes.js';
import { mockMapsBPermissions } from './permissions.js';
import seedData from './data.json' assert { type: 'json' };
import { ListingValues } from '../../shared/types.js';

/**
 * mockMapsB — a read-only listing platform.
 *
 * Demo purpose: all PATCH requests return 403, producing "blocked" outcomes
 * in UpdateResult and showing that the system correctly records and reports
 * write failures without crashing.
 *
 * Endpoints:
 *   GET  /listing/:id  → returns current listing values (always works)
 *   PATCH /listing/:id → always returns 403 (read-only platform)
 */
export function createMockMapsBApp(): express.Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const store = new Store(seedData as Record<string, ListingValues>);

  app.use('/', buildListingRouter(store, mockMapsBPermissions));

  app.get('/health', (_req, res) => {
    res.json({ platform: 'mockMapsB', status: 'ok', mode: 'read-only', listings: store.ids() });
  });

  app.post('/reset', (_req, res) => {
    store.reset();
    res.json({ message: 'mockMapsB data reset to seed state.' });
  });

  return app;
}
=======
/**
 * mock-maps-b — Read-only platform.
 * All PATCH requests are blocked with 403.
 */
import { createStore } from '../../shared/store';
import { buildRoutes } from '../../shared/routes';
import seedData from './data.json';

const store = createStore(seedData as Record<string, Record<string, unknown>>);

export const mockMapsBRouter = buildRoutes(
  store,
  () => false, // never permitted
  'This platform is read-only. Updates are not accepted.',
);
>>>>>>> 6d768f43304f1e607cd016ddcba2b8a70ef97568
