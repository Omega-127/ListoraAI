/**
 * Guardrails — enforced rules for the AI agent.
 *
 * Rule 1: No listing write without an approved Proposal.
 * Rule 2: When sources conflict and profile does not decide it, mark NEEDS_REVIEW. Never pick a value.
 * Rule 3: A listing may be marked VERIFIED only after verifyListing confirms the applied value.
 * Rule 4: Never bypass a platform permission. Blocked listings stay blocked.
 * Rule 5: Agent output that fails schema validation is discarded and retried once, then flagged.
 */
import { prisma } from '../db/prisma';
import { AppError } from '../middleware/errorHandler';

/**
 * Asserts that a proposal exists and is APPROVED before any write may proceed.
 * Throws 409 if the guard fails.
 */
export async function assertProposalApproved(proposalId: string): Promise<void> {
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) throw new AppError(404, `Proposal ${proposalId} not found`);
  if (proposal.status !== 'APPROVED') {
    throw new AppError(
      409,
      `Guardrail violation: proposal ${proposalId} must be APPROVED before applying (current: ${proposal.status})`,
    );
  }
}

/**
 * Returns true when a field conflict should be marked as NEEDS_REVIEW
 * rather than automatically resolved.
 *
 * For this prototype, any conflict where the listing value does not match
 * the approved profile and the source of truth is ambiguous triggers review.
 */
export function requiresHumanReview(
  _profileValue: unknown,
  listingValues: unknown[],
): boolean {
  // If all listing values agree but differ from profile → CONFLICTING (profile wins)
  // If listing values disagree with each other → NEEDS_REVIEW
  const unique = new Set(listingValues.map((v) => JSON.stringify(v)));
  return unique.size > 1;
}
