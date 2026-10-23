/**
 * Audit service — writes entries to the AuditLog table.
 * Called by every write operation and agent action.
 */
import { prisma } from '../db/prisma';
import type { Prisma } from '@prisma/client';


import { logger } from '../utils/logger';

export type AuditActor = 'owner' | 'agent' | 'system' | 'viewer';

export async function recordAudit(eventType: string, actor: AuditActor, payload: Record<string, unknown>) {
  try {
    return await prisma.auditLog.create({
      data: { eventType, actor, payload: payload as Prisma.InputJsonValue },
    });
  } catch (err) {
    logger.warn('Failed to record audit log', { eventType, error: (err as Error).message });
    return null;
  }
}

export async function getAuditLog(options?: {
  page?: number;
  pageSize?: number;
  eventType?: string;
}) {
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.min(100, options?.pageSize ?? 20);
  const skip = (page - 1) * pageSize;

  const where = options?.eventType ? { eventType: options.eventType } : {};

  const [records, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { records, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
