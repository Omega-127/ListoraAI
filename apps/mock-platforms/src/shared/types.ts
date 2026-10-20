/**
 * Shared listing value type used across all mock platforms.
 * Mirrors the ListingValues shape from @bizlisting/shared without importing it
 * (to keep mock-platforms dependency-free from the shared package at runtime).
 */
export interface ListingValues {
  id?: string;
  name?: string;
  address?: string;
  phone?: string;
  website?: string;
  regularHours?: Record<string, unknown>;
  holidayHours?: Record<string, unknown> | unknown[];
  description?: string;
  categories?: string[];
  [key: string]: unknown;
}

export interface PlatformPermissions {
  canRead: boolean;
  canWrite: boolean;
  /** If set, writes are blocked during these date strings (YYYY-MM-DD) */
  blockedDates?: string[];
}

export interface PatchResponse {
  success: boolean;
  listing?: ListingValues;
  error?: string;
  reason?: string;
}
