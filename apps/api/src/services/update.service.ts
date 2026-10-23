/**
 * Update service.
 * Applies approved proposals to mock platforms.
 *
 * GUARDRAIL: Only proposals with status=APPROVED are executed.
 *            Platform permission rules are respected.
 */
import { prisma } from '../db/prisma';
import { patchListing } from '../clients/mockPlatform.client';
import { recordAudit } from './audit.service';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

/**
 * Applies a single approved proposal to its platform.
 */
export async function applyProposal(proposalId: string) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: { mismatch: { include: { listing: true } } },
  });

  if (!proposal) throw new AppError(404, `Proposal ${proposalId} not found`);
  if (proposal.status !== 'APPROVED') {
    throw new AppError(409, `Proposal must be APPROVED before it can be applied. Current status: ${proposal.status}`);
  }

  const { platform, field } = proposal;
  const externalId = proposal.mismatch.listing.externalId;

  // Build the patch payload — only the changed field
  const patchFields = { [field]: proposal.newValue };

  logger.info('Applying update', { proposalId, platform, externalId, field });

  const updateResult = await patchListing(platform, externalId, patchFields);

  if (updateResult.outcome === 'SUCCESS') {
    try {
      const currentListing = proposal.mismatch.listing;
      const currentValues = (currentListing.values as Record<string, any>) || {};
      await prisma.listing.update({
        where: { id: currentListing.id },
        data: {
          values: { ...currentValues, [field]: proposal.newValue },
        },
      });
      await prisma.mismatch.update({
        where: { id: proposal.mismatchId },
        data: { resolved: true },
      });
    } catch (e) {
      logger.warn('Failed to update local listing/mismatch after successful platform patch', { error: e });
    }
  }

  const stored = await prisma.updateResult.create({
    data: {
      proposalId,
      outcome: updateResult.outcome,
      response: updateResult.response as object | undefined,
    },
  });

  await recordAudit('UPDATE_APPLIED', 'system', {
    proposalId,
    platform,
    externalId,
    field,
    outcome: updateResult.outcome,
    error: updateResult.error,
  });

  return stored;
}

/**
 * Applies all currently APPROVED proposals.
 * Returns an array of UpdateResult records.
 */
export async function applyAllApprovedProposals() {
  const approved = await prisma.proposal.findMany({
    where: { status: 'APPROVED' },
    include: { mismatch: { include: { listing: true } } },
  });

  if (approved.length === 0) {
    return { message: 'No approved proposals to apply', results: [] };
  }

  const results = await Promise.allSettled(approved.map((p) => applyProposal(p.id)));

  const outcomes = results.map((r, i) => {
    if (r.status === 'fulfilled') return { proposalId: approved[i].id, ok: true, result: r.value };
    return { proposalId: approved[i].id, ok: false, error: String(r.reason) };
  });

  return { results: outcomes };
}

export async function getUpdateResults() {
  return prisma.updateResult.findMany({
    include: { proposal: { include: { mismatch: { include: { listing: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
}
