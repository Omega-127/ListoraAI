/**
 * Status constants shared between the API and frontend.
 * These values mirror the Prisma enums in the database layer.
 */

/** Verification statuses for listings after an update is applied */
export const STATUSES = {
  VERIFIED: 'verified',
  PENDING: 'pending',
  FAILED: 'failed',
  BLOCKED: 'blocked',
} as const;

export type Status = (typeof STATUSES)[keyof typeof STATUSES];

/** Classification of a detected mismatch between profile and listing */
export const MISMATCH_KINDS = {
  MISSING: 'missing',
  OUTDATED: 'outdated',
  CONFLICTING: 'conflicting',
  NEEDS_REVIEW: 'needs_review',
  OK: 'ok',
} as const;

export type MismatchKindValue = (typeof MISMATCH_KINDS)[keyof typeof MISMATCH_KINDS];

/** Lifecycle statuses for an owner-approval proposal */
export const PROPOSAL_STATUSES = {
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type ProposalStatusValue = (typeof PROPOSAL_STATUSES)[keyof typeof PROPOSAL_STATUSES];

/** Outcomes when the agent attempts to push an update to a mock platform */
export const UPDATE_OUTCOMES = {
  SUCCESS: 'success',
  FAILED: 'failed',
  BLOCKED: 'blocked',
} as const;

export type UpdateOutcomeValue = (typeof UPDATE_OUTCOMES)[keyof typeof UPDATE_OUTCOMES];

/** Verification outcome after re-reading a listing post-update */
export const VERIFICATION_STATUSES = {
  VERIFIED: 'verified',
  PENDING: 'pending',
  FAILED: 'failed',
  BLOCKED: 'blocked',
} as const;

export type VerificationStatusValue =
  (typeof VERIFICATION_STATUSES)[keyof typeof VERIFICATION_STATUSES];
