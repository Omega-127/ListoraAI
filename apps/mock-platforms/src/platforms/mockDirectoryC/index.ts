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
