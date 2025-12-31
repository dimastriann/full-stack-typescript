/*
  Warnings:

  - You are about to drop the column `commentId` on the `Attachment` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_commentId_fkey";

-- AlterTable
ALTER TABLE "Attachment" DROP COLUMN "commentId";
