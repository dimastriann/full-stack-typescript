import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const admin = await prisma.user.upsert({
		where: {email: 'admin@gmail.com'},
		update: {},
		create: {
			name: "Admin",
      email: "admin@gmail.com",
      password: "admin",
      firstName: "Dimas",
      lastName: "Admin",
      birthDate: "1996-07-03",
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
      password: "admin",
      firstName: "Demo",
      lastName: "User",
      birthDate: "2000-07-03",
			role: 'MANAGER',
			gender: 'Male'
		}
	})
	console.log({ admin, demo })
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