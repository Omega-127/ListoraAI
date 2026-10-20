/**
 * MismatchKind — the four possible classifications for a detected discrepancy.
 */
export type MismatchKind = 'missing' | 'outdated' | 'conflicting' | 'needs_review' | 'ok';

/**
 * Mismatch — a detected discrepancy between an approved profile field
 * and the corresponding value on a listing platform.
 *
 * Created by mismatch.service after normalization and comparison.
 * A mismatch of kind "needs_review" is NEVER auto-resolved by the agent.
 */
export interface Mismatch {
  /** UUID primary key */
  id: string;

  /** FK → Listing.id */
  listingId: string;

  /** Name of the field that mismatches, e.g. "phone" | "address" | "name" */
  field: string;

  /**
   * The approved value from the BusinessProfile for this field.
   * Stored as JSON to support structured values (hours, arrays).
   */
  profileValue: unknown;

  /**
   * The current value on the listing, if present.
   * Null for MISSING mismatches.
   */
  listingValue: unknown | null;

  /** Classification of why the values differ */
  kind: MismatchKind;

  /**
   * Optional AI-generated explanation of why this mismatch matters.
   * Populated by the conflict investigator agent.
   */
  explanation?: string;

  /** ISO 8601 timestamp */
  createdAt: string;
}
