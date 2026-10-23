/**
 * Proposal service.
 * Creates proposals (always status PENDING_APPROVAL) and handles approve/reject.
 *
 * GUARDRAIL: No listing write can happen without an approved Proposal.
 * This service enforces that gate at the data layer.
 */
import { z } from 'zod';
import { prisma } from '../db/prisma';
import type { Prisma } from '@prisma/client';
import { recordAudit } from './audit.service';
import { AppError } from '../middleware/errorHandler';

export const CreateProposalSchema = z.object({
  mismatchId: z.string().min(1),
  platform: z.string().min(1),
  field: z.string().min(1),
  oldValue: z.unknown().optional(),
  newValue: z.unknown(),
});

export type CreateProposalInput = z.infer<typeof CreateProposalSchema>;

export const INITIAL_DEMO_PROPOSALS: Record<
  string,
  {
    platform: string;
    externalId: string;
    field: string;
    oldValue: unknown;
    newValue: unknown;
    status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
    reason: string;
  }
> = {
  'prop-1': {
    platform: 'googleMaps',
    externalId: 'listing_001',
    field: 'phone',
    oldValue: '080 4123 4567',
    newValue: '+918041234567',
    status: 'PENDING_APPROVAL',
    reason: 'Standardize formatting to E.164 canonical telephone protocol (+918041234567).',
  },
  'prop-2': {
    platform: 'mappls',
    externalId: 'listing_002',
    field: 'regularHours',
    oldValue: 'Mon–Fri 8–20',
    newValue: {
      monday: '07:00-22:00',
      tuesday: '07:00-22:00',
      wednesday: '07:00-22:00',
      thursday: '07:00-22:00',
      friday: '07:00-23:00',
      saturday: '08:00-23:00',
      sunday: '08:00-22:00',
    },
    status: 'PENDING_APPROVAL',
    reason: 'Weekend and evening operating schedules on Mappls contradict approved canonical hours.',
  },
  'prop-3': {
    platform: 'justdial',
    externalId: 'listing_003',
    field: 'name',
    oldValue: 'The Bombay Roastery (Indiranagar)',
    newValue: 'The Bombay Roastery & Café',
    status: 'PENDING_APPROVAL',
    reason: 'Removes local modifier to align with legal branding on Justdial.',
  },
  'prop-4': {
    platform: 'googleMaps',
    externalId: 'listing_001',
    field: 'holidayHours',
    oldValue: 'Open Jan 26',
    newValue: { '2026-01-26': 'closed' },
    status: 'APPROVED',
    reason: 'Store is marked closed on Republic Day in canonical profile.',
  },
  'prop-5': {
    platform: 'justdial',
    externalId: 'listing_003',
    field: 'address',
    oldValue: 'Plot 742, 12th Main Rd, HAL 2nd Stage, Bangalore 560038',
    newValue: 'Plot 742, 12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038',
    status: 'REJECTED',
    reason: 'Address abbreviation discrepancy flagged for review before Justdial sync.',
  },
};

/**
 * Ensures demo/initial proposals and their required listing/mismatch relations
 * are present in the database.
 */
export async function ensureDemoProposalsExist(): Promise<void> {
  for (const [id, demo] of Object.entries(INITIAL_DEMO_PROPOSALS)) {
    try {
      const existing = await prisma.proposal.findUnique({ where: { id } });
      if (existing) continue;

      const listing = await prisma.listing.upsert({
        where: {
          platform_externalId: {
            platform: demo.platform,
            externalId: demo.externalId,
          },
        },
        update: {},
        create: {
          platform: demo.platform,
          externalId: demo.externalId,
          values: { [demo.field]: demo.oldValue } as Prisma.InputJsonValue,
          fetchedAt: new Date(),
        },
      });

      const mismatch = await prisma.mismatch.upsert({
        where: { id: `mismatch-${id}` },
        update: {},
        create: {
          id: `mismatch-${id}`,
          listingId: listing.id,
          field: demo.field,
          profileValue: demo.newValue as Prisma.InputJsonValue,
          listingValue: demo.oldValue as Prisma.InputJsonValue,
          kind: demo.status === 'REJECTED' ? 'NEEDS_REVIEW' : 'CONFLICTING',
          explanation: demo.reason,
        },
      });

      await prisma.proposal.upsert({
        where: { id },
        update: {},
        create: {
          id,
          mismatchId: mismatch.id,
          platform: demo.platform,
          field: demo.field,
          oldValue: demo.oldValue as Prisma.InputJsonValue,
          newValue: demo.newValue as Prisma.InputJsonValue,
          status: demo.status,
          approvedAt: demo.status === 'APPROVED' ? new Date() : null,
          approvedBy: demo.status === 'APPROVED' ? 'owner' : null,
          rejectedAt: demo.status === 'REJECTED' ? new Date() : null,
        },
      });
    } catch {
      // Ignore parallel insertion conflicts
    }
  }
}

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
  try {
    const count = await prisma.proposal.count();
    if (count === 0) {
      await ensureDemoProposalsExist();
    }
  } catch {
    // If DB is offline, continue to query
  }

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
  let proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      mismatch: { include: { listing: true } },
      updateResults: true,
      verifications: true,
    },
  });

  if (!proposal && INITIAL_DEMO_PROPOSALS[id]) {
    await ensureDemoProposalsExist();
    proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        mismatch: { include: { listing: true } },
        updateResults: true,
        verifications: true,
      },
    });
  }

  return proposal;
}

export async function approveProposal(id: string, approvedBy: string) {
  let proposal = await prisma.proposal.findUnique({ where: { id } });

  // If the proposal is not in the database yet, auto-materialize it from initial demo proposals
  if (!proposal && INITIAL_DEMO_PROPOSALS[id]) {
    await ensureDemoProposalsExist();
    proposal = await prisma.proposal.findUnique({ where: { id } });
  }

  if (!proposal) throw new AppError(404, `Proposal ${id} not found`);

  // Idempotent approval
  if (proposal.status === 'APPROVED') {
    return proposal;
  }

  if (proposal.status === 'REJECTED') {
    throw new AppError(409, `Proposal is already rejected`);
  }

  const updated = await prisma.proposal.update({
    where: { id },
    data: { status: 'APPROVED', approvedAt: new Date(), approvedBy },
  });

  await recordAudit('PROPOSAL_APPROVED', 'owner', { proposalId: id, approvedBy });
  return updated;
}

export async function rejectProposal(id: string, rejectedBy: string) {
  let proposal = await prisma.proposal.findUnique({ where: { id } });

  if (!proposal && INITIAL_DEMO_PROPOSALS[id]) {
    await ensureDemoProposalsExist();
    proposal = await prisma.proposal.findUnique({ where: { id } });
  }

  if (!proposal) throw new AppError(404, `Proposal ${id} not found`);

  // Idempotent rejection
  if (proposal.status === 'REJECTED') {
    return proposal;
  }

  if (proposal.status === 'APPROVED') {
    throw new AppError(409, `Proposal is already approved`);
  }

  const updated = await prisma.proposal.update({
    where: { id },
    data: { status: 'REJECTED', rejectedAt: new Date() },
  });

  await recordAudit('PROPOSAL_REJECTED', 'owner', { proposalId: id, rejectedBy });
  return updated;
}
