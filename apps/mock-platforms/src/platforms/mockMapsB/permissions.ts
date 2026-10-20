import { PlatformPermissions } from '../../shared/types.js';

/**
 * mockMapsB permissions: read-only access.
 * All PATCH attempts will be rejected with 403.
 * Demonstrates the "blocked" update outcome in the demo.
 */
export const mockMapsBPermissions: PlatformPermissions = {
  canRead: true,
  canWrite: false,
  blockedDates: [],
};
