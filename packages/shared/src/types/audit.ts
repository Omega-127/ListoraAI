/**
 * AuditActor — who or what triggered the audited action.
 */
export type AuditActor = 'owner' | 'agent' | 'system';

/**
 * AuditLog — an immutable record of every write and agent action in the system.
 *
 * Written by audit.service on every:
 * - Profile update
 * - Proposal creation, approval, or rejection
 * - Listing update attempt
 * - Verification run
 * - Agent tool call
 *
 * Records are never deleted. The audit page displays these in reverse chronological order.
 */
export interface AuditLog {
  /** UUID primary key */
  id: string;

  /**
   * Type identifier for the event.
   * Examples: "profile.updated", "proposal.approved", "listing.update.success",
   *           "agent.tool.called", "listing.verify.failed"
   */
  eventType: string;

  /** Who triggered the action */
  actor: AuditActor;

  /**
   * Arbitrary JSON payload with event-specific detail.
   * For agent tool calls, includes tool name, inputs, and outputs.
   * For profile updates, includes the changed fields.
   */
  payload: Record<string, unknown>;

  /** ISO 8601 timestamp (indexed for fast paginated queries) */
  createdAt: string;
}
