/**
 * Prisma seed script
 * Creates a sample business profile, initial listings, mismatches, and proposals.
 * Run with: npm run db:seed --workspace apps/api
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Upsert the canonical business profile
  const profile = await prisma.businessProfile.upsert({
    where: { id: 'profile-seed-001' },
    update: {},
    create: {
      id: 'profile-seed-001',
      name: 'Brew & Bloom Café',
      address: '42 Maple Street, Springfield, IL 62701',
      phone: '+15550102234',
      regularHours: {
        monday: '07:00-18:00',
        tuesday: '07:00-18:00',
        wednesday: '07:00-18:00',
        thursday: '07:00-18:00',
        friday: '07:00-20:00',
        saturday: '08:00-20:00',
        sunday: '09:00-16:00',
      },
      holidayHours: {
        '2026-12-25': 'closed',
        '2026-01-01': 'closed',
      },
    },
  });
  console.log(`✅ Business profile seeded: ${profile.name}`);

  // 2. Upsert initial listings
  const listingMapsA = await prisma.listing.upsert({
    where: { platform_externalId: { platform: 'mockMapsA', externalId: 'listing_001' } },
    update: {},
    create: {
      platform: 'mockMapsA',
      externalId: 'listing_001',
      values: {
        name: 'Brew & Bloom Café',
        address: '42 Maple Street, Springfield, IL 62701',
        phone: '(555) 010-2234',
        regularHours: {
          monday: '07:00-18:00',
          tuesday: '07:00-18:00',
          wednesday: '07:00-18:00',
          thursday: '07:00-18:00',
          friday: '07:00-20:00',
          saturday: '08:00-20:00',
          sunday: '09:00-16:00',
        },
        holidayHours: { '2026-12-25': 'Open Dec 25' },
      },
      fetchedAt: new Date(),
    },
  });

  const listingMapsB = await prisma.listing.upsert({
    where: { platform_externalId: { platform: 'mockMapsB', externalId: 'listing_002' } },
    update: {},
    create: {
      platform: 'mockMapsB',
      externalId: 'listing_002',
      values: {
        name: 'Brew & Bloom Café',
        address: '42 Maple St, Springfield, IL 62701',
        phone: '(555) 010-2234',
        regularHours: 'Mon–Sat 7–5',
        holidayHours: {},
      },
      fetchedAt: new Date(),
    },
  });

  const listingDirC = await prisma.listing.upsert({
    where: { platform_externalId: { platform: 'mockDirectoryC', externalId: 'listing_003' } },
    update: {},
    create: {
      platform: 'mockDirectoryC',
      externalId: 'listing_003',
      values: {
        name: 'Bella Cucina (Downtown)',
        address: '42 Maple St Suite B',
        phone: '555-010-2234',
        regularHours: {
          monday: '7am-6pm',
          tuesday: '7am-6pm',
          wednesday: '7am-6pm',
          thursday: '7am-6pm',
          friday: '7am-8pm',
          saturday: '8am-8pm',
          sunday: '9am-4pm',
        },
        holidayHours: { '2026-12-25': 'closed' },
      },
      fetchedAt: new Date(),
    },
  });
  console.log('✅ Listings seeded: mockMapsA, mockMapsB, mockDirectoryC');

  // 3. Upsert initial mismatches and proposals
  const seedProposals = [
    {
      id: 'prop-1',
      listingId: listingMapsA.id,
      platform: 'mockMapsA',
      field: 'phone',
      oldValue: '(555) 010-2234',
      newValue: '+15550102234',
      status: 'PENDING_APPROVAL' as const,
      kind: 'OUTDATED' as const,
      reason: 'Standardize formatting to E.164 canonical telephone protocol.',
    },
    {
      id: 'prop-2',
      listingId: listingMapsB.id,
      platform: 'mockMapsB',
      field: 'regularHours',
      oldValue: 'Mon–Sat 7–5',
      newValue: {
        monday: '07:00-18:00',
        tuesday: '07:00-18:00',
        wednesday: '07:00-18:00',
        thursday: '07:00-18:00',
        friday: '07:00-20:00',
        saturday: '08:00-20:00',
        sunday: '09:00-16:00',
      },
      status: 'PENDING_APPROVAL' as const,
      kind: 'CONFLICTING' as const,
      reason: 'Saturday and Sunday operating schedules contradict approved hours.',
    },
    {
      id: 'prop-3',
      listingId: listingDirC.id,
      platform: 'mockDirectoryC',
      field: 'name',
      oldValue: 'Bella Cucina (Downtown)',
      newValue: 'Brew & Bloom Café',
      status: 'PENDING_APPROVAL' as const,
      kind: 'CONFLICTING' as const,
      reason: 'Removes unauthorized location qualifier to align with legal branding.',
    },
    {
      id: 'prop-4',
      listingId: listingMapsA.id,
      platform: 'mockMapsA',
      field: 'holidayHours',
      oldValue: 'Open Dec 25',
      newValue: { '2026-12-25': 'closed' },
      status: 'APPROVED' as const,
      kind: 'CONFLICTING' as const,
      reason: 'Store is marked closed on Christmas Day in canonical profile.',
    },
    {
      id: 'prop-5',
      listingId: listingDirC.id,
      platform: 'mockDirectoryC',
      field: 'address',
      oldValue: '42 Maple St Suite B',
      newValue: '42 Maple Street, Springfield, IL 62701',
      status: 'REJECTED' as const,
      kind: 'NEEDS_REVIEW' as const,
      reason: 'Suite unit discrepancy flagged as unsafe without human verification.',
    },
  ];

  for (const item of seedProposals) {
    const mismatch = await prisma.mismatch.upsert({
      where: { id: `mismatch-${item.id}` },
      update: {},
      create: {
        id: `mismatch-${item.id}`,
        listingId: item.listingId,
        field: item.field,
        profileValue: item.newValue as any,
        listingValue: item.oldValue as any,
        kind: item.kind,
        explanation: item.reason,
      },
    });

    await prisma.proposal.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        mismatchId: mismatch.id,
        platform: item.platform,
        field: item.field,
        oldValue: item.oldValue as any,
        newValue: item.newValue as any,
        status: item.status,
        approvedAt: item.status === 'APPROVED' ? new Date() : null,
        approvedBy: item.status === 'APPROVED' ? 'owner' : null,
        rejectedAt: item.status === 'REJECTED' ? new Date() : null,
      },
    });
  }
  console.log('✅ Initial proposals and mismatches seeded (prop-1 to prop-5)');

  // 4. Record seed event in audit log
  await prisma.auditLog.create({
    data: {
      eventType: 'SEED',
      actor: 'system',
      payload: { message: 'Database seeded with sample business profile, listings, mismatches, and proposals.' },
    },
  });

  console.log('✅ Audit log entry created');
  console.log('🎉 Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
