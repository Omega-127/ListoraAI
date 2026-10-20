import express from 'express';
import cors from 'cors';
import { Store } from '../../shared/store';
import { buildListingRouter } from '../../shared/routes';
import { mockMapsAPermissions } from './permissions';
import seedData from './data.json';
import { ListingValues } from '../../shared/types';

/**
 * mockMapsA — a fully read-write listing platform.
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
