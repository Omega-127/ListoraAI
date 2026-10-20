<<<<<<< HEAD
import express from 'express';
import cors from 'cors';
import { Store } from '../../shared/store.js';
import { buildListingRouter } from '../../shared/routes.js';
import { mockDirectoryCPermissions } from './permissions.js';
import seedData from './data.json' assert { type: 'json' };
import { ListingValues } from '../../shared/types.js';

/**
 * mockDirectoryC — a listing directory that blocks updates on holiday dates.
 *
 * Demo purpose: shows that the system correctly records "blocked" outcomes
 * due to a schedule-based platform restriction, and that the holiday agent
 * can detect and explain why updates are unavailable on specific dates.
 *
 * Endpoints:
 *   GET  /listing/:id  → always works
 *   PATCH /listing/:id → works on normal dates; 403 on blockedDates
 *
 * To trigger the holiday block in a live demo:
 *   Add today's date string (YYYY-MM-DD) to mockDirectoryCPermissions.blockedDates
 *   in permissions.ts and restart.
 */
export function createMockDirectoryCApp(): express.Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const store = new Store(seedData as Record<string, ListingValues>);

  app.use('/', buildListingRouter(store, mockDirectoryCPermissions));

  app.get('/health', (_req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const isBlocked = mockDirectoryCPermissions.blockedDates?.includes(today) ?? false;
    res.json({
      platform: 'mockDirectoryC',
      status: 'ok',
      mode: isBlocked ? 'holiday-blocked' : 'writable',
      blockedDates: mockDirectoryCPermissions.blockedDates,
      listings: store.ids(),
    });
  });

  app.post('/reset', (_req, res) => {
    store.reset();
    res.json({ message: 'mockDirectoryC data reset to seed state.' });
  });

  return app;
}
=======
/**
 * mock-directory-c — Blocks updates on declared holiday dates.
 * Write is allowed on any other day.
 */
import { createStore } from '../../shared/store';
import { buildRoutes } from '../../shared/routes';
import seedData from './data.json';

// Holiday dates on which updates are blocked (ISO format YYYY-MM-DD)
const HOLIDAY_LOCK_DATES = ['2026-12-25', '2027-01-01', '2026-11-28'];

const store = createStore(seedData as Record<string, Record<string, unknown>>);

function isHolidayBlocked(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return HOLIDAY_LOCK_DATES.includes(today);
}

export const mockDirectoryCRouter = buildRoutes(
  store,
  () => !isHolidayBlocked(),
  'Updates are blocked during holiday periods on this platform.',
);
>>>>>>> 6d768f43304f1e607cd016ddcba2b8a70ef97568
