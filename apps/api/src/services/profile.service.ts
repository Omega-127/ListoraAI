/**
 * Profile service.
 * Manages the single BusinessProfile record.
 */
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { recordAudit } from './audit.service';
import { AppError } from '../middleware/errorHandler';
import { normalizePhone } from '../normalization/phone';

export const ProfileUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  regularHours: z.record(z.string(), z.string()).optional(),
  holidayHours: z.record(z.string(), z.string()).optional(),
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

const PROFILE_ID = 'profile-seed-001';

/**
 * Returns the single business profile, or throws 404 if not yet seeded.
 */
export async function getProfile() {
  const profile = await prisma.businessProfile.findUnique({ where: { id: PROFILE_ID } });
  if (!profile) throw new AppError(404, 'Business profile not found. Run db:seed first.');
  return profile;
}

/**
 * Partially updates the business profile and writes an audit entry.
 */
export async function updateProfile(input: ProfileUpdateInput, actor: string) {
  const existing = await getProfile();

  // Normalize phone to E.164 if provided
  let phone = input.phone;
  if (phone) {
    const normalized = normalizePhone(phone);
    if (!normalized) throw new AppError(400, `Invalid phone number: ${phone}`);
    phone = normalized;
  }

  const updated = await prisma.businessProfile.update({
    where: { id: PROFILE_ID },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.address !== undefined && { address: input.address }),
      ...(phone !== undefined && { phone }),
      ...(input.regularHours !== undefined && { regularHours: input.regularHours }),
      ...(input.holidayHours !== undefined && { holidayHours: input.holidayHours }),
    },
  });

  await recordAudit('PROFILE_UPDATED', 'owner', {
    actor,
    before: {
      name: existing.name,
      address: existing.address,
      phone: existing.phone,
    },
    after: {
      name: updated.name,
      address: updated.address,
      phone: updated.phone,
    },
    fields: Object.keys(input),
  });

  return updated;
}
