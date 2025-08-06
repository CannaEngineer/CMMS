-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "legacyId" INTEGER,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TECHNICIAN',
    "organizationId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "legacyId" INTEGER,
    "name" TEXT NOT NULL,
    "settings" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "legacyId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serialNumber" TEXT,
    "modelNumber" TEXT,
    "manufacturer" TEXT,
    "year" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ONLINE',
    "criticality" TEXT NOT NULL DEFAULT 'MEDIUM',
    "barcode" TEXT,
    "imageUrl" TEXT,
    "attachments" JSONB,
    "locationId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Asset_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Asset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Asset_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Asset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Location" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "legacyId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "organizationId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Location_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "legacyId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "assetId" INTEGER,
    "assignedToId" INTEGER,
    "organizationId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkOrder_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkOrder_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WorkOrder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PMSchedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "legacyId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frequency" TEXT NOT NULL,
    "nextDue" DATETIME NOT NULL,
    "assetId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PMSchedule_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Part" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "legacyId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "stockLevel" INTEGER NOT NULL DEFAULT 0,
    "reorderPoint" INTEGER NOT NULL DEFAULT 0,
    "organizationId" INTEGER NOT NULL,
    "supplierId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Part_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Part_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "legacyId" INTEGER,
    "name" TEXT NOT NULL,
    "contactInfo" TEXT,
    "address" TEXT,
    "organizationId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PMTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "procedure" TEXT,
    "safetyRequirements" TEXT,
    "toolsRequired" TEXT,
    "partsRequired" TEXT,
    "estimatedMinutes" INTEGER,
    "organizationId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PMTask_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PMTrigger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "pmScheduleId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "intervalDays" INTEGER,
    "intervalWeeks" INTEGER,
    "intervalMonths" INTEGER,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "timeOfDay" TEXT,
    "meterType" TEXT,
    "thresholdValue" REAL,
    "sensorField" TEXT,
    "comparisonOperator" TEXT,
    "eventType" TEXT,
    "lastTriggered" DATETIME,
    "nextDue" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PMTrigger_pmScheduleId_fkey" FOREIGN KEY ("pmScheduleId") REFERENCES "PMSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkOrderTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workOrderId" INTEGER NOT NULL,
    "pmTaskId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "procedure" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "completedById" INTEGER,
    "completedAt" DATETIME,
    "notes" TEXT,
    "actualMinutes" INTEGER,
    "requiresSign" BOOLEAN NOT NULL DEFAULT false,
    "signedById" INTEGER,
    "signedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkOrderTask_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkOrderTask_pmTaskId_fkey" FOREIGN KEY ("pmTaskId") REFERENCES "PMTask" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WorkOrderTask_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WorkOrderTask_signedById_fkey" FOREIGN KEY ("signedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MeterReading" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assetId" INTEGER NOT NULL,
    "meterType" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "unit" TEXT,
    "readingDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedById" INTEGER,
    "notes" TEXT,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MeterReading_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MeterReading_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PMScheduleTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pmScheduleId" INTEGER NOT NULL,
    "pmTaskId" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PMScheduleTask_pmScheduleId_fkey" FOREIGN KEY ("pmScheduleId") REFERENCES "PMSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PMScheduleTask_pmTaskId_fkey" FOREIGN KEY ("pmTaskId") REFERENCES "PMTask" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assetId" INTEGER NOT NULL,
    "workOrderId" INTEGER,
    "pmScheduleId" INTEGER,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "performedById" INTEGER,
    "performedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMinutes" INTEGER,
    "laborCost" REAL,
    "partsCost" REAL,
    "totalCost" REAL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "notes" TEXT,
    "attachments" JSONB,
    "signedById" INTEGER,
    "signedAt" DATETIME,
    "complianceNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceHistory_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceHistory_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceHistory_pmScheduleId_fkey" FOREIGN KEY ("pmScheduleId") REFERENCES "PMSchedule" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceHistory_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceHistory_signedById_fkey" FOREIGN KEY ("signedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Portal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "slug" TEXT NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "allowAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "autoCreateWorkOrders" BOOLEAN NOT NULL DEFAULT true,
    "maxSubmissionsPerDay" INTEGER,
    "publicUrl" TEXT,
    "qrCodeUrl" TEXT,
    "qrEnabled" BOOLEAN NOT NULL DEFAULT true,
    "primaryColor" TEXT NOT NULL DEFAULT '#1976d2',
    "secondaryColor" TEXT NOT NULL DEFAULT '#ffffff',
    "accentColor" TEXT NOT NULL DEFAULT '#f50057',
    "logoUrl" TEXT,
    "backgroundImageUrl" TEXT,
    "customCss" TEXT,
    "notificationEmails" TEXT,
    "autoResponderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoResponderMessage" TEXT,
    "rateLimitEnabled" BOOLEAN NOT NULL DEFAULT true,
    "rateLimitRequests" INTEGER NOT NULL DEFAULT 100,
    "rateLimitWindow" INTEGER NOT NULL DEFAULT 3600,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Portal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PortalField" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "portalId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "placeholder" TEXT,
    "helpText" TEXT,
    "options" JSONB,
    "validations" JSONB,
    "conditionalLogic" JSONB,
    "width" TEXT,
    "cssClasses" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PortalField_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "Portal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PortalSubmission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "portalId" INTEGER NOT NULL,
    "trackingCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "submissionData" JSONB NOT NULL,
    "attachments" JSONB,
    "submitterName" TEXT,
    "submitterEmail" TEXT,
    "submitterPhone" TEXT,
    "submitterIp" TEXT,
    "userAgent" TEXT,
    "assignedToId" INTEGER,
    "reviewNotes" TEXT,
    "internalNotes" TEXT,
    "reviewedAt" DATETIME,
    "completedAt" DATETIME,
    "workOrderId" INTEGER,
    "assetId" INTEGER,
    "locationId" INTEGER,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PortalSubmission_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "Portal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PortalSubmission_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PortalSubmission_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PortalSubmission_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PortalSubmission_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PortalCommunication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "submissionId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'MESSAGE',
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "sentById" INTEGER,
    "recipientEmail" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PortalCommunication_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "PortalSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PortalCommunication_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PortalAnalytics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "portalId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER NOT NULL DEFAULT 0,
    "submissions" INTEGER NOT NULL DEFAULT 0,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "bounceRate" REAL,
    "avgCompletionTime" INTEGER,
    "mobileViews" INTEGER NOT NULL DEFAULT 0,
    "desktopViews" INTEGER NOT NULL DEFAULT 0,
    "tabletViews" INTEGER NOT NULL DEFAULT 0,
    "qrCodeScans" INTEGER NOT NULL DEFAULT 0,
    "directAccess" INTEGER NOT NULL DEFAULT 0,
    "referralAccess" INTEGER NOT NULL DEFAULT 0,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PortalAnalytics_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "Portal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "attachments" JSONB,
    "editedAt" DATETIME,
    "editedById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_legacyId_key" ON "User"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_legacyId_key" ON "Organization"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_name_key" ON "Organization"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_legacyId_key" ON "Asset"("legacyId");

-- CreateIndex
CREATE INDEX "Asset_organizationId_idx" ON "Asset"("organizationId");

-- CreateIndex
CREATE INDEX "Asset_locationId_idx" ON "Asset"("locationId");

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "Asset"("status");

-- CreateIndex
CREATE INDEX "Asset_criticality_idx" ON "Asset"("criticality");

-- CreateIndex
CREATE INDEX "Asset_parentId_idx" ON "Asset"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_legacyId_key" ON "Location"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_legacyId_key" ON "WorkOrder"("legacyId");

-- CreateIndex
CREATE INDEX "WorkOrder_organizationId_idx" ON "WorkOrder"("organizationId");

-- CreateIndex
CREATE INDEX "WorkOrder_assetId_idx" ON "WorkOrder"("assetId");

-- CreateIndex
CREATE INDEX "WorkOrder_assignedToId_idx" ON "WorkOrder"("assignedToId");

-- CreateIndex
CREATE INDEX "WorkOrder_status_idx" ON "WorkOrder"("status");

-- CreateIndex
CREATE INDEX "WorkOrder_priority_idx" ON "WorkOrder"("priority");

-- CreateIndex
CREATE INDEX "WorkOrder_createdAt_idx" ON "WorkOrder"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PMSchedule_legacyId_key" ON "PMSchedule"("legacyId");

-- CreateIndex
CREATE INDEX "PMSchedule_assetId_idx" ON "PMSchedule"("assetId");

-- CreateIndex
CREATE INDEX "PMSchedule_nextDue_idx" ON "PMSchedule"("nextDue");

-- CreateIndex
CREATE INDEX "PMSchedule_assetId_nextDue_idx" ON "PMSchedule"("assetId", "nextDue");

-- CreateIndex
CREATE UNIQUE INDEX "Part_legacyId_key" ON "Part"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "Part_sku_key" ON "Part"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_legacyId_key" ON "Supplier"("legacyId");

-- CreateIndex
CREATE INDEX "PMTask_organizationId_idx" ON "PMTask"("organizationId");

-- CreateIndex
CREATE INDEX "PMTask_type_idx" ON "PMTask"("type");

-- CreateIndex
CREATE INDEX "PMTrigger_pmScheduleId_idx" ON "PMTrigger"("pmScheduleId");

-- CreateIndex
CREATE INDEX "PMTrigger_type_idx" ON "PMTrigger"("type");

-- CreateIndex
CREATE INDEX "PMTrigger_nextDue_idx" ON "PMTrigger"("nextDue");

-- CreateIndex
CREATE INDEX "PMTrigger_meterType_idx" ON "PMTrigger"("meterType");

-- CreateIndex
CREATE INDEX "WorkOrderTask_workOrderId_idx" ON "WorkOrderTask"("workOrderId");

-- CreateIndex
CREATE INDEX "WorkOrderTask_status_idx" ON "WorkOrderTask"("status");

-- CreateIndex
CREATE INDEX "WorkOrderTask_completedById_idx" ON "WorkOrderTask"("completedById");

-- CreateIndex
CREATE INDEX "WorkOrderTask_pmTaskId_idx" ON "WorkOrderTask"("pmTaskId");

-- CreateIndex
CREATE INDEX "MeterReading_assetId_meterType_idx" ON "MeterReading"("assetId", "meterType");

-- CreateIndex
CREATE INDEX "MeterReading_readingDate_idx" ON "MeterReading"("readingDate");

-- CreateIndex
CREATE INDEX "MeterReading_meterType_idx" ON "MeterReading"("meterType");

-- CreateIndex
CREATE INDEX "MeterReading_assetId_meterType_readingDate_idx" ON "MeterReading"("assetId", "meterType", "readingDate");

-- CreateIndex
CREATE INDEX "PMScheduleTask_pmScheduleId_idx" ON "PMScheduleTask"("pmScheduleId");

-- CreateIndex
CREATE INDEX "PMScheduleTask_pmTaskId_idx" ON "PMScheduleTask"("pmTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "PMScheduleTask_pmScheduleId_pmTaskId_key" ON "PMScheduleTask"("pmScheduleId", "pmTaskId");

-- CreateIndex
CREATE INDEX "MaintenanceHistory_assetId_idx" ON "MaintenanceHistory"("assetId");

-- CreateIndex
CREATE INDEX "MaintenanceHistory_workOrderId_idx" ON "MaintenanceHistory"("workOrderId");

-- CreateIndex
CREATE INDEX "MaintenanceHistory_pmScheduleId_idx" ON "MaintenanceHistory"("pmScheduleId");

-- CreateIndex
CREATE INDEX "MaintenanceHistory_type_idx" ON "MaintenanceHistory"("type");

-- CreateIndex
CREATE INDEX "MaintenanceHistory_performedAt_idx" ON "MaintenanceHistory"("performedAt");

-- CreateIndex
CREATE INDEX "MaintenanceHistory_performedById_idx" ON "MaintenanceHistory"("performedById");

-- CreateIndex
CREATE INDEX "MaintenanceHistory_isCompleted_idx" ON "MaintenanceHistory"("isCompleted");

-- CreateIndex
CREATE UNIQUE INDEX "Portal_slug_key" ON "Portal"("slug");

-- CreateIndex
CREATE INDEX "Portal_organizationId_idx" ON "Portal"("organizationId");

-- CreateIndex
CREATE INDEX "Portal_status_idx" ON "Portal"("status");

-- CreateIndex
CREATE INDEX "Portal_type_idx" ON "Portal"("type");

-- CreateIndex
CREATE INDEX "Portal_slug_idx" ON "Portal"("slug");

-- CreateIndex
CREATE INDEX "PortalField_portalId_idx" ON "PortalField"("portalId");

-- CreateIndex
CREATE INDEX "PortalField_orderIndex_idx" ON "PortalField"("orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "PortalSubmission_trackingCode_key" ON "PortalSubmission"("trackingCode");

-- CreateIndex
CREATE INDEX "PortalSubmission_portalId_idx" ON "PortalSubmission"("portalId");

-- CreateIndex
CREATE INDEX "PortalSubmission_status_idx" ON "PortalSubmission"("status");

-- CreateIndex
CREATE INDEX "PortalSubmission_trackingCode_idx" ON "PortalSubmission"("trackingCode");

-- CreateIndex
CREATE INDEX "PortalSubmission_assignedToId_idx" ON "PortalSubmission"("assignedToId");

-- CreateIndex
CREATE INDEX "PortalSubmission_workOrderId_idx" ON "PortalSubmission"("workOrderId");

-- CreateIndex
CREATE INDEX "PortalSubmission_priority_idx" ON "PortalSubmission"("priority");

-- CreateIndex
CREATE INDEX "PortalSubmission_createdAt_idx" ON "PortalSubmission"("createdAt");

-- CreateIndex
CREATE INDEX "PortalCommunication_submissionId_idx" ON "PortalCommunication"("submissionId");

-- CreateIndex
CREATE INDEX "PortalCommunication_messageType_idx" ON "PortalCommunication"("messageType");

-- CreateIndex
CREATE INDEX "PortalCommunication_isInternal_idx" ON "PortalCommunication"("isInternal");

-- CreateIndex
CREATE INDEX "PortalAnalytics_portalId_idx" ON "PortalAnalytics"("portalId");

-- CreateIndex
CREATE INDEX "PortalAnalytics_date_idx" ON "PortalAnalytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "PortalAnalytics_portalId_date_key" ON "PortalAnalytics"("portalId", "date");

-- CreateIndex
CREATE INDEX "Comment_entityType_entityId_idx" ON "Comment"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "Comment_createdAt_idx" ON "Comment"("createdAt");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");
