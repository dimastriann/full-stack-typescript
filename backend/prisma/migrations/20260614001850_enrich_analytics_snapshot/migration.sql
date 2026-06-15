/*
  Warnings:

  - You are about to drop the column `activeEntPlans` on the `PlatformAnalyticsSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `activeProPlans` on the `PlatformAnalyticsSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `capturedAt` on the `PlatformAnalyticsSnapshot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PlatformAnalyticsSnapshot" DROP COLUMN "activeEntPlans",
DROP COLUMN "activeProPlans",
DROP COLUMN "capturedAt",
ADD COLUMN     "activeSubscriptions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "newUsersToday" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "newWorkspacesToday" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "planBreakdown" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "totalProjects" INTEGER NOT NULL DEFAULT 0;
