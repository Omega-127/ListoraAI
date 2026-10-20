/**
 * Listing service.
 * Fetches listings from mock platforms and persists them to the database.
 */
import { prisma } from '../db/prisma';
import type { Prisma } from '@prisma/client';
import { fetchAllListings, fetchListing } from '../clients/mockPlatform.client';
import { recordAudit } from './audit.service';
import { logger } from '../utils/logger';

/**
 * Fetches all listings from all mock platforms and upserts them in the database.
 * Returns the updated listing records.
 */
export async function refreshAllListings() {
  const results = await fetchAllListings();
  const upserted = [];

  for (const result of results) {
    if (!result.success || !result.data) {
      logger.warn('Failed to fetch listing during refresh', {
        platform: result.platform,
        error: result.error,
      });
      continue;
    }

    const listing = await prisma.listing.upsert({
      where: {
        platform_externalId: {
          platform: result.platform,
          externalId: result.externalId,
        },
      },
      update: {
        values: result.data as Prisma.InputJsonValue,
        fetchedAt: new Date(),
      },
      create: {
        platform: result.platform,
        externalId: result.externalId,
        values: result.data as Prisma.InputJsonValue,
        fetchedAt: new Date(),
      },
    });

    upserted.push(listing);
  }

  await recordAudit('LISTINGS_REFRESHED', 'system', {
    fetched: results.length,
    stored: upserted.length,
    platforms: upserted.map((l) => l.platform),
  });

  return upserted;
}

/**
 * Returns all stored listings from the database.
 */
export async function getAllListings() {
  return prisma.listing.findMany({ orderBy: { platform: 'asc' } });
}

/**
 * Re-fetches a single listing from its platform and updates the database.
 */
export async function refreshSingleListing(platform: string, externalId: string) {
  const result = await fetchListing(platform, externalId);
  if (!result.success || !result.data) {
    return null;
  }

  return prisma.listing.upsert({
    where: { platform_externalId: { platform, externalId } },
    update: { values: result.data as Prisma.InputJsonValue, fetchedAt: new Date() },
    create: {
      platform,
      externalId,
      values: result.data as Prisma.InputJsonValue,
      fetchedAt: new Date(),
    },
  });
}
