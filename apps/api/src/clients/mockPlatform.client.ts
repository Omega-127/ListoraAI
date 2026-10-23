/**
 * HTTP client for mock listing platforms.
 *
 * Each mock platform is mounted at:
 *   <baseUrl>/mock-maps-a
 *   <baseUrl>/mock-maps-b
 *   <baseUrl>/mock-directory-c
 *
 * The client reads GET /listing/:id and PATCH /listing/:id.
 * Handles timeouts, network failures, 403 blocked responses, and invalid payloads.
 */
import { mockPlatformUrls } from '../config/env';
import { logger } from '../utils/logger';

export interface PlatformListing {
  id: string;
  [field: string]: unknown;
}

export interface FetchResult {
  platform: string;
  externalId: string;
  success: boolean;
  data?: PlatformListing;
  error?: string;
}

export interface UpdateResult {
  platform: string;
  externalId: string;
  outcome: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  response?: unknown;
  error?: string;
}

// Platform slug → path segment on the mock server
const PLATFORM_PATHS: Record<string, string> = {
  'mock-maps-a': 'mock-maps-a',
  'mock-maps-b': 'mock-maps-b',
  'mock-directory-c': 'mock-directory-c',
  'mockMapsA': 'mock-maps-a',
  'mockMapsB': 'mock-maps-b',
  'mockDirectoryC': 'mock-directory-c',
  'maps-a': 'mock-maps-a',
  'maps-b': 'mock-maps-b',
  'directory-c': 'mock-directory-c',
};

export const ALL_PLATFORMS = ['mockMapsA', 'mockMapsB', 'mockDirectoryC'];

/** Platform → listing id map used for seeded data */
export const PLATFORM_LISTING_IDS: Record<string, string> = {
  'mock-maps-a': 'listing_001',
  'mock-maps-b': 'listing_002',
  'mock-directory-c': 'listing_003',
  'mockMapsA': 'listing_001',
  'mockMapsB': 'listing_002',
  'mockDirectoryC': 'listing_003',
};

function getBaseUrl(): string {
  const raw = (mockPlatformUrls[0] || 'http://localhost:4100').trim().replace(/\/+$/, '');

  // Already a full URL
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }

  // Render internal hostport format: "hostname:port" or "hostname"
  if (raw.includes('onrender.com')) {
    return `https://${raw}`;
  }

  // Internal Render host without port or dot → add default Render port 10000
  if (!raw.includes('.') && !raw.includes(':')) {
    return `http://${raw}:10000`;
  }

  // host:port (from Render's hostport property)
  return `http://${raw}`;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetches a listing from a named platform.
 */
export async function fetchListing(platform: string, listingId: string): Promise<FetchResult> {
  const pathSegment = PLATFORM_PATHS[platform];
  if (!pathSegment) {
    return { platform, externalId: listingId, success: false, error: `Unknown platform: ${platform}` };
  }

  const url = `${getBaseUrl()}/${pathSegment}/listing/${listingId}`;
  logger.debug(`Fetching listing`, { platform, url });

  try {
    const res = await fetchWithTimeout(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

    if (!res.ok) {
      return {
        platform,
        externalId: listingId,
        success: false,
        error: `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data = (await res.json()) as PlatformListing;
    return { platform, externalId: listingId, success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(`Failed to fetch listing`, { platform, listingId, error: message });
    return { platform, externalId: listingId, success: false, error: message };
  }
}

/**
 * Fetches all known listings from all platforms.
 */
export async function fetchAllListings(): Promise<FetchResult[]> {
  const tasks = ALL_PLATFORMS.map((platform) => fetchListing(platform, PLATFORM_LISTING_IDS[platform]));
  return Promise.all(tasks);
}

/**
 * Sends a PATCH update to a platform listing.
 * Returns BLOCKED when the platform responds with 403.
 */
export async function patchListing(
  platform: string,
  listingId: string,
  fields: Record<string, unknown>,
): Promise<UpdateResult> {
  const pathSegment = PLATFORM_PATHS[platform];
  if (!pathSegment) {
    return { platform, externalId: listingId, outcome: 'FAILED', error: `Unknown platform: ${platform}` };
  }

  const url = `${getBaseUrl()}/${pathSegment}/listing/${listingId}`;
  logger.debug(`Patching listing`, { platform, url, fields });

  try {
    const res = await fetchWithTimeout(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });

    if (res.status === 403) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      return {
        platform,
        externalId: listingId,
        outcome: 'BLOCKED',
        response: body,
        error: body.error ?? 'Blocked by platform',
      };
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as unknown;
      return { platform, externalId: listingId, outcome: 'FAILED', response: body, error: `HTTP ${res.status}` };
    }

    const data = (await res.json()) as unknown;
    return { platform, externalId: listingId, outcome: 'SUCCESS', response: data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(`Patch listing failed`, { platform, listingId, error: message });
    return { platform, externalId: listingId, outcome: 'FAILED', error: message };
  }
}
