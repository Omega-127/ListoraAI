import express from 'express';
<<<<<<< HEAD
import cors from 'cors';
import { Store } from '../../shared/store';
import { buildListingRouter } from '../../shared/routes';
import { mockDirectoryCPermissions } from './permissions';
import seedData from './data.json';
import { ListingValues } from '../../shared/types';
=======
import { createStore } from '../../shared/store.js';
import { buildRoutes } from '../../shared/routes.js';
import seedData from './data.json' with { type: 'json' };
>>>>>>> d180802c4c2ddc23ddf2f8123f75e6f21fc6ee74



<<<<<<< HEAD
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

=======
const HOLIDAY_LOCK_DATES = ['2026-12-25', '2027-01-01', '2026-11-28'];

const store = createStore(seedData as Record<string, Record<string, unknown>>);

function isHolidayBlocked(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return HOLIDAY_LOCK_DATES.includes(today);
}

export const mockDirectoryCRouter = buildRoutes(
  store,
  () => !isHolidayBlocked(),
  'Updates are blocked on holiday dates (holiday schedule locked).',
);

export function createMockDirectoryCApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/', mockDirectoryCRouter);
  app.get('/health', (_req, res) => {
    res.json({
      platform: 'mockDirectoryC',
      status: 'ok',
      mode: isHolidayBlocked() ? 'holiday-blocked' : 'writable',
      blockedDates: HOLIDAY_LOCK_DATES,
      listings: store.ids(),
    });
  });
>>>>>>> d180802c4c2ddc23ddf2f8123f75e6f21fc6ee74
  app.post('/reset', (_req, res) => {
    store.reset();
    res.json({ message: 'mockDirectoryC data reset to seed state.' });
  });
<<<<<<< HEAD

=======
>>>>>>> d180802c4c2ddc23ddf2f8123f75e6f21fc6ee74
  return app;
}
