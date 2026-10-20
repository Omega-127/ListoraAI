import express from 'express';
import { createStore } from '../../shared/store.js';
import { buildRoutes } from '../../shared/routes.js';
import seedData from './data.json' with { type: 'json' };



const store = createStore(seedData as Record<string, Record<string, unknown>>);

export const mockMapsBRouter = buildRoutes(
  store,
  () => false, // read-only: never permitted
  'This platform is read-only. Updates are not accepted.',
);

export function createMockMapsBApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/', mockMapsBRouter);
  app.get('/health', (_req, res) => {
    res.json({ platform: 'mockMapsB', status: 'ok', mode: 'read-only', listings: store.ids() });
  });
  app.post('/reset', (_req, res) => {
    store.reset();
    res.json({ message: 'mockMapsB data reset to seed state.' });
  });
  return app;
}
