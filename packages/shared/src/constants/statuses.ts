// Status constants shared between api and web

export const MISMATCH_KIND = {
  MISSING: 'MISSING',
  OUTDATED: 'OUTDATED',
  CONFLICTING: 'CONFLICTING',
  NEEDS_REVIEW: 'NEEDS_REVIEW',
  OK: 'OK',
} as const;

export type MismatchKind = (typeof MISMATCH_KIND)[keyof typeof MISMATCH_KIND];

export const PROPOSAL_STATUS = {
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type ProposalStatus = (typeof PROPOSAL_STATUS)[keyof typeof PROPOSAL_STATUS];

export const UPDATE_OUTCOME = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  BLOCKED: 'BLOCKED',
} as const;

export type UpdateOutcome = (typeof UPDATE_OUTCOME)[keyof typeof UPDATE_OUTCOME];

export const VERIFICATION_STATUS = {
  VERIFIED: 'VERIFIED',
  PENDING: 'PENDING',
  FAILED: 'FAILED',
  BLOCKED: 'BLOCKED',
} as const;

export type VerificationStatus = (typeof VERIFICATION_STATUS)[keyof typeof VERIFICATION_STATUS];
