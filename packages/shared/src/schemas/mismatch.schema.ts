import { z } from 'zod';

export const MismatchKindEnum = z.enum([
  'missing',
  'outdated',
  'conflicting',
  'needs_review',
  'ok',
]);

export const MismatchSchema = z.object({
  id: z.string().uuid(),
  listingId: z.string().uuid(),
  field: z.string().min(1),
  profileValue: z.unknown(),
  listingValue: z.unknown().nullable(),
  kind: MismatchKindEnum,
  explanation: z.string().optional(),
  createdAt: z.string().datetime(),
});
