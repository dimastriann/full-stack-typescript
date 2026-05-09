-- CreateEnum
CREATE TYPE "ProjectMethodology" AS ENUM ('SCRUM', 'WATERFALL', 'KANBAN', 'AGILE', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "budgetActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "budgetPlanned" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "methodology" "ProjectMethodology" NOT NULL DEFAULT 'KANBAN',
ADD COLUMN     "phasesCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "estimatedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM';
