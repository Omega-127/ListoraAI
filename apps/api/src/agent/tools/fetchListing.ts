/**
 * Tool: fetchListing
 * Reads a listing from a mock platform. Read-only — no writes.
 */
import { z } from 'zod';
import { fetchListing as fetchFromPlatform } from '../../clients/mockPlatform.client';

export const fetchListingToolDefinition = {
  name: 'fetchListing',
  description: 'Fetches a listing from a named mock platform by its external ID.',
  input_schema: {
    type: 'object' as const,
    properties: {
      platform: { type: 'string', description: 'Platform name (e.g. mock-maps-a)' },
      externalId: { type: 'string', description: 'The external listing ID on the platform' },
    },
    required: ['platform', 'externalId'],
  },
};

const InputSchema = z.object({
  platform: z.string(),
  externalId: z.string(),
});

export async function executeFetchListing(input: unknown): Promise<unknown> {
  const { platform, externalId } = InputSchema.parse(input);
  return fetchFromPlatform(platform, externalId);
}
