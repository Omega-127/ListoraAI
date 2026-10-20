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
