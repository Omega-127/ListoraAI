import { PlatformPermissions } from '../../shared/types.js';

/**
 * mockDirectoryC permissions: read-write, but PATCH is blocked on holiday dates.
 *
 * The blockedDates list is evaluated at request time against today's date.
 * For demo purposes this includes Christmas and New Year's Day.
 * To trigger the holiday block during a live demo, temporarily add today's
 * date (YYYY-MM-DD) to this list and restart the service.
 */
export const mockDirectoryCPermissions: PlatformPermissions = {
  canRead: true,
  canWrite: true,
  blockedDates: [
    '2026-01-26', // Republic Day
    '2026-08-15', // Independence Day
    '2026-10-02', // Gandhi Jayanti
    '2026-11-08', // Diwali
  ],
};
