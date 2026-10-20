/**
 * Scheduled re-check job.
 *
 * Per ARCHITECTURE.md §4.8:
 *   1. Re-fetch all listings from mock platforms
 *   2. Re-run mismatch detection
 *   3. Update alert status (new, resolved, still open)
 *   4. Mark proposals whose listing changed outside the app as needing review
 *
 * Invoked by Render Cron Job: npm run job:recheck
 * Uses the same services as the API — no duplicated logic.
 */
import '../config/env'; // validates env first
import { refreshAllListings } from '../services/listing.service';
import { detectAllMismatches } from '../services/mismatch.service';
import { getAlerts } from '../services/alert.service';
import { recordAudit } from '../services/audit.service';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';

async function runScheduledRecheck() {
  logger.info('Scheduled re-check started');

  try {
    // Step 1: Re-fetch all listings
    const listings = await refreshAllListings();
    logger.info(`Re-fetched ${listings.length} listings`);

    // Step 2: Re-run mismatch detection
    const mismatches = await detectAllMismatches();
    logger.info(`Detected ${mismatches.length} mismatches`);

    // Step 3: Check for proposals whose listing changed unexpectedly
    // (a listing value changed since the proposal was created but wasn't applied by us)
    const pendingProposals = await prisma.proposal.findMany({
      where: { status: 'APPROVED' },
      include: { mismatch: { include: { listing: true } } },
    });

    let changedCount = 0;
    for (const proposal of pendingProposals) {
      const currentListing = proposal.mismatch.listing;
      const currentValues = currentListing.values as Record<string, unknown>;
      const currentFieldValue = currentValues[proposal.field];

      // If the listing value now matches the new proposed value, it may have been
      // changed externally — record this but do not auto-verify.
      if (JSON.stringify(currentFieldValue) === JSON.stringify(proposal.newValue)) {
        changedCount++;
        await recordAudit('LISTING_CHANGED_EXTERNALLY', 'system', {
          proposalId: proposal.id,
          platform: proposal.platform,
          field: proposal.field,
          note: 'Listing value now matches proposal — possible external change. Manual verification recommended.',
        });
      }
    }

    if (changedCount > 0) {
      logger.info(`${changedCount} proposals may be affected by external listing changes`);
    }

    // Step 4: Summarize alerts
    const alerts = await getAlerts();
    logger.info(`Active alerts: ${alerts.length}`);

    await recordAudit('SCHEDULED_RECHECK_COMPLETED', 'system', {
      listingsFetched: listings.length,
      mismatchesDetected: mismatches.length,
      externalChangesDetected: changedCount,
      activeAlerts: alerts.length,
    });

    logger.info('Scheduled re-check completed successfully');
    process.exit(0);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Scheduled re-check failed', { error: message });
    await recordAudit('SCHEDULED_RECHECK_FAILED', 'system', { error: message }).catch(() => {});
    process.exit(1);
  }
}

runScheduledRecheck();
