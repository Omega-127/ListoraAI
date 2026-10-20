/**
 * Tool: verifyListing
 * Re-reads a listing from its platform and checks the field value.
 * Read-only — creates a Verification record but does NOT change the listing.
 */
import { z } from 'zod';
import { verifyProposal } from '../../services/verify.service';

export const verifyListingToolDefinition = {
  name: 'verifyListing',
  description:
    'Re-fetches a listing and checks whether the approved value was applied. Creates a Verification record. A listing is marked VERIFIED only when this tool confirms the expected value.',
  input_schema: {
    type: 'object' as const,
    properties: {
      proposalId: { type: 'string', description: 'ID of the proposal to verify' },
    },
    required: ['proposalId'],
  },
};

const InputSchema = z.object({ proposalId: z.string().uuid() });

export async function executeVerifyListing(input: unknown): Promise<unknown> {
  const { proposalId } = InputSchema.parse(input);
  return verifyProposal(proposalId);
}
