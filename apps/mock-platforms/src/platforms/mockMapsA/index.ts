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
