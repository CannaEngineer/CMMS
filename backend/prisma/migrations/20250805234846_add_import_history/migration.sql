-- CreateTable
CREATE TABLE "ImportHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "importId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "fileName" TEXT,
    "totalRows" INTEGER NOT NULL,
    "importedCount" INTEGER NOT NULL,
    "skippedCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "errors" JSONB,
    "warnings" JSONB,
    "duplicates" JSONB,
    "columnMappings" JSONB NOT NULL,
    "userId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "canRollback" BOOLEAN NOT NULL DEFAULT true,
    "rolledBack" BOOLEAN NOT NULL DEFAULT false,
    "rolledBackAt" DATETIME,
    "rolledBackById" INTEGER,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "durationMs" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ImportHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ImportHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ImportHistory_rolledBackById_fkey" FOREIGN KEY ("rolledBackById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ImportHistory_importId_key" ON "ImportHistory"("importId");

-- CreateIndex
CREATE INDEX "ImportHistory_organizationId_idx" ON "ImportHistory"("organizationId");

-- CreateIndex
CREATE INDEX "ImportHistory_userId_idx" ON "ImportHistory"("userId");

-- CreateIndex
CREATE INDEX "ImportHistory_entityType_idx" ON "ImportHistory"("entityType");

-- CreateIndex
CREATE INDEX "ImportHistory_status_idx" ON "ImportHistory"("status");

-- CreateIndex
CREATE INDEX "ImportHistory_createdAt_idx" ON "ImportHistory"("createdAt");

-- CreateIndex
CREATE INDEX "ImportHistory_importId_idx" ON "ImportHistory"("importId");
