/**
 * Verify service.
 * Re-reads listings from platforms after an update and confirms the applied value.
 *
 * GUARDRAIL: Status becomes VERIFIED only after a successful re-check confirms the expected value.
 */
import { prisma } from '../db/prisma';
import { Prisma } from '@prisma/client';
import { fetchListing } from '../clients/mockPlatform.client';
import { recordAudit } from './audit.service';
import { AppError } from '../middleware/errorHandler';
import { phonesMatch } from '../normalization/phone';
import { textsMatch } from '../normalization/text';
import { hoursMatch } from '../normalization/hours';

function valuesMatch(field: string, expected: unknown, observed: unknown): boolean {
  if (expected === null && observed === null) return true;
  if (expected === null || observed === null) return false;

  if (field === 'phone') return phonesMatch(String(expected), String(observed));
  if (field === 'regularHours' || field === 'holidayHours') {
    return hoursMatch(expected as Record<string, string>, observed as Record<string, string>);
  }
  return textsMatch(String(expected), String(observed));
}

/**
 * Verifies a single proposal: re-reads the listing and checks the field value.
 */
export async function verifyProposal(proposalId: string) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: { mismatch: { include: { listing: true } } },
  });

  if (!proposal) throw new AppError(404, `Proposal ${proposalId} not found`);

  const { platform, field, newValue } = proposal;
  const externalId = proposal.mismatch.listing.externalId;

  const result = await fetchListing(platform, externalId);

  let status: 'VERIFIED' | 'PENDING' | 'FAILED' | 'BLOCKED' = 'PENDING';
  let observedValue: unknown = null;

  if (!result.success) {
    status = 'FAILED';
  } else {
    const values = result.data as Record<string, unknown>;
    observedValue = values[field];
    status = valuesMatch(field, newValue, observedValue) ? 'VERIFIED' : 'FAILED';
  }

  const verification = await prisma.verification.create({
    data: {
      proposalId,
      observedValue: observedValue === null ? (Prisma.JsonNull as Prisma.NullableJsonNullValueInput) : observedValue as Prisma.InputJsonValue,
      status,
    },
  });

  await recordAudit('VERIFICATION_COMPLETED', 'system', {
    proposalId,
    platform,
    field,
    status,
    observedValue,
    expectedValue: newValue,
  });

  return verification;
}

/**
 * Verifies all proposals that have at least one successful UpdateResult.
 */
export async function verifyAllUpdatedProposals() {
  const updatedProposals = await prisma.proposal.findMany({
    where: {
      status: 'APPROVED',
      updateResults: { some: { outcome: 'SUCCESS' } },
    },
  });

  const results = await Promise.allSettled(updatedProposals.map((p) => verifyProposal(p.id)));

  return results.map((r, i) => {
    if (r.status === 'fulfilled') return { proposalId: updatedProposals[i].id, ok: true, result: r.value };
    return { proposalId: updatedProposals[i].id, ok: false, error: String(r.reason) };
  });
}

export async function getVerifications() {
  return prisma.verification.findMany({
    include: { proposal: { include: { mismatch: { include: { listing: true } } } } },
    orderBy: { checkedAt: 'desc' },
  });
}
