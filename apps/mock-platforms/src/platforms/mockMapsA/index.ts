import express from 'express';
<<<<<<< HEAD
import cors from 'cors';
import { Store } from '../../shared/store';
import { buildListingRouter } from '../../shared/routes';
import { mockMapsAPermissions } from './permissions';
import seedData from './data.json';
import { ListingValues } from '../../shared/types';
=======
import { createStore } from '../../shared/store.js';
import { buildRoutes } from '../../shared/routes.js';
import seedData from './data.json' with { type: 'json' };
>>>>>>> d180802c4c2ddc23ddf2f8123f75e6f21fc6ee74


<<<<<<< HEAD
  const store = new Store(seedData as Record<string, ListingValues>);

  app.use('/', buildListingRouter(store, mockMapsAPermissions));

  app.get('/health', (_req, res) => {
    res.json({ platform: 'mockMapsA', status: 'ok', listings: store.ids() });
  });

  // Reset endpoint for use in E2E tests
=======

const store = createStore(seedData as Record<string, Record<string, unknown>>);

export const mockMapsARouter = buildRoutes(
  store,
  () => true, // always permitted
  'Write not permitted',
);

export function createMockMapsAApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/', mockMapsARouter);
  app.get('/health', (_req, res) => {
    res.json({ platform: 'mockMapsA', status: 'ok', listings: store.ids() });
  });
>>>>>>> d180802c4c2ddc23ddf2f8123f75e6f21fc6ee74
  app.post('/reset', (_req, res) => {
    store.reset();
    res.json({ message: 'mockMapsA data reset to seed state.' });
  });
<<<<<<< HEAD

=======
>>>>>>> d180802c4c2ddc23ddf2f8123f75e6f21fc6ee74
  return app;
}
