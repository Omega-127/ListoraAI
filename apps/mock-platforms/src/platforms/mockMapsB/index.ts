import express from 'express';
import cors from 'cors';
import { Store } from '../../shared/store';
import { buildListingRouter } from '../../shared/routes';
import { mockMapsBPermissions } from './permissions';
import seedData from './data.json';
import { ListingValues } from '../../shared/types';

/**
 * mockMapsB — a read-only listing platform.
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
