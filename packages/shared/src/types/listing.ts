/**
 * Listing — a snapshot of a business's data as returned by a mock platform.
 * Fetched via GET /listing/:id on each mock platform.
 */
export interface Listing {
  /** UUID primary key */
  id: string;

  /** Identifier of the platform, e.g. "mockMapsA" | "mockMapsB" | "mockDirectoryC" */
  platform: string;

  /** The listing's ID on the external platform */
  externalId: string;

  /** The raw field values returned by the platform */
  values: ListingValues;

  /** ISO 8601 timestamp of when this snapshot was fetched */
  fetchedAt: string;
}

/**
 * The actual field values stored on a listing.
 * All fields are optional — not every platform supports every field.
 */
export interface ListingValues {
  name?: string;
  address?: string;
  phone?: string;
  website?: string;
  regularHours?: Record<string, unknown>;
  holidayHours?: unknown[];
  description?: string;
  categories?: string[];
  [key: string]: unknown;
}
