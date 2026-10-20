/**
 * Score service.
 * Calculates the listing consistency score:
 *   score = matching eligible fields / total eligible fields × 100
 *
 * Only fields that exist on a listing count toward the denominator.
 * Fields not supported by a platform are excluded from both numerator and denominator.
 */
import { prisma } from '../db/prisma';
import { getProfile } from './profile.service';
import { detectFieldMismatches } from './mismatch.service';

export interface ScoreBreakdown {
  platform: string;
  externalId: string;
  totalEligible: number;
  matching: number;
  score: number;
  fields: Array<{
    field: string;
    status: 'ok' | 'mismatch' | 'missing' | 'unsupported';
  }>;
}

export interface ScoreResult {
  overallScore: number;
  totalEligible: number;
  totalMatching: number;
  platforms: ScoreBreakdown[];
}

export async function calculateScore(): Promise<ScoreResult> {
  const profile = await getProfile();
  const listings = await prisma.listing.findMany();

  const platforms: ScoreBreakdown[] = [];
  let totalEligible = 0;
  let totalMatching = 0;

  for (const listing of listings) {
    const values = listing.values as Record<string, unknown>;
    const fieldResults = detectFieldMismatches(profile, values, listing.fetchedAt);

    const eligible = fieldResults.length; // only fields present in the listing
    const matching = fieldResults.filter((f) => f.kind === 'OK').length;

    totalEligible += eligible;
    totalMatching += matching;

    const score = eligible === 0 ? 0 : Math.round((matching / eligible) * 100);

    platforms.push({
      platform: listing.platform,
      externalId: listing.externalId,
      totalEligible: eligible,
      matching,
      score,
      fields: fieldResults.map((f) => ({
        field: f.field,
        status: f.kind === 'OK' ? 'ok' : f.kind === 'MISSING' ? 'missing' : 'mismatch',
      })),
    });
  }

  const overallScore = totalEligible === 0 ? 0 : Math.round((totalMatching / totalEligible) * 100);

  return { overallScore, totalEligible, totalMatching, platforms };
}
