import express from 'express';
import cors from 'cors';
import { Store } from '../../shared/store';
import { buildListingRouter } from '../../shared/routes';
import { mockMapsBPermissions } from './permissions';
import seedData from './data.json';
import { ListingValues } from '../../shared/types';

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
