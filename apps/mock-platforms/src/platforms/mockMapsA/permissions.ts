import { PlatformPermissions } from '../../shared/types.js';

/**
 * mockMapsA permissions: full read-write access.
 * Demonstrates the happy path — updates succeed and listings get verified.
 */
export const mockMapsAPermissions: PlatformPermissions = {
  canRead: true,
  canWrite: true,
  blockedDates: [],
};
