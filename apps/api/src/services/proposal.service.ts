/**
 * Proposal service.
 * Creates proposals (always status PENDING_APPROVAL) and handles approve/reject.
 *
 * GUARDRAIL: No listing write can happen without an approved Proposal.
 * This service enforces that gate at the data layer.
 */
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { recordAudit } from './audit.service';
import { AppError } from '../middleware/errorHandler';

export const CreateProposalSchema = z.object({
  mismatchId: z.string().uuid(),
  platform: z.string().min(1),
  field: z.string().min(1),
  oldValue: z.unknown().optional(),
  newValue: z.unknown(),
});

export type CreateProposalInput = z.infer<typeof CreateProposalSchema>;

export async function createProposal(input: CreateProposalInput, actor: string) {
  // Verify mismatch exists
  const mismatch = await prisma.mismatch.findUnique({ where: { id: input.mismatchId } });
  if (!mismatch) throw new AppError(404, `Mismatch ${input.mismatchId} not found`);

  const proposal = await prisma.proposal.create({
    data: {
      mismatchId: input.mismatchId,
      platform: input.platform,
      field: input.field,
      oldValue: input.oldValue as object | undefined,
      newValue: input.newValue as object,
      status: 'PENDING_APPROVAL',
    },
  });

  await recordAudit('PROPOSAL_CREATED', actor === 'agent' ? 'agent' : 'owner', {
    proposalId: proposal.id,
    mismatchId: input.mismatchId,
    platform: input.platform,
    field: input.field,
  });

  return proposal;
}

export async function getProposals(options?: { status?: string }) {
  return prisma.proposal.findMany({
    where: options?.status ? { status: options.status as 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' } : undefined,
    include: {
      mismatch: { include: { listing: true } },
      updateResults: true,
      verifications: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProposalById(id: string) {
  return prisma.proposal.findUnique({
    where: { id },
    include: {
      mismatch: { include: { listing: true } },
      updateResults: true,
      verifications: true,
    },
  });
}

export async function approveProposal(id: string, approvedBy: string) {
  const proposal = await prisma.proposal.findUnique({ where: { id } });
  if (!proposal) throw new AppError(404, `Proposal ${id} not found`);
  if (proposal.status !== 'PENDING_APPROVAL') {
    throw new AppError(409, `Proposal is already ${proposal.status.toLowerCase()}`);
  }

  const updated = await prisma.proposal.update({
    where: { id },
    data: { status: 'APPROVED', approvedAt: new Date(), approvedBy },
  });

  await recordAudit('PROPOSAL_APPROVED', 'owner', { proposalId: id, approvedBy });
  return updated;
}

export async function rejectProposal(id: string, rejectedBy: string) {
  const proposal = await prisma.proposal.findUnique({ where: { id } });
  if (!proposal) throw new AppError(404, `Proposal ${id} not found`);
  if (proposal.status !== 'PENDING_APPROVAL') {
    throw new AppError(409, `Proposal is already ${proposal.status.toLowerCase()}`);
  }

  const updated = await prisma.proposal.update({
    where: { id },
    data: { status: 'REJECTED', rejectedAt: new Date() },
  });

  await recordAudit('PROPOSAL_REJECTED', 'owner', { proposalId: id, rejectedBy });
  return updated;
}
