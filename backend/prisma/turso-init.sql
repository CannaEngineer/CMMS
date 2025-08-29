-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "legacyId" INTEGER,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TECHNICIAN',
    "organizationId" INTEGER NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "emailVerificationExpires" DATETIME,
    "passwordResetToken" TEXT,
    "passwordResetExpires" DATETIME,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeen" DATETIME,
    "lastActivity" DATETIME,
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
    "latitude" REAL,
    "longitude" REAL,
    "barcode" TEXT,
    "url" TEXT,
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
    "uniqueId" TEXT,
    "legacyId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "dueDate" DATETIME,
    "assetId" INTEGER,
    "assignedToId" INTEGER,
    "pmScheduleId" INTEGER,
    "organizationId" INTEGER NOT NULL,
    "totalLoggedHours" REAL DEFAULT 0,
    "estimatedHours" REAL,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "attachments" JSONB,
    CONSTRAINT "WorkOrder_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkOrder_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WorkOrder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkOrder_pmScheduleId_fkey" FOREIGN KEY ("pmScheduleId") REFERENCES "PMSchedule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PMSchedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uniqueId" TEXT,
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
    "unitCost" REAL,
    "totalCost" REAL,
    "barcode" TEXT,
    "location" TEXT,
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
    "phone" TEXT,
    "email" TEXT,
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
    CONSTRAINT "WorkOrderTask_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WorkOrderTask_pmTaskId_fkey" FOREIGN KEY ("pmTaskId") REFERENCES "PMTask" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WorkOrderTask_signedById_fkey" FOREIGN KEY ("signedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WorkOrderTask_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    CONSTRAINT "MaintenanceHistory_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceHistory_pmScheduleId_fkey" FOREIGN KEY ("pmScheduleId") REFERENCES "PMSchedule" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceHistory_signedById_fkey" FOREIGN KEY ("signedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceHistory_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    CONSTRAINT "PortalSubmission_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PortalSubmission_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PortalSubmission_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PortalSubmission_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "Portal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PortalSubmission_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    CONSTRAINT "PortalCommunication_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PortalCommunication_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "PortalSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    CONSTRAINT "Comment_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    CONSTRAINT "ImportHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ImportHistory_rolledBackById_fkey" FOREIGN KEY ("rolledBackById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ImportHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkOrderTimeLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workOrderId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "hours" REAL NOT NULL,
    "category" TEXT,
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "loggedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkOrderTimeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkOrderTimeLog_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkOrderShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workOrderId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "shareToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "maxViews" INTEGER,
    "currentViews" INTEGER NOT NULL DEFAULT 0,
    "allowComments" BOOLEAN NOT NULL DEFAULT true,
    "allowDownload" BOOLEAN NOT NULL DEFAULT false,
    "viewerCanSeeAssignee" BOOLEAN NOT NULL DEFAULT false,
    "sanitizationLevel" TEXT NOT NULL DEFAULT 'STANDARD',
    "createdById" INTEGER NOT NULL,
    "lastAccessedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkOrderShare_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkOrderShare_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkOrderShare_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PublicComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shareId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorName" TEXT,
    "authorEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "ipAddressHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "moderatedById" INTEGER,
    "moderatedAt" DATETIME,
    "flagCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PublicComment_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PublicComment_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "WorkOrderShare" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShareAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shareId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddressHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShareAuditLog_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "WorkOrderShare" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT NOT NULL DEFAULT 'SYSTEM',
    "userId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "relatedEntityType" TEXT,
    "relatedEntityId" INTEGER,
    "actionUrl" TEXT,
    "actionLabel" TEXT,
    "data" JSONB,
    "imageUrl" TEXT,
    "expiresAt" DATETIME,
    "channels" JSONB,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" DATETIME,
    "smsSent" BOOLEAN NOT NULL DEFAULT false,
    "smsSentAt" DATETIME,
    "pushSent" BOOLEAN NOT NULL DEFAULT false,
    "pushSentAt" DATETIME,
    "createdById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Notification_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'IMMEDIATE',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "weekdaysOnly" BOOLEAN NOT NULL DEFAULT false,
    "minimumPriority" TEXT NOT NULL DEFAULT 'LOW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationRule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggerType" TEXT NOT NULL,
    "triggerCondition" JSONB NOT NULL,
    "titleTemplate" TEXT NOT NULL,
    "messageTemplate" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT NOT NULL,
    "targetUsers" JSONB,
    "channels" JSONB,
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 0,
    "maxPerDay" INTEGER,
    "actionUrl" TEXT,
    "actionLabel" TEXT,
    "lastTriggered" DATETIME,
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notificationId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" DATETIME,
    "failedAt" DATETIME,
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "recipientAddress" TEXT,
    "providerResponse" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NotificationDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "deviceType" TEXT NOT NULL,
    "deviceToken" TEXT NOT NULL,
    "deviceInfo" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotificationDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "titleTemplate" TEXT NOT NULL,
    "messageTemplate" TEXT NOT NULL,
    "emailTemplate" TEXT,
    "smsTemplate" TEXT,
    "defaultType" TEXT NOT NULL DEFAULT 'INFO',
    "defaultPriority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "defaultCategory" TEXT NOT NULL,
    "availableVariables" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "QRCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT,
    "secureToken" TEXT NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "qrCodeDataUrl" TEXT,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "allowedUserRoles" JSONB,
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    "maxScans" INTEGER,
    "expiresAt" DATETIME,
    "lastScannedAt" DATETIME,
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QRCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "QRCode_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QRScanLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "qrCodeId" TEXT NOT NULL,
    "userId" INTEGER,
    "sessionId" TEXT,
    "actionTaken" TEXT,
    "actionData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "location" JSONB,
    "isSuccessful" BOOLEAN NOT NULL DEFAULT true,
    "errorCode" TEXT,
    "riskScore" REAL,
    "organizationId" INTEGER NOT NULL,
    "scannedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QRScanLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QRScanLog_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QRCode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QRScanLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QRBatchOperation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operationType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "totalItems" INTEGER NOT NULL,
    "processedItems" INTEGER NOT NULL DEFAULT 0,
    "successfulItems" INTEGER NOT NULL DEFAULT 0,
    "failedItems" INTEGER NOT NULL DEFAULT 0,
    "options" JSONB,
    "errorLog" JSONB,
    "organizationId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QRBatchOperation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "QRBatchOperation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QRBatchOperationItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchOperationId" TEXT NOT NULL,
    "qrCodeId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "resultData" JSONB,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QRBatchOperationItem_batchOperationId_fkey" FOREIGN KEY ("batchOperationId") REFERENCES "QRBatchOperation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QRBatchOperationItem_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QRCode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QRTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "dimensions" JSONB NOT NULL,
    "layout" TEXT NOT NULL,
    "qrSize" INTEGER NOT NULL,
    "fontSize" JSONB NOT NULL,
    "includeQRBorder" BOOLEAN NOT NULL DEFAULT true,
    "customCSS" TEXT,
    "logoUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QRTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "QRTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_legacyId_key" ON "User"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerificationToken_key" ON "User"("emailVerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");

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
CREATE UNIQUE INDEX "WorkOrder_uniqueId_key" ON "WorkOrder"("uniqueId");

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
CREATE INDEX "WorkOrder_pmScheduleId_idx" ON "WorkOrder"("pmScheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "PMSchedule_uniqueId_key" ON "PMSchedule"("uniqueId");

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

-- CreateIndex
CREATE INDEX "WorkOrderTimeLog_workOrderId_idx" ON "WorkOrderTimeLog"("workOrderId");

-- CreateIndex
CREATE INDEX "WorkOrderTimeLog_userId_idx" ON "WorkOrderTimeLog"("userId");

-- CreateIndex
CREATE INDEX "WorkOrderTimeLog_loggedAt_idx" ON "WorkOrderTimeLog"("loggedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderShare_shareToken_key" ON "WorkOrderShare"("shareToken");

-- CreateIndex
CREATE INDEX "WorkOrderShare_shareToken_idx" ON "WorkOrderShare"("shareToken");

-- CreateIndex
CREATE INDEX "WorkOrderShare_workOrderId_idx" ON "WorkOrderShare"("workOrderId");

-- CreateIndex
CREATE INDEX "WorkOrderShare_organizationId_idx" ON "WorkOrderShare"("organizationId");

-- CreateIndex
CREATE INDEX "WorkOrderShare_expiresAt_idx" ON "WorkOrderShare"("expiresAt");

-- CreateIndex
CREATE INDEX "PublicComment_shareId_idx" ON "PublicComment"("shareId");

-- CreateIndex
CREATE INDEX "PublicComment_status_idx" ON "PublicComment"("status");

-- CreateIndex
CREATE INDEX "PublicComment_ipAddressHash_idx" ON "PublicComment"("ipAddressHash");

-- CreateIndex
CREATE INDEX "ShareAuditLog_shareId_idx" ON "ShareAuditLog"("shareId");

-- CreateIndex
CREATE INDEX "ShareAuditLog_timestamp_idx" ON "ShareAuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "ShareAuditLog_ipAddressHash_idx" ON "ShareAuditLog"("ipAddressHash");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_organizationId_idx" ON "Notification"("organizationId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_category_idx" ON "Notification"("category");

-- CreateIndex
CREATE INDEX "Notification_priority_idx" ON "Notification"("priority");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_expiresAt_idx" ON "Notification"("expiresAt");

-- CreateIndex
CREATE INDEX "Notification_relatedEntityType_relatedEntityId_idx" ON "Notification"("relatedEntityType", "relatedEntityId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_category_idx" ON "Notification"("userId", "category");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreference_category_idx" ON "NotificationPreference"("category");

-- CreateIndex
CREATE INDEX "NotificationPreference_channel_idx" ON "NotificationPreference"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_category_channel_key" ON "NotificationPreference"("userId", "category", "channel");

-- CreateIndex
CREATE INDEX "NotificationRule_organizationId_idx" ON "NotificationRule"("organizationId");

-- CreateIndex
CREATE INDEX "NotificationRule_triggerType_idx" ON "NotificationRule"("triggerType");

-- CreateIndex
CREATE INDEX "NotificationRule_isActive_idx" ON "NotificationRule"("isActive");

-- CreateIndex
CREATE INDEX "NotificationDelivery_notificationId_idx" ON "NotificationDelivery"("notificationId");

-- CreateIndex
CREATE INDEX "NotificationDelivery_channel_idx" ON "NotificationDelivery"("channel");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_idx" ON "NotificationDelivery"("status");

-- CreateIndex
CREATE INDEX "NotificationDelivery_attemptedAt_idx" ON "NotificationDelivery"("attemptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDevice_deviceToken_key" ON "NotificationDevice"("deviceToken");

-- CreateIndex
CREATE INDEX "NotificationDevice_userId_idx" ON "NotificationDevice"("userId");

-- CreateIndex
CREATE INDEX "NotificationDevice_deviceType_idx" ON "NotificationDevice"("deviceType");

-- CreateIndex
CREATE INDEX "NotificationDevice_isActive_idx" ON "NotificationDevice"("isActive");

-- CreateIndex
CREATE INDEX "NotificationTemplate_organizationId_idx" ON "NotificationTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "NotificationTemplate_key_idx" ON "NotificationTemplate"("key");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_organizationId_key_key" ON "NotificationTemplate"("organizationId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_secureToken_key" ON "QRCode"("secureToken");

-- CreateIndex
CREATE INDEX "QRCode_entityType_entityId_idx" ON "QRCode"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "QRCode_organizationId_idx" ON "QRCode"("organizationId");

-- CreateIndex
CREATE INDEX "QRCode_secureToken_idx" ON "QRCode"("secureToken");

-- CreateIndex
CREATE INDEX "QRCode_status_expiresAt_idx" ON "QRCode"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "QRCode_createdById_idx" ON "QRCode"("createdById");

-- CreateIndex
CREATE INDEX "QRScanLog_qrCodeId_scannedAt_idx" ON "QRScanLog"("qrCodeId", "scannedAt");

-- CreateIndex
CREATE INDEX "QRScanLog_userId_scannedAt_idx" ON "QRScanLog"("userId", "scannedAt");

-- CreateIndex
CREATE INDEX "QRScanLog_organizationId_scannedAt_idx" ON "QRScanLog"("organizationId", "scannedAt");

-- CreateIndex
CREATE INDEX "QRScanLog_actionTaken_idx" ON "QRScanLog"("actionTaken");

-- CreateIndex
CREATE INDEX "QRScanLog_isSuccessful_idx" ON "QRScanLog"("isSuccessful");

-- CreateIndex
CREATE INDEX "QRBatchOperation_organizationId_idx" ON "QRBatchOperation"("organizationId");

-- CreateIndex
CREATE INDEX "QRBatchOperation_createdById_idx" ON "QRBatchOperation"("createdById");

-- CreateIndex
CREATE INDEX "QRBatchOperation_status_createdAt_idx" ON "QRBatchOperation"("status", "createdAt");

-- CreateIndex
CREATE INDEX "QRBatchOperationItem_batchOperationId_idx" ON "QRBatchOperationItem"("batchOperationId");

-- CreateIndex
CREATE INDEX "QRBatchOperationItem_qrCodeId_idx" ON "QRBatchOperationItem"("qrCodeId");

-- CreateIndex
CREATE INDEX "QRBatchOperationItem_status_idx" ON "QRBatchOperationItem"("status");

-- CreateIndex
CREATE INDEX "QRTemplate_organizationId_idx" ON "QRTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "QRTemplate_category_idx" ON "QRTemplate"("category");

-- CreateIndex
CREATE INDEX "QRTemplate_isPublic_idx" ON "QRTemplate"("isPublic");

