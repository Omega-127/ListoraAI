import express from 'express';
import { createStore } from '../../shared/store.js';
import { buildRoutes } from '../../shared/routes.js';
import seedData from './data.json' with { type: 'json' };



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
  app.post('/reset', (_req, res) => {
    store.reset();
    res.json({ message: 'mockMapsA data reset to seed state.' });
  });
  return app;
}
