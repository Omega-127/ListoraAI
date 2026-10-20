/**
 * Tool: getProfile
 * Reads the approved business profile from the database.
 * Read-only — no writes.
 */
import { getProfile } from '../../services/profile.service';

export const getProfileToolDefinition = {
  name: 'getProfile',
  description: 'Returns the owner-approved business profile (name, address, phone, regular hours, holiday hours).',
  input_schema: {
    type: 'object' as const,
    properties: {},
    required: [] as string[],
  },
};

export async function executeGetProfile(): Promise<unknown> {
  return getProfile();
}
