/**
 * Alert service.
 * Builds the active alerts list covering:
 *   - Unresolved mismatches
 *   - Pending-approval proposals
 *   - Blocked update results
 *   - Failed update results
 *   - Failed verifications
 */
import { prisma } from '../db/prisma';

export interface Alert {
  id: string;
  type: 'UNRESOLVED_MISMATCH' | 'PENDING_APPROVAL' | 'BLOCKED_UPDATE' | 'FAILED_UPDATE' | 'FAILED_VERIFICATION';
  severity: 'info' | 'warning' | 'error';
  message: string;
  entityId: string;
  createdAt: Date;
}

export async function getAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];

  // 1. Unresolved mismatches
  const mismatches = await prisma.mismatch.findMany({
    where: { resolved: false, kind: { not: 'OK' } },
    include: { listing: true },
    orderBy: { createdAt: 'desc' },
  });
  for (const m of mismatches) {
    alerts.push({
      id: `mismatch-${m.id}`,
      type: 'UNRESOLVED_MISMATCH',
      severity: m.kind === 'NEEDS_REVIEW' ? 'warning' : 'info',
      message: `${m.kind} on field '${m.field}' for ${m.listing.platform} (${m.listing.externalId})`,
      entityId: m.id,
      createdAt: m.createdAt,
    });
  }

  // 2. Pending-approval proposals
  const pending = await prisma.proposal.findMany({
    where: { status: 'PENDING_APPROVAL' },
    include: { mismatch: { include: { listing: true } } },
    orderBy: { createdAt: 'desc' },
  });
  for (const p of pending) {
    alerts.push({
      id: `proposal-${p.id}`,
      type: 'PENDING_APPROVAL',
      severity: 'warning',
      message: `Proposal pending approval: update '${p.field}' on ${p.platform}`,
      entityId: p.id,
      createdAt: p.createdAt,
    });
  }

  // 3. Blocked updates
  const blocked = await prisma.updateResult.findMany({
    where: { outcome: 'BLOCKED' },
    include: { proposal: { include: { mismatch: { include: { listing: true } } } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  for (const u of blocked) {
    alerts.push({
      id: `update-blocked-${u.id}`,
      type: 'BLOCKED_UPDATE',
      severity: 'warning',
      message: `Update blocked on ${u.proposal.platform} for field '${u.proposal.field}'`,
      entityId: u.id,
      createdAt: u.createdAt,
    });
  }

  // 4. Failed updates
  const failed = await prisma.updateResult.findMany({
    where: { outcome: 'FAILED' },
    include: { proposal: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  for (const u of failed) {
    alerts.push({
      id: `update-failed-${u.id}`,
      type: 'FAILED_UPDATE',
      severity: 'error',
      message: `Update failed on ${u.proposal.platform} for field '${u.proposal.field}'`,
      entityId: u.id,
      createdAt: u.createdAt,
    });
  }

  // 5. Failed verifications
  const failedVerify = await prisma.verification.findMany({
    where: { status: 'FAILED' },
    include: { proposal: true },
    orderBy: { checkedAt: 'desc' },
    take: 20,
  });
  for (const v of failedVerify) {
    alerts.push({
      id: `verify-failed-${v.id}`,
      type: 'FAILED_VERIFICATION',
      severity: 'error',
      message: `Verification failed for proposal ${v.proposalId} on ${v.proposal.platform}`,
      entityId: v.id,
      createdAt: v.checkedAt,
    });
  }

  return alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
