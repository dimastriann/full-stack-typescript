import { PrismaClient, PlanLevel } from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? '',
});
const prisma = new PrismaClient({ adapter });

// ─────────────────────────────────────────────
// Plan Feature Limits
// -1 = unlimited
// ─────────────────────────────────────────────
const PLAN_LIMITS: Record<
  PlanLevel,
  { maxProjects: number; maxMembers: number; maxStorageGb: number }
> = {
  FREE: { maxProjects: 5, maxMembers: 10, maxStorageGb: 2 },
  PRO: { maxProjects: -1, maxMembers: -1, maxStorageGb: 20 },
  ENTERPRISE: { maxProjects: -1, maxMembers: -1, maxStorageGb: 100 },
  CUSTOM: { maxProjects: -1, maxMembers: -1, maxStorageGb: -1 },
};

async function seedPlanLimits() {
  console.log('🌱 Seeding plan feature limits...');
  for (const [level, limits] of Object.entries(PLAN_LIMITS)) {
    await prisma.planFeatureLimit.upsert({
      where: { planLevel: level as PlanLevel },
      update: limits,
      create: { planLevel: level as PlanLevel, ...limits },
    });
    console.log(`   ✅ ${level}: projects=${limits.maxProjects}, members=${limits.maxMembers}, storage=${limits.maxStorageGb}GB`);
  }
}

async function seedSuperadmin() {
  console.log('🌱 Seeding superadmin user...');

  const email = process.env.SUPERADMIN_EMAIL ?? 'superadmin@app.com';
  const password = process.env.SUPERADMIN_PASSWORD ?? 'SuperAdmin@123!';

  const superadmin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: 'Super Admin',
      email,
      password: await bcrypt.hash(password, 12),
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPERADMIN',
    },
  });

  console.log(`   ✅ Superadmin ready: ${superadmin.email}`);
  return superadmin;
}

async function seedDemoUsers() {
  console.log('🌱 Seeding demo users...');

  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@gmail.com',
      password: await bcrypt.hash('admin', 10),
      firstName: 'Dimas',
      lastName: 'User Flow',
      birthDate: new Date('1996-07-03'),
      role: 'ADMIN',
      gender: 'Male',
    },
  });

  await prisma.user.upsert({
    where: { email: 'demo@gmail.com' },
    update: {},
    create: {
      name: 'Demo',
      email: 'demo@gmail.com',
      password: await bcrypt.hash('demo', 10),
      firstName: 'Demo',
      lastName: 'User Flow',
      birthDate: new Date('2000-07-03'),
      role: 'USER',
      gender: 'Male',
    },
  });

  console.log('   ✅ Demo users ready (admin@gmail.com, demo@gmail.com)');
}

async function main() {
  console.log('\n🚀 Starting database seed...\n');
  await seedPlanLimits();
  await seedSuperadmin();
  await seedDemoUsers();
  console.log('\n✨ Seed completed successfully!\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });