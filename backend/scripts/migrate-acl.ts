import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../prisma/generated/client';

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL ?? '',
});
const prisma = new PrismaClient({ adapter });

async function migrate() {
	console.log('Starting ACL data migration...');

	// 1. Get all projects
	const projects = await prisma.project.findMany();
	console.log(`Found ${projects.length} projects to migrate.`);

	let migratedCount = 0;
	let skippedCount = 0;

	for (const project of projects) {
		if (!project.responsibleId) {
			console.warn(`Project ${project.id} (${project.name}) has no responsibleId. Skipping.`);
			skippedCount++;
			continue;
		}

		// Check if owner already exists
		const existingMember = await prisma.projectMember.findUnique({
			where: {
				userId_projectId: {
					userId: project.responsibleId,
					projectId: project.id,
				},
			},
		});

		if (!existingMember) {
			try {
				await prisma.projectMember.create({
					data: {
						userId: project.responsibleId,
						projectId: project.id,
						role: 'OWNER',
					},
				});
				console.log(`Assigned OWNER role to User ${project.responsibleId} for Project ${project.id}.`);
				migratedCount++;
			} catch (err) {
				console.error(`Failed to migrate Project ${project.id}:`, err);
			}
		} else {
			console.log(`User ${project.responsibleId} is already a member of Project ${project.id}. Updating role to OWNER if needed.`);
			await prisma.projectMember.update({
				where: { id: existingMember.id },
				data: { role: 'OWNER' }
			});
			skippedCount++;
		}
	}

	console.log('Migration completed.');
	console.log(`Summary: ${migratedCount} migrated, ${skippedCount} items already processed or skipped.`);
}

migrate()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
