import { z } from 'zod';

const DayHoursSchema = z.object({
  open: z.boolean(),
  openTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format')
    .optional(),
  closeTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format')
    .optional(),
});

const RegularHoursSchema = z.object({
  monday: DayHoursSchema,
  tuesday: DayHoursSchema,
  wednesday: DayHoursSchema,
  thursday: DayHoursSchema,
  friday: DayHoursSchema,
  saturday: DayHoursSchema,
  sunday: DayHoursSchema,
});

const HolidayHoursSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  label: z.string().min(1).max(100),
  closed: z.boolean(),
  openTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  closeTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

/** Full BusinessProfile schema (includes server-generated fields) */
export const BusinessProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  address: z.string().min(1).max(500),
  phone: z
    .string()
    .regex(/^\+\d{7,15}$/, 'Phone must be in E.164 format, e.g. +15550102234'),
  regularHours: RegularHoursSchema,
  holidayHours: z.array(HolidayHoursSchema),
  updatedAt: z.string().datetime(),
});

/** Schema for PUT /profile request body — omits server-generated fields */
export const UpdateProfileSchema = BusinessProfileSchema.omit({
  id: true,
  updatedAt: true,
});

export type BusinessProfileInput = z.infer<typeof UpdateProfileSchema>;
