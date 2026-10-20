/**
 * ProposalStatus — lifecycle states for an owner-approval proposal.
 * Only APPROVED proposals may trigger an update to a listing platform.
 */
export type ProposalStatus = 'pending_approval' | 'approved' | 'rejected';

/**
 * Proposal — a suggested correction created by the agent for a detected mismatch.
 *
 * The owner must approve a proposal before any listing write is allowed.
 * This is enforced in update.service and in the applyUpdate agent tool.
 */
export interface Proposal {
  /** UUID primary key */
  id: string;

  /** FK → Mismatch.id */
  mismatchId: string;

  /** Target platform identifier, e.g. "mockMapsA" */
  platform: string;

  /** The field to be corrected, e.g. "phone" */
  field: string;

  /**
   * Current value on the listing before the correction.
   * Null if the field is missing on the platform.
   */
  oldValue: unknown | null;

  /** The approved profile value the agent proposes to write */
  newValue: unknown;

  /** Current lifecycle state of this proposal */
  status: ProposalStatus;

  /** ISO 8601 timestamp when the owner approved this proposal */
  approvedAt?: string;

  /** Email or identifier of the owner who approved */
  approvedBy?: string;

  /** ISO 8601 timestamp */
  createdAt: string;
}
