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
      name: 'The Bombay Roastery & Café',
      address: 'Plot 742, 12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038',
      phone: '+918041234567',
      regularHours: {
        monday: '07:00-22:00',
        tuesday: '07:00-22:00',
        wednesday: '07:00-22:00',
        thursday: '07:00-22:00',
        friday: '07:00-23:00',
        saturday: '08:00-23:00',
        sunday: '08:00-22:00',
      },
      holidayHours: {
        '2026-01-26': 'closed', // Republic Day
        '2026-08-15': 'closed', // Independence Day
        '2026-10-02': 'closed', // Gandhi Jayanti
        '2026-11-08': 'closed', // Diwali
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
        name: 'The Bombay Roastery & Café',
        address: 'Plot 742, 12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038',
        phone: '080 4123 4567',
        regularHours: {
          monday: '08:00-20:00',
          tuesday: '08:00-20:00',
          wednesday: '08:00-20:00',
          thursday: '08:00-20:00',
          friday: '08:00-20:00',
          saturday: '08:00-20:00',
          sunday: '08:00-20:00',
        },
        holidayHours: { '2026-01-26': 'Open Jan 26' },
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
        name: 'Bombay Roastery',
        address: 'Plot 742, 12th Main Rd, HAL 2nd Stage, Bengaluru, Karnataka 560038',
        phone: '080 4123 4567',
        regularHours: 'Mon–Sat 07:00-20:00',
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
        name: 'The Bombay Roastery (Indiranagar)',
        address: 'Plot 742, 12th Main Rd, HAL 2nd Stage, Bangalore 560038',
        phone: '+918041234567',
        regularHours: {
          monday: '07:00-22:00',
          tuesday: '07:00-22:00',
          wednesday: '07:00-22:00',
          thursday: '07:00-22:00',
          friday: '07:00-23:00',
          saturday: '08:00-23:00',
          sunday: '08:00-22:00',
        },
        holidayHours: { '2026-01-26': 'Open Jan 26' },
      },
      fetchedAt: new Date(),
    },
  });
  console.log('✅ Listings seeded: Google Maps (India), Mappls (MapmyIndia), Justdial (India)');

  // 3. Upsert initial mismatches and proposals
  const seedProposals = [
    {
      id: 'prop-1',
      listingId: listingMapsA.id,
      platform: 'mockMapsA',
      field: 'phone',
      oldValue: '080 4123 4567',
      newValue: '+918041234567',
      status: 'PENDING_APPROVAL' as const,
      kind: 'OUTDATED' as const,
      reason: 'Standardize formatting to E.164 canonical telephone protocol (+918041234567).',
    },
    {
      id: 'prop-2',
      listingId: listingMapsB.id,
      platform: 'mockMapsB',
      field: 'regularHours',
      oldValue: 'Mon–Sat 07:00-20:00',
      newValue: {
        monday: '07:00-22:00',
        tuesday: '07:00-22:00',
        wednesday: '07:00-22:00',
        thursday: '07:00-22:00',
        friday: '07:00-23:00',
        saturday: '08:00-23:00',
        sunday: '08:00-22:00',
      },
      status: 'PENDING_APPROVAL' as const,
      kind: 'CONFLICTING' as const,
      reason: 'Weekend and evening operating schedules on Mappls contradict approved canonical hours.',
    },
    {
      id: 'prop-3',
      listingId: listingDirC.id,
      platform: 'mockDirectoryC',
      field: 'name',
      oldValue: 'The Bombay Roastery (Indiranagar)',
      newValue: 'The Bombay Roastery & Café',
      status: 'PENDING_APPROVAL' as const,
      kind: 'CONFLICTING' as const,
      reason: 'Removes local modifier to align with legal branding on Justdial.',
    },
    {
      id: 'prop-4',
      listingId: listingMapsA.id,
      platform: 'mockMapsA',
      field: 'holidayHours',
      oldValue: 'Open Jan 26',
      newValue: { '2026-01-26': 'closed' },
      status: 'APPROVED' as const,
      kind: 'CONFLICTING' as const,
      reason: 'Store is marked closed on Republic Day in canonical profile.',
    },
    {
      id: 'prop-5',
      listingId: listingDirC.id,
      platform: 'mockDirectoryC',
      field: 'address',
      oldValue: 'Plot 742, 12th Main Rd, HAL 2nd Stage, Bangalore 560038',
      newValue: 'Plot 742, 12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038',
      status: 'REJECTED' as const,
      kind: 'NEEDS_REVIEW' as const,
      reason: 'Address abbreviation discrepancy flagged for review before Justdial sync.',
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

  // 4. Seed initial verified customer reviews for publicity and ratings
  try {
    const existingCount = await (prisma as any).review.count();
    if (existingCount === 0) {
      await (prisma as any).review.createMany({
        data: [
          {
            authorName: 'Rohan Sharma',
            authorEmail: 'rohan.s@gmail.com',
            rating: 5,
            accuracyScore: 5,
            reliabilityScore: 5,
            comment: 'Checked their opening hours on Google Maps and arrived at 07:15 AM — open exactly on time! Seamless experience.',
            verified: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18),
          },
          {
            authorName: 'Priya Venkatesh',
            authorEmail: 'priya.v@outlook.com',
            rating: 5,
            accuracyScore: 5,
            reliabilityScore: 5,
            comment: 'Direct phone number listed on Justdial connected right to the manager for reservation. Highly reliable business info!',
            verified: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 42),
          },
          {
            authorName: 'Arjun Nair',
            authorEmail: 'arjun.nair@techcorp.in',
            rating: 5,
            accuracyScore: 5,
            reliabilityScore: 4,
            comment: 'Address on Mappls guided our cab right to the doorstep in Indiranagar. Great to see perfectly verified business listings.',
            verified: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96),
          },
          {
            authorName: 'Ananya Deshmukh',
            authorEmail: 'ananya.d@gmail.com',
            rating: 4,
            accuracyScore: 4,
            reliabilityScore: 5,
            comment: 'Holiday hours were accurately noted for Republic Day. Saved us from making a wasted trip.',
            verified: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 140),
          },
        ],
      });
      console.log('✅ Initial customer reviews seeded (5★ rating showcase)');
    }
  } catch (err: any) {
    console.log('ℹ️ Review model not yet synced, skipping review seed:', err.message);
  }

  // 5. Record seed event in audit log
  await prisma.auditLog.create({
    data: {
      eventType: 'SEED',
      actor: 'system',
      payload: { message: 'Database seeded with sample business profile, listings, mismatches, proposals, and customer reviews.' },
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
