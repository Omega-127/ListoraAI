/**
 * Mismatch service.
 * Compares stored listings against the approved profile and creates Mismatch records.
 *
 * Classification (per ARCHITECTURE.md §4.3):
 *   MISSING      — listing value is empty/null
 *   OUTDATED     — listing is older than the profile's last update
 *   CONFLICTING  — values differ and profile is the source of truth
 *   NEEDS_REVIEW — values differ and the source of truth is unclear (no auto-fix)
 *   OK           — values match after normalization
 */
import { MismatchKind } from '@bizlisting/shared';
import { prisma } from '../db/prisma';
import { getProfile } from './profile.service';
import { normalizePhone, phonesMatch } from '../normalization/phone';
import { textsMatch } from '../normalization/text';
import { hoursMatch, holidaysMatch } from '../normalization/hours';
import { recordAudit } from './audit.service';

type ListingValues = Record<string, unknown>;

interface FieldMismatch {
  field: string;
  profileValue: unknown;
  listingValue: unknown;
  kind: MismatchKind;
}

function isEmptyValue(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string' && (v.trim() === '' || v.trim() === '—')) return true;
  if (typeof v === 'object' && Object.keys(v as object).length === 0) return true;
  return false;
}

function classifyField(
  field: string,
  profileValue: unknown,
  listingValue: unknown,
  profileUpdatedAt: Date,
  listingFetchedAt: Date,
): MismatchKind {
  if (isEmptyValue(profileValue) && isEmptyValue(listingValue)) return 'OK';
  if (isEmptyValue(listingValue)) return 'MISSING';

  // Field-specific comparison
  let matches = false;

  if (field === 'phone') {
    matches = phonesMatch(String(profileValue), String(listingValue));
  } else if (field === 'regularHours') {
    matches = hoursMatch(
      profileValue as Record<string, string>,
      listingValue as Record<string, string>,
    );
  } else if (field === 'holidayHours') {
    matches = holidaysMatch(profileValue, listingValue);
  } else {
    // name, address — text normalization
    matches = textsMatch(String(profileValue), String(listingValue));
  }

  if (matches) return 'OK';

  // If listing is older than the last profile update → OUTDATED
  if (listingFetchedAt < profileUpdatedAt) return 'OUTDATED';

  // Values differ and profile is authoritative for these fields → CONFLICTING
  return 'CONFLICTING';
}

/**
 * Runs mismatch detection for all stored listings vs the approved profile.
 * Deletes old mismatches for each listing and creates fresh ones.
 * Returns newly created Mismatch records.
 */
export async function detectAllMismatches() {
  const profile = await getProfile();
  const listings = await prisma.listing.findMany();

  const allMismatches = [];

  for (const listing of listings) {
    const values = listing.values as ListingValues;
    const fieldMismatches = detectFieldMismatches(profile, values, listing.fetchedAt, { checkAllFields: true });

    // Clear previous mismatches for this listing
    await prisma.mismatch.deleteMany({ where: { listingId: listing.id } });

    // Insert fresh mismatches (including OK for bookkeeping is optional; only non-OK stored)
    const nonOk = fieldMismatches.filter((fm) => fm.kind !== 'OK');

    for (const fm of nonOk) {
      const mismatch = await prisma.mismatch.create({
        data: {
          listingId: listing.id,
          field: fm.field,
          profileValue: fm.profileValue as object,
          listingValue: fm.listingValue as object | undefined,
          kind: fm.kind,
        },
      });
      allMismatches.push(mismatch);
    }
  }

  await recordAudit('MISMATCHES_DETECTED', 'system', {
    total: allMismatches.length,
    byKind: allMismatches.reduce<Record<string, number>>((acc, m) => {
      acc[m.kind] = (acc[m.kind] ?? 0) + 1;
      return acc;
    }, {}),
  });

  return allMismatches;
}

/**
 * Compares profile fields against listing values for a single listing.
 * Returns an array of FieldMismatch results.
 */
export function detectFieldMismatches(
  profile: { name: string; address: string; phone: string; regularHours: unknown; holidayHours: unknown; updatedAt: Date },
  values: ListingValues,
  listingFetchedAt: Date,
  options?: { checkAllFields?: boolean },
): FieldMismatch[] {
  const profileFieldMap: Record<string, unknown> = {
    name: profile.name,
    address: profile.address,
    phone: profile.phone,
    regularHours: profile.regularHours,
    holidayHours: profile.holidayHours,
  };

  const fieldsToCheck = options?.checkAllFields
    ? ['name', 'address', 'phone', 'regularHours', 'holidayHours']
    : Object.keys(values);

  const results: FieldMismatch[] = [];

  for (const key of fieldsToCheck) {
    if (!(key in profileFieldMap)) continue;
    const profileValue = profileFieldMap[key];
    const listingValue = key in values ? values[key] : undefined;
    const kind = classifyField(key, profileValue, listingValue, profile.updatedAt, listingFetchedAt);
    results.push({ field: key, profileValue, listingValue, kind });
  }

  return results;
}

/**
 * Returns all stored mismatches, optionally filtered.
 */
export async function getMismatches(options?: { listingId?: string; kind?: MismatchKind; resolved?: boolean }) {
  return prisma.mismatch.findMany({
    where: {
      ...(options?.listingId && { listingId: options.listingId }),
      ...(options?.kind && { kind: options.kind }),
      ...(options?.resolved !== undefined && { resolved: options.resolved }),
    },
    include: { listing: true, proposals: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Returns a single mismatch by id.
 */
export async function getMismatchById(id: string) {
  return prisma.mismatch.findUnique({
    where: { id },
    include: { listing: true, proposals: { include: { updateResults: true, verifications: true } } },
  });
}

/**
 * Marks a mismatch as resolved.
 */
export async function resolveMismatch(id: string) {
  return prisma.mismatch.update({ where: { id }, data: { resolved: true } });
}

// Re-export normalizePhone so other modules can use it
export { normalizePhone };
