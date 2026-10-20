/**
 * Tool: applyUpdate
 * Applies an APPROVED proposal to a platform listing.
 * Calls update.service.applyProposal which enforces the approval guardrail.
 */
import { z } from 'zod';
import { applyProposal } from '../../services/update.service';

export const applyUpdateToolDefinition = {
  name: 'applyUpdate',
  description:
    'Applies an approved proposal to its platform listing. Fails if the proposal is not APPROVED. Use only when explicitly instructed — updates normally go through the human approval workflow.',
  input_schema: {
    type: 'object' as const,
    properties: {
      proposalId: { type: 'string', description: 'ID of an APPROVED proposal to apply' },
    },
    required: ['proposalId'],
  },
};

const InputSchema = z.object({ proposalId: z.string().min(1) });

export async function executeApplyUpdate(input: unknown): Promise<unknown> {
  const { proposalId } = InputSchema.parse(input);
  return applyProposal(proposalId);
}
