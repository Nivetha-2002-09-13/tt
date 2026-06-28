import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── ADMIN ─────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tabletennis.com' },
    update: {},
    create: {
      email: 'admin@tabletennis.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+94771234567',
      role: 'ADMIN',
      isSuperAdmin: true,
      adminProfile: {
        create: {
          department: 'Tournament Management',
        },
      },
    },
  });
  console.log('✅ Admin created:', admin.email);

  // ── REFEREE ───────────────────────────────────────────────────
  const refereePassword = await bcrypt.hash('referee123', 10);
  const referee = await prisma.user.upsert({
    where: { email: 'referee@tabletennis.com' },
    update: {},
    create: {
      email: 'referee@tabletennis.com',
      password: refereePassword,
      firstName: 'Referee',
      lastName: 'User',
      phone: '+94771234568',
      role: 'REFEREE',
      refereeProfile: {
        create: {
          certification: 'ITTF Level 2',
          experienceYears: 5,
        },
      },
    },
  });
  console.log('✅ Referee created:', referee.email);

  console.log('\n✅ Seeding completed!');
  console.log('─'.repeat(45));
  console.log('Admin:    admin@tabletennis.com   / admin123');
  console.log('Referee:  referee@tabletennis.com / referee123');
  console.log('─'.repeat(45));
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });