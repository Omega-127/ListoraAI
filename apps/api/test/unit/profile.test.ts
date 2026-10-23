/**
 * Integration tests for the profile update lifecycle.
 *
 * These tests use Prisma mocking (vi.spyOn) so they run without a real database.
 * They verify:
 *   1. getProfile() auto-creates the profile if it doesn't exist
 *   2. updateProfile() saves all fields to the database
 *   3. updateProfile() normalizes phone to E.164
 *   4. updateProfile() rejects invalid phone numbers (400)
 *   5. updateProfile() records an audit log entry
 *   6. Subsequent getProfile() returns the updated values
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../src/db/prisma';

// We import after setting up mocks
import { getProfile, updateProfile } from '../../src/services/profile.service';

const BASE_PROFILE = {
  id: 'profile-seed-001',
  name: 'Brew & Bloom Café',
  address: '42 Maple Street, Springfield, IL 62701',
  phone: '+15550102234',
  regularHours: { monday: '07:00-18:00', friday: '07:00-20:00' },
  holidayHours: { '2026-12-25': 'closed' },
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};
describe('Profile service — getProfile()', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the profile when it exists', async () => {
    vi.spyOn(prisma.businessProfile, 'upsert').mockResolvedValue(BASE_PROFILE as any);

    const profile = await getProfile();
    expect(profile.id).toBe('profile-seed-001');
    expect(profile.name).toBe('Brew & Bloom Café');
    expect(profile.phone).toBe('+15550102234');
  });

  it('auto-creates the profile on first call (upsert semantics)', async () => {
    const upsertSpy = vi.spyOn(prisma.businessProfile, 'upsert').mockResolvedValue(BASE_PROFILE as any);

    await getProfile();

    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'profile-seed-001' },
        create: expect.objectContaining({ id: 'profile-seed-001', name: 'Brew & Bloom Café' }),
      }),
    );
  });
});

describe('Profile service — updateProfile()', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // getProfile() calls upsert internally
    vi.spyOn(prisma.businessProfile, 'upsert').mockResolvedValue(BASE_PROFILE as any);
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);
  });

  it('saves name update to the database', async () => {
    const updatedProfile = { ...BASE_PROFILE, name: 'Brew & Bloom Coffee' };
    const updateSpy = vi.spyOn(prisma.businessProfile, 'update').mockResolvedValue(updatedProfile as any);

    const result = await updateProfile({ name: 'Brew & Bloom Coffee' }, 'owner@test.com');

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'profile-seed-001' },
        data: expect.objectContaining({ name: 'Brew & Bloom Coffee' }),
      }),
    );
    expect(result.name).toBe('Brew & Bloom Coffee');
  });

  it('normalizes phone to E.164 before saving', async () => {
    const updatedProfile = { ...BASE_PROFILE, phone: '+15550102234' };
    const updateSpy = vi.spyOn(prisma.businessProfile, 'update').mockResolvedValue(updatedProfile as any);

    const result = await updateProfile({ phone: '(555) 010-2234' }, 'owner@test.com');

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ phone: '+15550102234' }),
      }),
    );
    expect(result.phone).toBe('+15550102234');
  });

  it('rejects invalid phone numbers with a 400 error', async () => {
    vi.spyOn(prisma.businessProfile, 'update').mockResolvedValue(BASE_PROFILE as any);

    await expect(updateProfile({ phone: 'not-a-phone' }, 'owner@test.com')).rejects.toThrow(
      /Invalid phone number/i,
    );
  });

  it('saves address update and writes audit log', async () => {
    const newAddress = '100 Oak Avenue, Chicago, IL 60601';
    const updatedProfile = { ...BASE_PROFILE, address: newAddress };
    vi.spyOn(prisma.businessProfile, 'update').mockResolvedValue(updatedProfile as any);
    const auditSpy = vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

    await updateProfile({ address: newAddress }, 'owner@test.com');

    expect(auditSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: 'PROFILE_UPDATED',
          actor: 'owner',
        }),
      }),
    );
  });

  it('saves regularHours update', async () => {
    const newHours = { monday: '08:00-17:00', friday: '08:00-19:00' };
    const updatedProfile = { ...BASE_PROFILE, regularHours: newHours };
    const updateSpy = vi.spyOn(prisma.businessProfile, 'update').mockResolvedValue(updatedProfile as any);

    await updateProfile({ regularHours: newHours }, 'owner@test.com');

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ regularHours: newHours }),
      }),
    );
  });

  it('saves holidayHours update', async () => {
    const newHolidays = { '2026-12-25': 'closed', '2026-12-31': '10:00-14:00' };
    const updatedProfile = { ...BASE_PROFILE, holidayHours: newHolidays };
    vi.spyOn(prisma.businessProfile, 'update').mockResolvedValue(updatedProfile as any);

    const result = await updateProfile({ holidayHours: newHolidays }, 'owner@test.com');

    expect(result.holidayHours).toEqual(newHolidays);
  });

  it('only updates provided fields (partial update)', async () => {
    const updateSpy = vi.spyOn(prisma.businessProfile, 'update').mockResolvedValue(BASE_PROFILE as any);

    await updateProfile({ name: 'New Name' }, 'owner@test.com');

    // Only 'name' should be in data — no address, phone, etc.
    const calledWith = updateSpy.mock.calls[0][0];
    expect(calledWith.data).toHaveProperty('name', 'New Name');
    expect(calledWith.data).not.toHaveProperty('address');
    expect(calledWith.data).not.toHaveProperty('phone');
    expect(calledWith.data).not.toHaveProperty('regularHours');
    expect(calledWith.data).not.toHaveProperty('holidayHours');
  });
});

describe('Profile service — full lifecycle (fetch → update → re-fetch)', () => {
  it('returns the updated value on subsequent fetch after profile update', async () => {
    const original = { ...BASE_PROFILE };
    const updated = { ...BASE_PROFILE, name: 'Brew & Bloom Roastery' };

    // First call: getProfile returns original
    // Second call: getProfile (inside updateProfile) returns original for audit
    // updateProfile: returns updated
    // Third call: getProfile after update returns updated

    let callCount = 0;
    vi.spyOn(prisma.businessProfile, 'upsert').mockImplementation(async () => {
      callCount++;
      return callCount >= 3 ? (updated as any) : (original as any);
    });
    vi.spyOn(prisma.businessProfile, 'update').mockResolvedValue(updated as any);
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

    const beforeUpdate = await getProfile();
    expect(beforeUpdate.name).toBe('Brew & Bloom Café');

    await updateProfile({ name: 'Brew & Bloom Roastery' }, 'owner@test.com');

    const afterUpdate = await getProfile();
    expect(afterUpdate.name).toBe('Brew & Bloom Roastery');
  });
});
