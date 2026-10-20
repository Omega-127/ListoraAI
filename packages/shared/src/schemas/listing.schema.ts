import { z } from 'zod';

export const ListingValuesSchema = z
  .object({
    name: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().url().optional(),
    regularHours: z.record(z.unknown()).optional(),
    holidayHours: z.array(z.unknown()).optional(),
    description: z.string().optional(),
    categories: z.array(z.string()).optional(),
  })
  .catchall(z.unknown());

export const ListingSchema = z.object({
  id: z.string().uuid(),
  platform: z.string().min(1),
  externalId: z.string().min(1),
  values: ListingValuesSchema,
  fetchedAt: z.string().datetime(),
});

export type ListingInput = z.infer<typeof ListingValuesSchema>;
