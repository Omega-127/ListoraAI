import { z } from 'zod';

export const AuditActorEnum = z.enum(['owner', 'agent', 'system']);

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  eventType: z.string().min(1),
  actor: AuditActorEnum,
  payload: z.record(z.unknown()),
  createdAt: z.string().datetime(),
});
