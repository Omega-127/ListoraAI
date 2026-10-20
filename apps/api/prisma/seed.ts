/**
 * Prisma seed script
 * Creates a sample business profile and demo audit entry.
 * Run with: npm run db:seed --workspace apps/api
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Upsert the canonical business profile
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

  // Record the seed in the audit log
  await prisma.auditLog.create({
    data: {
      eventType: 'SEED',
      actor: 'system',
      payload: { message: 'Database seeded with sample business profile.' },
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
