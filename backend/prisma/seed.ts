import { PrismaClient } from "./generated/client";
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? '',
});
const prisma = new PrismaClient({ adapter });
async function main() {
  const admin = await prisma.user.upsert({
		where: {email: 'admin@gmail.com'},
    update: {},
    create: {
      name: "Admin",
      email: "admin@gmail.com",
      password: await bcrypt.hash("admin", 10),
      firstName: "Dimas",
      lastName: "User Flow",
      birthDate: new Date("1996-07-03 00:00:00"),
      role: 'ADMIN',
      gender: 'Male'
    }
  })
  const demo = await prisma.user.upsert({
		where: {email: 'demo@gmail.com'},
    update: {},
    create: {
      name: "Demo",
      email: "demo@gmail.com",
      password: await bcrypt.hash("demo", 10),
      firstName: "Demo",
      lastName: "User Flow",
      birthDate: new Date("2000-07-03 00:00:00"),
      role: 'MANAGER',
      gender: 'Male'
    }
  })
  // console.log({ admin, demo })
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })