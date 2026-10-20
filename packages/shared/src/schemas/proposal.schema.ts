import { z } from 'zod';

export const ProposalStatusEnum = z.enum(['pending_approval', 'approved', 'rejected']);

export const ProposalSchema = z.object({
  id: z.string().uuid(),
  mismatchId: z.string().uuid(),
  platform: z.string().min(1),
  field: z.string().min(1),
  oldValue: z.unknown().nullable(),
  newValue: z.unknown(),
  status: ProposalStatusEnum,
  approvedAt: z.string().datetime().optional(),
  approvedBy: z.string().optional(),
  createdAt: z.string().datetime(),
});

/** Schema for the agent's proposeUpdate tool output (before saving to DB) */
export const CreateProposalSchema = ProposalSchema.pick({
  mismatchId: true,
  platform: true,
  field: true,
  oldValue: true,
  newValue: true,
});

export type CreateProposalInput = z.infer<typeof CreateProposalSchema>;
