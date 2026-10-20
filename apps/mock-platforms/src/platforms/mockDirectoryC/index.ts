import express from 'express';
import cors from 'cors';
import { Store } from '../../shared/store';
import { buildListingRouter } from '../../shared/routes';
import { mockDirectoryCPermissions } from './permissions';
import seedData from './data.json';
import { ListingValues } from '../../shared/types';

/**
 * mockDirectoryC — a listing directory that blocks updates on holiday dates.
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
