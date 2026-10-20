/**
 * Tool: proposeUpdate
 * Creates a Proposal record with status PENDING_APPROVAL.
 * This is the ONLY write the agent is allowed to make directly.
 */
import { z } from 'zod';
import { createProposal } from '../../services/proposal.service';

export const proposeUpdateToolDefinition = {
  name: 'proposeUpdate',
  description:
    'Creates a correction proposal for owner review. The proposal will have status PENDING_APPROVAL. Updates are NOT applied until the owner approves.',
  input_schema: {
    type: 'object' as const,
    properties: {
      mismatchId: { type: 'string', description: 'ID of the mismatch this proposal addresses' },
      platform: { type: 'string', description: 'Platform name to update' },
      field: { type: 'string', description: 'Field to update' },
      oldValue: { description: 'Current listing value (for display)' },
      newValue: { description: 'Proposed corrected value from the approved profile' },
    },
    required: ['mismatchId', 'platform', 'field', 'newValue'],
  },
};

const InputSchema = z.object({
  mismatchId: z.string().min(1),
  platform: z.string(),
  field: z.string(),
  oldValue: z.unknown().optional(),
  newValue: z.unknown(),
});

export async function executeProposeUpdate(input: unknown): Promise<unknown> {
  const parsed = InputSchema.parse(input);
  return createProposal(
    {
      mismatchId: parsed.mismatchId,
      platform: parsed.platform,
      field: parsed.field,
      oldValue: parsed.oldValue,
      newValue: parsed.newValue,
    },
    'agent',
  );
}
