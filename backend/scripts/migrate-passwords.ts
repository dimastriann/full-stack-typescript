import 'dotenv/config';
import { PrismaClient } from '../prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function migratePasswords() {
  console.log('Starting password migration...');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      password: true,
    },
  });

  let migratedCount = 0;
  let alreadyHashedCount = 0;

  for (const user of users) {
    // Check if password is already hashed (bcrypt hashes start with $2b$ or $2a$)
    const isHashed = user.password.startsWith('$2');

    if (!isHashed) {
      console.log(`Migrating password for user: ${user.email}`);
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      
      migratedCount++;
    } else {
      alreadyHashedCount++;
    }
  }

  console.log(`Migration complete:`);
  console.log(`- Migrated: ${migratedCount} users`);
  console.log(`- Already hashed: ${alreadyHashedCount} users`);

  await prisma.$disconnect();
}

migratePasswords()
  .then(() => {
    console.log('Password migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during password migration:', error);
    process.exit(1);
  });
