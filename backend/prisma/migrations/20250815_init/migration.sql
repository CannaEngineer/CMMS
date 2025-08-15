-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'MANAGER', 'TECHNICIAN');

-- CreateEnum
CREATE TYPE "public"."WorkOrderStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."WorkOrderPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."AssetStatus" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "public"."AssetCriticality" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'IMPORTANT');

-- CreateEnum
CREATE TYPE "public"."PMTriggerType" AS ENUM ('TIME_BASED', 'USAGE_BASED', 'CONDITION_BASED', 'EVENT_BASED');

-- CreateEnum
CREATE TYPE "public"."TaskType" AS ENUM ('INSPECTION', 'CLEANING', 'LUBRICATION', 'REPLACEMENT', 'CALIBRATION', 'TESTING', 'REPAIR', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."TaskCompletionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."MeterType" AS ENUM ('HOURS', 'MILES', 'CYCLES', 'GALLONS', 'TEMPERATURE', 'PRESSURE', 'VIBRATION', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'INSPECTION', 'CALIBRATION');

-- CreateEnum
CREATE TYPE "public"."PortalType" AS ENUM ('MAINTENANCE_REQUEST', 'ASSET_REGISTRATION', 'EQUIPMENT_INFO', 'GENERAL_INQUIRY', 'INSPECTION_REPORT', 'SAFETY_INCIDENT');

-- CreateEnum
CREATE TYPE "public"."PortalStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."SubmissionStatus" AS ENUM ('SUBMITTED', 'REVIEWED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'ASSIGNED');

-- CreateEnum
CREATE TYPE "public"."FieldType" AS ENUM ('TEXT', 'TEXTAREA', 'EMAIL', 'PHONE', 'NUMBER', 'SELECT', 'MULTI_SELECT', 'RADIO', 'CHECKBOX', 'DATE', 'TIME', 'DATETIME', 'FILE', 'IMAGE', 'LOCATION', 'ASSET_PICKER', 'USER_PICKER', 'PRIORITY', 'RATING', 'SIGNATURE', 'URL', 'CURRENCY');

-- CreateEnum
CREATE TYPE "public"."PortalFieldValidationType" AS ENUM ('REQUIRED', 'MIN_LENGTH', 'MAX_LENGTH', 'MIN_VALUE', 'MAX_VALUE', 'PATTERN', 'EMAIL_FORMAT', 'PHONE_FORMAT', 'URL_FORMAT', 'FILE_SIZE', 'FILE_TYPE');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('ALERT', 'WARNING', 'INFO', 'SUCCESS');

-- CreateEnum
CREATE TYPE "public"."NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "public"."NotificationCategory" AS ENUM ('WORK_ORDER', 'ASSET', 'MAINTENANCE', 'INVENTORY', 'USER', 'SYSTEM', 'PORTAL');

-- CreateEnum
CREATE TYPE "public"."NotificationFrequency" AS ENUM ('IMMEDIATE', 'DIGEST', 'DISABLED');

-- CreateEnum
CREATE TYPE "public"."QRCodeType" AS ENUM ('ASSET', 'WORK_ORDER', 'PM_SCHEDULE', 'LOCATION', 'USER', 'PART', 'PORTAL');

-- CreateEnum
CREATE TYPE "public"."QRCodeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."QRScanActionType" AS ENUM ('VIEW', 'EDIT', 'CREATE_WORK_ORDER', 'COMPLETE_TASK', 'CHECK_IN', 'SCHEDULE_PM', 'UPDATE_STATUS', 'ADD_NOTES');

-- CreateEnum
CREATE TYPE "public"."QRBatchOperationType" AS ENUM ('GENERATE', 'REGENERATE', 'DEACTIVATE', 'EXPORT');

-- CreateEnum
CREATE TYPE "public"."QRBatchOperationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "legacyId" INTEGER,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'TECHNICIAN',
    "organizationId" INTEGER NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeen" TIMESTAMP(3),
    "lastActivity" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Organization" (
    "id" SERIAL NOT NULL,
    "legacyId" INTEGER,
    "name" TEXT NOT NULL,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Asset" (
    "id" SERIAL NOT NULL,
    "legacyId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serialNumber" TEXT,
    "modelNumber" TEXT,
    "manufacturer" TEXT,
    "year" INTEGER,
    "status" "public"."AssetStatus" NOT NULL DEFAULT 'ONLINE',
    "criticality" "public"."AssetCriticality" NOT NULL DEFAULT 'MEDIUM',
    "barcode" TEXT,
    "imageUrl" TEXT,
    "attachments" JSONB,
    "locationId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Location" (
    "id" SERIAL NOT NULL,
    "legacyId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "barcode" TEXT,
    "url" TEXT,
    "organizationId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkOrder" (
    "id" SERIAL NOT NULL,
    "uniqueId" TEXT,
    "legacyId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."WorkOrderStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "public"."WorkOrderPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "assetId" INTEGER,
    "assignedToId" INTEGER,
    "pmScheduleId" INTEGER,
    "organizationId" INTEGER NOT NULL,
    "totalLoggedHours" DOUBLE PRECISION DEFAULT 0,
    "estimatedHours" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PMSchedule" (
    "id" SERIAL NOT NULL,
    "uniqueId" TEXT,
    "legacyId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frequency" TEXT NOT NULL,
    "nextDue" TIMESTAMP(3) NOT NULL,
    "assetId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PMSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Part" (
    "id" SERIAL NOT NULL,
    "legacyId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "stockLevel" INTEGER NOT NULL DEFAULT 0,
    "reorderPoint" INTEGER NOT NULL DEFAULT 0,
    "unitCost" DOUBLE PRECISION,
    "totalCost" DOUBLE PRECISION,
    "barcode" TEXT,
    "location" TEXT,
    "organizationId" INTEGER NOT NULL,
    "supplierId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Supplier" (
    "id" SERIAL NOT NULL,
    "legacyId" INTEGER,
    "name" TEXT NOT NULL,
    "contactInfo" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "organizationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PMTask" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."TaskType" NOT NULL DEFAULT 'OTHER',
    "procedure" TEXT,
    "safetyRequirements" TEXT,
    "toolsRequired" TEXT,
    "partsRequired" TEXT,
    "estimatedMinutes" INTEGER,
    "organizationId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PMTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PMTrigger" (
    "id" SERIAL NOT NULL,
    "type" "public"."PMTriggerType" NOT NULL,
    "pmScheduleId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "intervalDays" INTEGER,
    "intervalWeeks" INTEGER,
    "intervalMonths" INTEGER,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "timeOfDay" TEXT,
    "meterType" "public"."MeterType",
    "thresholdValue" DOUBLE PRECISION,
    "sensorField" TEXT,
    "comparisonOperator" TEXT,
    "eventType" TEXT,
    "lastTriggered" TIMESTAMP(3),
    "nextDue" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PMTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkOrderTask" (
    "id" SERIAL NOT NULL,
    "workOrderId" INTEGER NOT NULL,
    "pmTaskId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "procedure" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."TaskCompletionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completedById" INTEGER,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "actualMinutes" INTEGER,
    "requiresSign" BOOLEAN NOT NULL DEFAULT false,
    "signedById" INTEGER,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrderTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MeterReading" (
    "id" SERIAL NOT NULL,
    "assetId" INTEGER NOT NULL,
    "meterType" "public"."MeterType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "readingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedById" INTEGER,
    "notes" TEXT,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeterReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PMScheduleTask" (
    "id" SERIAL NOT NULL,
    "pmScheduleId" INTEGER NOT NULL,
    "pmTaskId" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PMScheduleTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MaintenanceHistory" (
    "id" SERIAL NOT NULL,
    "assetId" INTEGER NOT NULL,
    "workOrderId" INTEGER,
    "pmScheduleId" INTEGER,
    "type" "public"."MaintenanceType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "performedById" INTEGER,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMinutes" INTEGER,
    "laborCost" DOUBLE PRECISION,
    "partsCost" DOUBLE PRECISION,
    "totalCost" DOUBLE PRECISION,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "attachments" JSONB,
    "signedById" INTEGER,
    "signedAt" TIMESTAMP(3),
    "complianceNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Portal" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."PortalType" NOT NULL,
    "status" "public"."PortalStatus" NOT NULL DEFAULT 'ACTIVE',
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PortalField" (
    "id" SERIAL NOT NULL,
    "portalId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "public"."FieldType" NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "placeholder" TEXT,
    "helpText" TEXT,
    "options" JSONB,
    "validations" JSONB,
    "conditionalLogic" JSONB,
    "width" TEXT,
    "cssClasses" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PortalSubmission" (
    "id" SERIAL NOT NULL,
    "portalId" INTEGER NOT NULL,
    "trackingCode" TEXT NOT NULL,
    "status" "public"."SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
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
    "reviewedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "workOrderId" INTEGER,
    "assetId" INTEGER,
    "locationId" INTEGER,
    "priority" "public"."WorkOrderPriority" NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PortalCommunication" (
    "id" SERIAL NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'MESSAGE',
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "sentById" INTEGER,
    "recipientEmail" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalCommunication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PortalAnalytics" (
    "id" SERIAL NOT NULL,
    "portalId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER NOT NULL DEFAULT 0,
    "submissions" INTEGER NOT NULL DEFAULT 0,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "bounceRate" DOUBLE PRECISION,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Comment" (
    "id" SERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "attachments" JSONB,
    "editedAt" TIMESTAMP(3),
    "editedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ImportHistory" (
    "id" SERIAL NOT NULL,
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
    "rolledBackAt" TIMESTAMP(3),
    "rolledBackById" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkOrderTimeLog" (
    "id" SERIAL NOT NULL,
    "workOrderId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrderTimeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkOrderShare" (
    "id" TEXT NOT NULL,
    "workOrderId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "shareToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "maxViews" INTEGER,
    "currentViews" INTEGER NOT NULL DEFAULT 0,
    "allowComments" BOOLEAN NOT NULL DEFAULT true,
    "allowDownload" BOOLEAN NOT NULL DEFAULT false,
    "viewerCanSeeAssignee" BOOLEAN NOT NULL DEFAULT false,
    "sanitizationLevel" TEXT NOT NULL DEFAULT 'STANDARD',
    "createdById" INTEGER NOT NULL,
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrderShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PublicComment" (
    "id" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorName" TEXT,
    "authorEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "ipAddressHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "moderatedById" INTEGER,
    "moderatedAt" TIMESTAMP(3),
    "flagCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShareAuditLog" (
    "id" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddressHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL DEFAULT 'INFO',
    "priority" "public"."NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "category" "public"."NotificationCategory" NOT NULL DEFAULT 'SYSTEM',
    "userId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "relatedEntityType" TEXT,
    "relatedEntityId" INTEGER,
    "actionUrl" TEXT,
    "actionLabel" TEXT,
    "data" JSONB,
    "imageUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "channels" JSONB,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "smsSent" BOOLEAN NOT NULL DEFAULT false,
    "smsSentAt" TIMESTAMP(3),
    "pushSent" BOOLEAN NOT NULL DEFAULT false,
    "pushSentAt" TIMESTAMP(3),
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationPreference" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "category" "public"."NotificationCategory" NOT NULL,
    "channel" "public"."NotificationChannel" NOT NULL,
    "frequency" "public"."NotificationFrequency" NOT NULL DEFAULT 'IMMEDIATE',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "weekdaysOnly" BOOLEAN NOT NULL DEFAULT false,
    "minimumPriority" "public"."NotificationPriority" NOT NULL DEFAULT 'LOW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationRule" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggerType" TEXT NOT NULL,
    "triggerCondition" JSONB NOT NULL,
    "titleTemplate" TEXT NOT NULL,
    "messageTemplate" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL DEFAULT 'INFO',
    "priority" "public"."NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "category" "public"."NotificationCategory" NOT NULL,
    "targetUsers" JSONB,
    "channels" JSONB,
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 0,
    "maxPerDay" INTEGER,
    "actionUrl" TEXT,
    "actionLabel" TEXT,
    "lastTriggered" TIMESTAMP(3),
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationDelivery" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "channel" "public"."NotificationChannel" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "recipientAddress" TEXT,
    "providerResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationDevice" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "deviceType" TEXT NOT NULL,
    "deviceToken" TEXT NOT NULL,
    "deviceInfo" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationTemplate" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "titleTemplate" TEXT NOT NULL,
    "messageTemplate" TEXT NOT NULL,
    "emailTemplate" TEXT,
    "smsTemplate" TEXT,
    "defaultType" "public"."NotificationType" NOT NULL DEFAULT 'INFO',
    "defaultPriority" "public"."NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "defaultCategory" "public"."NotificationCategory" NOT NULL,
    "availableVariables" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QRCode" (
    "id" TEXT NOT NULL,
    "entityType" "public"."QRCodeType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT,
    "secureToken" TEXT NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "qrCodeDataUrl" TEXT,
    "metadata" JSONB,
    "status" "public"."QRCodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "allowedUserRoles" JSONB,
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    "maxScans" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "lastScannedAt" TIMESTAMP(3),
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QRScanLog" (
    "id" TEXT NOT NULL,
    "qrCodeId" TEXT NOT NULL,
    "userId" INTEGER,
    "sessionId" TEXT,
    "actionTaken" "public"."QRScanActionType",
    "actionData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "location" JSONB,
    "isSuccessful" BOOLEAN NOT NULL DEFAULT true,
    "errorCode" TEXT,
    "riskScore" DOUBLE PRECISION,
    "organizationId" INTEGER NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRScanLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QRBatchOperation" (
    "id" TEXT NOT NULL,
    "operationType" "public"."QRBatchOperationType" NOT NULL,
    "status" "public"."QRBatchOperationStatus" NOT NULL DEFAULT 'PENDING',
    "totalItems" INTEGER NOT NULL,
    "processedItems" INTEGER NOT NULL DEFAULT 0,
    "successfulItems" INTEGER NOT NULL DEFAULT 0,
    "failedItems" INTEGER NOT NULL DEFAULT 0,
    "options" JSONB,
    "errorLog" JSONB,
    "organizationId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRBatchOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QRBatchOperationItem" (
    "id" TEXT NOT NULL,
    "batchOperationId" TEXT NOT NULL,
    "qrCodeId" TEXT,
    "entityType" "public"."QRCodeType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT,
    "status" "public"."QRBatchOperationStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "resultData" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRBatchOperationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QRTemplate" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_legacyId_key" ON "public"."User"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_legacyId_key" ON "public"."Organization"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_name_key" ON "public"."Organization"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_legacyId_key" ON "public"."Asset"("legacyId");

-- CreateIndex
CREATE INDEX "Asset_organizationId_idx" ON "public"."Asset"("organizationId");

-- CreateIndex
CREATE INDEX "Asset_locationId_idx" ON "public"."Asset"("locationId");

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "public"."Asset"("status");

-- CreateIndex
CREATE INDEX "Asset_criticality_idx" ON "public"."Asset"("criticality");

-- CreateIndex
CREATE INDEX "Asset_parentId_idx" ON "public"."Asset"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_legacyId_key" ON "public"."Location"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_uniqueId_key" ON "public"."WorkOrder"("uniqueId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_legacyId_key" ON "public"."WorkOrder"("legacyId");

-- CreateIndex
CREATE INDEX "WorkOrder_organizationId_idx" ON "public"."WorkOrder"("organizationId");

-- CreateIndex
CREATE INDEX "WorkOrder_assetId_idx" ON "public"."WorkOrder"("assetId");

-- CreateIndex
CREATE INDEX "WorkOrder_assignedToId_idx" ON "public"."WorkOrder"("assignedToId");

-- CreateIndex
CREATE INDEX "WorkOrder_status_idx" ON "public"."WorkOrder"("status");

-- CreateIndex
CREATE INDEX "WorkOrder_priority_idx" ON "public"."WorkOrder"("priority");

-- CreateIndex
CREATE INDEX "WorkOrder_createdAt_idx" ON "public"."WorkOrder"("createdAt");

-- CreateIndex
CREATE INDEX "WorkOrder_pmScheduleId_idx" ON "public"."WorkOrder"("pmScheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "PMSchedule_uniqueId_key" ON "public"."PMSchedule"("uniqueId");

-- CreateIndex
CREATE UNIQUE INDEX "PMSchedule_legacyId_key" ON "public"."PMSchedule"("legacyId");

-- CreateIndex
CREATE INDEX "PMSchedule_assetId_idx" ON "public"."PMSchedule"("assetId");

-- CreateIndex
CREATE INDEX "PMSchedule_nextDue_idx" ON "public"."PMSchedule"("nextDue");

-- CreateIndex
CREATE INDEX "PMSchedule_assetId_nextDue_idx" ON "public"."PMSchedule"("assetId", "nextDue");

-- CreateIndex
CREATE UNIQUE INDEX "Part_legacyId_key" ON "public"."Part"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "Part_sku_key" ON "public"."Part"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_legacyId_key" ON "public"."Supplier"("legacyId");

-- CreateIndex
CREATE INDEX "PMTask_organizationId_idx" ON "public"."PMTask"("organizationId");

-- CreateIndex
CREATE INDEX "PMTask_type_idx" ON "public"."PMTask"("type");

-- CreateIndex
CREATE INDEX "PMTrigger_pmScheduleId_idx" ON "public"."PMTrigger"("pmScheduleId");

-- CreateIndex
CREATE INDEX "PMTrigger_type_idx" ON "public"."PMTrigger"("type");

-- CreateIndex
CREATE INDEX "PMTrigger_nextDue_idx" ON "public"."PMTrigger"("nextDue");

-- CreateIndex
CREATE INDEX "PMTrigger_meterType_idx" ON "public"."PMTrigger"("meterType");

-- CreateIndex
CREATE INDEX "WorkOrderTask_workOrderId_idx" ON "public"."WorkOrderTask"("workOrderId");

-- CreateIndex
CREATE INDEX "WorkOrderTask_status_idx" ON "public"."WorkOrderTask"("status");

-- CreateIndex
CREATE INDEX "WorkOrderTask_completedById_idx" ON "public"."WorkOrderTask"("completedById");

-- CreateIndex
CREATE INDEX "WorkOrderTask_pmTaskId_idx" ON "public"."WorkOrderTask"("pmTaskId");

-- CreateIndex
CREATE INDEX "MeterReading_assetId_meterType_idx" ON "public"."MeterReading"("assetId", "meterType");

-- CreateIndex
CREATE INDEX "MeterReading_readingDate_idx" ON "public"."MeterReading"("readingDate");

-- CreateIndex
CREATE INDEX "MeterReading_meterType_idx" ON "public"."MeterReading"("meterType");

-- CreateIndex
CREATE INDEX "MeterReading_assetId_meterType_readingDate_idx" ON "public"."MeterReading"("assetId", "meterType", "readingDate");

-- CreateIndex
CREATE INDEX "PMScheduleTask_pmScheduleId_idx" ON "public"."PMScheduleTask"("pmScheduleId");

-- CreateIndex
CREATE INDEX "PMScheduleTask_pmTaskId_idx" ON "public"."PMScheduleTask"("pmTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "PMScheduleTask_pmScheduleId_pmTaskId_key" ON "public"."PMScheduleTask"("pmScheduleId", "pmTaskId");

-- CreateIndex
CREATE INDEX "MaintenanceHistory_assetId_idx" ON "public"."MaintenanceHistory"("assetId");

-- CreateIndex
CREATE INDEX "MaintenanceHistory_workOrderId_idx" ON "public"."MaintenanceHistory"("workOrderId");

-- CreateIndex
CREATE INDEX "MaintenanceHistory_pmScheduleId_idx" ON "public"."MaintenanceHistory"("pmScheduleId");

-- CreateIndex
CREATE INDEX "MaintenanceHistory_type_idx" ON "public"."MaintenanceHistory"("type");

-- CreateIndex
CREATE INDEX "MaintenanceHistory_performedAt_idx" ON "public"."MaintenanceHistory"("performedAt");

-- CreateIndex
CREATE INDEX "MaintenanceHistory_performedById_idx" ON "public"."MaintenanceHistory"("performedById");

-- CreateIndex
CREATE INDEX "MaintenanceHistory_isCompleted_idx" ON "public"."MaintenanceHistory"("isCompleted");

-- CreateIndex
CREATE UNIQUE INDEX "Portal_slug_key" ON "public"."Portal"("slug");

-- CreateIndex
CREATE INDEX "Portal_organizationId_idx" ON "public"."Portal"("organizationId");

-- CreateIndex
CREATE INDEX "Portal_status_idx" ON "public"."Portal"("status");

-- CreateIndex
CREATE INDEX "Portal_type_idx" ON "public"."Portal"("type");

-- CreateIndex
CREATE INDEX "Portal_slug_idx" ON "public"."Portal"("slug");

-- CreateIndex
CREATE INDEX "PortalField_portalId_idx" ON "public"."PortalField"("portalId");

-- CreateIndex
CREATE INDEX "PortalField_orderIndex_idx" ON "public"."PortalField"("orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "PortalSubmission_trackingCode_key" ON "public"."PortalSubmission"("trackingCode");

-- CreateIndex
CREATE INDEX "PortalSubmission_portalId_idx" ON "public"."PortalSubmission"("portalId");

-- CreateIndex
CREATE INDEX "PortalSubmission_status_idx" ON "public"."PortalSubmission"("status");

-- CreateIndex
CREATE INDEX "PortalSubmission_trackingCode_idx" ON "public"."PortalSubmission"("trackingCode");

-- CreateIndex
CREATE INDEX "PortalSubmission_assignedToId_idx" ON "public"."PortalSubmission"("assignedToId");

-- CreateIndex
CREATE INDEX "PortalSubmission_workOrderId_idx" ON "public"."PortalSubmission"("workOrderId");

-- CreateIndex
CREATE INDEX "PortalSubmission_priority_idx" ON "public"."PortalSubmission"("priority");

-- CreateIndex
CREATE INDEX "PortalSubmission_createdAt_idx" ON "public"."PortalSubmission"("createdAt");

-- CreateIndex
CREATE INDEX "PortalCommunication_submissionId_idx" ON "public"."PortalCommunication"("submissionId");

-- CreateIndex
CREATE INDEX "PortalCommunication_messageType_idx" ON "public"."PortalCommunication"("messageType");

-- CreateIndex
CREATE INDEX "PortalCommunication_isInternal_idx" ON "public"."PortalCommunication"("isInternal");

-- CreateIndex
CREATE INDEX "PortalAnalytics_portalId_idx" ON "public"."PortalAnalytics"("portalId");

-- CreateIndex
CREATE INDEX "PortalAnalytics_date_idx" ON "public"."PortalAnalytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "PortalAnalytics_portalId_date_key" ON "public"."PortalAnalytics"("portalId", "date");

-- CreateIndex
CREATE INDEX "Comment_entityType_entityId_idx" ON "public"."Comment"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "public"."Comment"("userId");

-- CreateIndex
CREATE INDEX "Comment_createdAt_idx" ON "public"."Comment"("createdAt");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "public"."Comment"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "ImportHistory_importId_key" ON "public"."ImportHistory"("importId");

-- CreateIndex
CREATE INDEX "ImportHistory_organizationId_idx" ON "public"."ImportHistory"("organizationId");

-- CreateIndex
CREATE INDEX "ImportHistory_userId_idx" ON "public"."ImportHistory"("userId");

-- CreateIndex
CREATE INDEX "ImportHistory_entityType_idx" ON "public"."ImportHistory"("entityType");

-- CreateIndex
CREATE INDEX "ImportHistory_status_idx" ON "public"."ImportHistory"("status");

-- CreateIndex
CREATE INDEX "ImportHistory_createdAt_idx" ON "public"."ImportHistory"("createdAt");

-- CreateIndex
CREATE INDEX "ImportHistory_importId_idx" ON "public"."ImportHistory"("importId");

-- CreateIndex
CREATE INDEX "WorkOrderTimeLog_workOrderId_idx" ON "public"."WorkOrderTimeLog"("workOrderId");

-- CreateIndex
CREATE INDEX "WorkOrderTimeLog_userId_idx" ON "public"."WorkOrderTimeLog"("userId");

-- CreateIndex
CREATE INDEX "WorkOrderTimeLog_loggedAt_idx" ON "public"."WorkOrderTimeLog"("loggedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderShare_shareToken_key" ON "public"."WorkOrderShare"("shareToken");

-- CreateIndex
CREATE INDEX "WorkOrderShare_shareToken_idx" ON "public"."WorkOrderShare"("shareToken");

-- CreateIndex
CREATE INDEX "WorkOrderShare_workOrderId_idx" ON "public"."WorkOrderShare"("workOrderId");

-- CreateIndex
CREATE INDEX "WorkOrderShare_organizationId_idx" ON "public"."WorkOrderShare"("organizationId");

-- CreateIndex
CREATE INDEX "WorkOrderShare_expiresAt_idx" ON "public"."WorkOrderShare"("expiresAt");

-- CreateIndex
CREATE INDEX "PublicComment_shareId_idx" ON "public"."PublicComment"("shareId");

-- CreateIndex
CREATE INDEX "PublicComment_status_idx" ON "public"."PublicComment"("status");

-- CreateIndex
CREATE INDEX "PublicComment_ipAddressHash_idx" ON "public"."PublicComment"("ipAddressHash");

-- CreateIndex
CREATE INDEX "ShareAuditLog_shareId_idx" ON "public"."ShareAuditLog"("shareId");

-- CreateIndex
CREATE INDEX "ShareAuditLog_timestamp_idx" ON "public"."ShareAuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "ShareAuditLog_ipAddressHash_idx" ON "public"."ShareAuditLog"("ipAddressHash");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_organizationId_idx" ON "public"."Notification"("organizationId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "public"."Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_category_idx" ON "public"."Notification"("category");

-- CreateIndex
CREATE INDEX "Notification_priority_idx" ON "public"."Notification"("priority");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "public"."Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "public"."Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_expiresAt_idx" ON "public"."Notification"("expiresAt");

-- CreateIndex
CREATE INDEX "Notification_relatedEntityType_relatedEntityId_idx" ON "public"."Notification"("relatedEntityType", "relatedEntityId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "public"."Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_category_idx" ON "public"."Notification"("userId", "category");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "public"."NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreference_category_idx" ON "public"."NotificationPreference"("category");

-- CreateIndex
CREATE INDEX "NotificationPreference_channel_idx" ON "public"."NotificationPreference"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_category_channel_key" ON "public"."NotificationPreference"("userId", "category", "channel");

-- CreateIndex
CREATE INDEX "NotificationRule_organizationId_idx" ON "public"."NotificationRule"("organizationId");

-- CreateIndex
CREATE INDEX "NotificationRule_triggerType_idx" ON "public"."NotificationRule"("triggerType");

-- CreateIndex
CREATE INDEX "NotificationRule_isActive_idx" ON "public"."NotificationRule"("isActive");

-- CreateIndex
CREATE INDEX "NotificationDelivery_notificationId_idx" ON "public"."NotificationDelivery"("notificationId");

-- CreateIndex
CREATE INDEX "NotificationDelivery_channel_idx" ON "public"."NotificationDelivery"("channel");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_idx" ON "public"."NotificationDelivery"("status");

-- CreateIndex
CREATE INDEX "NotificationDelivery_attemptedAt_idx" ON "public"."NotificationDelivery"("attemptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDevice_deviceToken_key" ON "public"."NotificationDevice"("deviceToken");

-- CreateIndex
CREATE INDEX "NotificationDevice_userId_idx" ON "public"."NotificationDevice"("userId");

-- CreateIndex
CREATE INDEX "NotificationDevice_deviceType_idx" ON "public"."NotificationDevice"("deviceType");

-- CreateIndex
CREATE INDEX "NotificationDevice_isActive_idx" ON "public"."NotificationDevice"("isActive");

-- CreateIndex
CREATE INDEX "NotificationTemplate_organizationId_idx" ON "public"."NotificationTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "NotificationTemplate_key_idx" ON "public"."NotificationTemplate"("key");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_organizationId_key_key" ON "public"."NotificationTemplate"("organizationId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_secureToken_key" ON "public"."QRCode"("secureToken");

-- CreateIndex
CREATE INDEX "QRCode_entityType_entityId_idx" ON "public"."QRCode"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "QRCode_organizationId_idx" ON "public"."QRCode"("organizationId");

-- CreateIndex
CREATE INDEX "QRCode_secureToken_idx" ON "public"."QRCode"("secureToken");

-- CreateIndex
CREATE INDEX "QRCode_status_expiresAt_idx" ON "public"."QRCode"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "QRCode_createdById_idx" ON "public"."QRCode"("createdById");

-- CreateIndex
CREATE INDEX "QRScanLog_qrCodeId_scannedAt_idx" ON "public"."QRScanLog"("qrCodeId", "scannedAt");

-- CreateIndex
CREATE INDEX "QRScanLog_userId_scannedAt_idx" ON "public"."QRScanLog"("userId", "scannedAt");

-- CreateIndex
CREATE INDEX "QRScanLog_organizationId_scannedAt_idx" ON "public"."QRScanLog"("organizationId", "scannedAt");

-- CreateIndex
CREATE INDEX "QRScanLog_actionTaken_idx" ON "public"."QRScanLog"("actionTaken");

-- CreateIndex
CREATE INDEX "QRScanLog_isSuccessful_idx" ON "public"."QRScanLog"("isSuccessful");

-- CreateIndex
CREATE INDEX "QRBatchOperation_organizationId_idx" ON "public"."QRBatchOperation"("organizationId");

-- CreateIndex
CREATE INDEX "QRBatchOperation_createdById_idx" ON "public"."QRBatchOperation"("createdById");

-- CreateIndex
CREATE INDEX "QRBatchOperation_status_createdAt_idx" ON "public"."QRBatchOperation"("status", "createdAt");

-- CreateIndex
CREATE INDEX "QRBatchOperationItem_batchOperationId_idx" ON "public"."QRBatchOperationItem"("batchOperationId");

-- CreateIndex
CREATE INDEX "QRBatchOperationItem_qrCodeId_idx" ON "public"."QRBatchOperationItem"("qrCodeId");

-- CreateIndex
CREATE INDEX "QRBatchOperationItem_status_idx" ON "public"."QRBatchOperationItem"("status");

-- CreateIndex
CREATE INDEX "QRTemplate_organizationId_idx" ON "public"."QRTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "QRTemplate_category_idx" ON "public"."QRTemplate"("category");

-- CreateIndex
CREATE INDEX "QRTemplate_isPublic_idx" ON "public"."QRTemplate"("isPublic");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Asset" ADD CONSTRAINT "Asset_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Asset" ADD CONSTRAINT "Asset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Asset" ADD CONSTRAINT "Asset_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Location" ADD CONSTRAINT "Location_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Location" ADD CONSTRAINT "Location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrder" ADD CONSTRAINT "WorkOrder_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrder" ADD CONSTRAINT "WorkOrder_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrder" ADD CONSTRAINT "WorkOrder_pmScheduleId_fkey" FOREIGN KEY ("pmScheduleId") REFERENCES "public"."PMSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrder" ADD CONSTRAINT "WorkOrder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PMSchedule" ADD CONSTRAINT "PMSchedule_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Part" ADD CONSTRAINT "Part_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Part" ADD CONSTRAINT "Part_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Supplier" ADD CONSTRAINT "Supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PMTask" ADD CONSTRAINT "PMTask_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PMTrigger" ADD CONSTRAINT "PMTrigger_pmScheduleId_fkey" FOREIGN KEY ("pmScheduleId") REFERENCES "public"."PMSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrderTask" ADD CONSTRAINT "WorkOrderTask_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "public"."WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrderTask" ADD CONSTRAINT "WorkOrderTask_pmTaskId_fkey" FOREIGN KEY ("pmTaskId") REFERENCES "public"."PMTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrderTask" ADD CONSTRAINT "WorkOrderTask_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrderTask" ADD CONSTRAINT "WorkOrderTask_signedById_fkey" FOREIGN KEY ("signedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeterReading" ADD CONSTRAINT "MeterReading_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeterReading" ADD CONSTRAINT "MeterReading_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PMScheduleTask" ADD CONSTRAINT "PMScheduleTask_pmScheduleId_fkey" FOREIGN KEY ("pmScheduleId") REFERENCES "public"."PMSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PMScheduleTask" ADD CONSTRAINT "PMScheduleTask_pmTaskId_fkey" FOREIGN KEY ("pmTaskId") REFERENCES "public"."PMTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaintenanceHistory" ADD CONSTRAINT "MaintenanceHistory_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaintenanceHistory" ADD CONSTRAINT "MaintenanceHistory_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "public"."WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaintenanceHistory" ADD CONSTRAINT "MaintenanceHistory_pmScheduleId_fkey" FOREIGN KEY ("pmScheduleId") REFERENCES "public"."PMSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaintenanceHistory" ADD CONSTRAINT "MaintenanceHistory_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaintenanceHistory" ADD CONSTRAINT "MaintenanceHistory_signedById_fkey" FOREIGN KEY ("signedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Portal" ADD CONSTRAINT "Portal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PortalField" ADD CONSTRAINT "PortalField_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "public"."Portal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PortalSubmission" ADD CONSTRAINT "PortalSubmission_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "public"."Portal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PortalSubmission" ADD CONSTRAINT "PortalSubmission_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PortalSubmission" ADD CONSTRAINT "PortalSubmission_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "public"."WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PortalSubmission" ADD CONSTRAINT "PortalSubmission_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PortalSubmission" ADD CONSTRAINT "PortalSubmission_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PortalCommunication" ADD CONSTRAINT "PortalCommunication_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."PortalSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PortalCommunication" ADD CONSTRAINT "PortalCommunication_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PortalAnalytics" ADD CONSTRAINT "PortalAnalytics_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "public"."Portal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ImportHistory" ADD CONSTRAINT "ImportHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ImportHistory" ADD CONSTRAINT "ImportHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ImportHistory" ADD CONSTRAINT "ImportHistory_rolledBackById_fkey" FOREIGN KEY ("rolledBackById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrderTimeLog" ADD CONSTRAINT "WorkOrderTimeLog_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "public"."WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrderTimeLog" ADD CONSTRAINT "WorkOrderTimeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrderShare" ADD CONSTRAINT "WorkOrderShare_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "public"."WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrderShare" ADD CONSTRAINT "WorkOrderShare_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrderShare" ADD CONSTRAINT "WorkOrderShare_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PublicComment" ADD CONSTRAINT "PublicComment_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "public"."WorkOrderShare"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PublicComment" ADD CONSTRAINT "PublicComment_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShareAuditLog" ADD CONSTRAINT "ShareAuditLog_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "public"."WorkOrderShare"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationDevice" ADD CONSTRAINT "NotificationDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QRCode" ADD CONSTRAINT "QRCode_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QRCode" ADD CONSTRAINT "QRCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QRScanLog" ADD CONSTRAINT "QRScanLog_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "public"."QRCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QRScanLog" ADD CONSTRAINT "QRScanLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QRScanLog" ADD CONSTRAINT "QRScanLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QRBatchOperation" ADD CONSTRAINT "QRBatchOperation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QRBatchOperation" ADD CONSTRAINT "QRBatchOperation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QRBatchOperationItem" ADD CONSTRAINT "QRBatchOperationItem_batchOperationId_fkey" FOREIGN KEY ("batchOperationId") REFERENCES "public"."QRBatchOperation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QRBatchOperationItem" ADD CONSTRAINT "QRBatchOperationItem_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "public"."QRCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QRTemplate" ADD CONSTRAINT "QRTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QRTemplate" ADD CONSTRAINT "QRTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

