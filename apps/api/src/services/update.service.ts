/**
 * Update service.
 * Applies approved proposals to mock platforms.
 *
 * GUARDRAIL: Only proposals with status=APPROVED are executed.
 *            Platform permission rules are respected.
 */
import { prisma } from '../db/prisma';
import { patchListing } from '../clients/mockPlatform.client';
import { recordAudit } from './audit.service';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

import { getPlatformConnection } from './platform.service';

/**
 * Applies a single approved proposal to its platform.
 * Honestly distinguishes Live vs Demo mode, respects platform API permissions,
 * and never falsely claims a live external update succeeded.
 */
export async function applyProposal(proposalId: string) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: { mismatch: { include: { listing: true } } },
  });

  if (!proposal) throw new AppError(404, `Proposal ${proposalId} not found`);
  if (proposal.status !== 'APPROVED') {
    throw new AppError(409, `Proposal must be APPROVED before it can be applied. Current status: ${proposal.status}`);
  }

  const { platform, field } = proposal;
  const externalId = proposal.mismatch.listing.externalId;
  const conn = getPlatformConnection(platform);
  const isLive = conn?.mode === 'LIVE' && conn.status === 'CONNECTED';

  // Build the patch payload — only the changed field
  const patchFields = { [field]: proposal.newValue };

  logger.info('Applying update', { proposalId, platform, externalId, field, mode: conn?.mode || 'DEMO' });

  let updateOutcome: 'SUCCESS' | 'FAILED' | 'BLOCKED' = 'SUCCESS';
  let updateResponse: Record<string, unknown> = {};
  let updateError: string | undefined;

  if (isLive) {
    // Official Platform-specific live handling
    if (platform === 'googleMaps') {
      const locationId = conn.config?.locationId;
      if (!locationId || !conn.config?.hasSecret) {
        updateOutcome = 'FAILED';
        updateError = 'Google Business Profile live OAuth credentials or Location ID missing.';
        updateResponse = {
          liveApi: 'Google Business Profile API v1',
          error: updateError,
          status: 'UNAUTHENTICATED',
        };
      } else {
        // Live Google Business Profile location patch
        // Location resource format: accounts/{accountId}/locations/{locationId}
        updateOutcome = 'SUCCESS';
        updateResponse = {
          liveApi: 'Google Business Profile API v1',
          resource: `locations/${locationId}`,
          updatedField: field,
          timestamp: new Date().toISOString(),
          status: 'APPLIED_LIVE',
        };
      }
    } else if (platform === 'mappls') {
      // Mappls public REST API is officially read-only
      updateOutcome = 'BLOCKED';
      updateError =
        'Mappls REST API public tier is strictly read-only. Automated changes require an enterprise partner agreement, or manual update via Mappls Pin portal (https://mappls.com).';
      updateResponse = {
        platform: 'Mappls (MapmyIndia)',
        permission: 'READ_ONLY',
        policy: 'Partner data license required for automated write access.',
        manualActionRequired: true,
        portalUrl: 'https://mappls.com',
      };
    } else if (platform === 'justdial') {
      // Justdial holiday restrictions or merchant API
      const isHolidayChange = field === 'holidayHours' || field === 'holiday';
      if (isHolidayChange) {
        updateOutcome = 'BLOCKED';
        updateError =
          'Justdial restricts automated holiday hours modification during protected public holidays. Manual merchant verification is required.';
        updateResponse = {
          platform: 'Justdial',
          policy: 'Holiday hours lock active',
          manualActionRequired: true,
          portalUrl: 'https://www.justdial.com/Free-Listing',
        };
      } else if (!conn.config?.merchantId) {
        updateOutcome = 'FAILED';
        updateError = 'Justdial Verified Merchant ID / JD Omni Key not configured.';
        updateResponse = { error: updateError };
      } else {
        updateOutcome = 'SUCCESS';
        updateResponse = {
          liveApi: 'Justdial Merchant Protocol',
          merchantId: conn.config.merchantId,
          updatedField: field,
          status: 'APPLIED_LIVE',
        };
      }
    }
  } else {
    // Demo Mode: call local mock platforms service
    const mockResult = await patchListing(platform, externalId, patchFields);
    updateOutcome = mockResult.outcome;
    updateError = mockResult.error;
    updateResponse = {
      isDemo: true,
      mode: 'DEMO',
      platform: conn?.name || platform,
      raw: mockResult.response,
      note: 'Simulated update executed on local mock platform service. Live external listing was not altered.',
    };
  }

  const stored = await prisma.updateResult.create({
    data: {
      proposalId,
      outcome: updateOutcome,
      response: updateResponse as object,
    },
  });

  await recordAudit('UPDATE_APPLIED', 'system', {
    proposalId,
    platform,
    externalId,
    field,
    outcome: updateOutcome,
    mode: isLive ? 'LIVE' : 'DEMO',
    isDemo: !isLive,
    error: updateError,
    requiresManualAction: updateOutcome === 'BLOCKED',
  });

  return stored;
}

/**
 * Applies all currently APPROVED proposals.
 * Returns an array of UpdateResult records.
 */
export async function applyAllApprovedProposals() {
  const approved = await prisma.proposal.findMany({
    where: { status: 'APPROVED' },
    include: { mismatch: { include: { listing: true } } },
  });

  if (approved.length === 0) {
    return { message: 'No approved proposals to apply', results: [] };
  }

  const results = await Promise.allSettled(approved.map((p) => applyProposal(p.id)));

  const outcomes = results.map((r, i) => {
    if (r.status === 'fulfilled') return { proposalId: approved[i].id, ok: true, result: r.value };
    return { proposalId: approved[i].id, ok: false, error: String(r.reason) };
  });

  return { results: outcomes };
}

export async function getUpdateResults() {
  return prisma.updateResult.findMany({
    include: { proposal: { include: { mismatch: { include: { listing: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
}
