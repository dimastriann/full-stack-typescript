-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'SELECT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "twoFactorBackupCodes" TEXT[],
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "workspaceId" INTEGER,
    "projectId" INTEGER,
    "userId" INTEGER NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFieldDefinition" (
    "id" SERIAL NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CustomFieldType" NOT NULL,
    "options" TEXT[],
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFieldValue" (
    "id" SERIAL NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "entityId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEndpoint" (
    "id" SERIAL NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDeliveryLog" (
    "id" SERIAL NOT NULL,
    "webhookEndpointId" INTEGER NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "statusCode" INTEGER,
    "responseBody" TEXT,
    "durationMs" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDeliveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_workspaceId_idx" ON "ActivityLog"("workspaceId");

-- CreateIndex
CREATE INDEX "ActivityLog_projectId_idx" ON "ActivityLog"("projectId");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "CustomFieldDefinition_workspaceId_idx" ON "CustomFieldDefinition"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldDefinition_workspaceId_entityType_name_key" ON "CustomFieldDefinition"("workspaceId", "entityType", "name");

-- CreateIndex
CREATE INDEX "CustomFieldValue_entityId_idx" ON "CustomFieldValue"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldValue_fieldId_entityId_key" ON "CustomFieldValue"("fieldId", "entityId");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_workspaceId_idx" ON "WebhookEndpoint"("workspaceId");

-- CreateIndex
CREATE INDEX "WebhookDeliveryLog_webhookEndpointId_idx" ON "WebhookDeliveryLog"("webhookEndpointId");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldDefinition" ADD CONSTRAINT "CustomFieldDefinition_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "CustomFieldDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDeliveryLog" ADD CONSTRAINT "WebhookDeliveryLog_webhookEndpointId_fkey" FOREIGN KEY ("webhookEndpointId") REFERENCES "WebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
