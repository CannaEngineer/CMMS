-- CreateEnum for QR Entity Types
CREATE TYPE "QREntityType" AS ENUM ('ASSET', 'LOCATION', 'WORK_ORDER', 'PM_SCHEDULE', 'PART', 'USER', 'PORTAL');

-- CreateEnum for QR Status
CREATE TYPE "QRStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum for QR Batch Status
CREATE TYPE "QRBatchStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum for QR Scan Action
CREATE TYPE "QRScanAction" AS ENUM ('VIEW', 'EDIT', 'CREATE_WORK_ORDER', 'UPDATE_STATUS', 'LOG_METER', 'INSPECT', 'DOWNLOAD');

-- CreateTable for QR Codes
CREATE TABLE "qr_codes" (
    "id" SERIAL NOT NULL,
    "uniqueId" TEXT NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "entityType" "QREntityType" NOT NULL,
    "entityId" INTEGER NOT NULL,
    "entityUniqueId" TEXT,
    "qrData" TEXT NOT NULL,
    "qrHash" TEXT NOT NULL,
    "qrImageUrl" TEXT,
    "shortUrl" TEXT,
    "title" TEXT,
    "description" TEXT,
    "customData" JSONB NOT NULL DEFAULT '{}',
    "status" "QRStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "maxScans" INTEGER,
    "currentScans" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "requiresAuth" BOOLEAN NOT NULL DEFAULT true,
    "allowedRoles" TEXT[],
    "accessPermissions" JSONB NOT NULL DEFAULT '{}',
    "format" TEXT NOT NULL DEFAULT 'PNG',
    "size" INTEGER NOT NULL DEFAULT 200,
    "color" TEXT NOT NULL DEFAULT '#000000',
    "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "logoUrl" TEXT,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qr_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable for QR Scan Logs
CREATE TABLE "qr_scan_logs" (
    "id" TEXT NOT NULL,
    "qrCodeId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "scanAction" "QRScanAction" NOT NULL DEFAULT 'VIEW',
    "scanResult" TEXT NOT NULL DEFAULT 'SUCCESS',
    "errorMessage" TEXT,
    "scannedBy" INTEGER,
    "userRole" TEXT,
    "sessionId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "platform" TEXT,
    "scanLocation" JSONB,
    "scanContext" JSONB NOT NULL DEFAULT '{}',
    "referrerUrl" TEXT,
    "responseTimeMs" INTEGER,
    "dataTransferredBytes" INTEGER,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qr_scan_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable for QR Batch Operations
CREATE TABLE "qr_batch_operations" (
    "id" SERIAL NOT NULL,
    "batchId" TEXT NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "operationType" TEXT NOT NULL,
    "entityType" "QREntityType" NOT NULL,
    "status" "QRBatchStatus" NOT NULL DEFAULT 'PENDING',
    "batchName" TEXT,
    "description" TEXT,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "templateConfig" JSONB NOT NULL DEFAULT '{}',
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "processedItems" INTEGER NOT NULL DEFAULT 0,
    "successfulItems" INTEGER NOT NULL DEFAULT 0,
    "failedItems" INTEGER NOT NULL DEFAULT 0,
    "results" JSONB NOT NULL DEFAULT '[]',
    "errors" JSONB NOT NULL DEFAULT '[]',
    "outputFiles" TEXT[],
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "estimatedCompletion" TIMESTAMP(3),
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qr_batch_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable for QR Templates
CREATE TABLE "qr_templates" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entityType" "QREntityType" NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qr_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for QR Codes
CREATE UNIQUE INDEX "qr_codes_uniqueId_key" ON "qr_codes"("uniqueId");
CREATE UNIQUE INDEX "qr_codes_qrHash_key" ON "qr_codes"("qrHash");
CREATE UNIQUE INDEX "qr_codes_shortUrl_key" ON "qr_codes"("shortUrl");
CREATE UNIQUE INDEX "qr_codes_organizationId_entityType_entityId_key" ON "qr_codes"("organizationId", "entityType", "entityId");
CREATE INDEX "qr_codes_organizationId_idx" ON "qr_codes"("organizationId");
CREATE INDEX "qr_codes_entityType_entityId_idx" ON "qr_codes"("entityType", "entityId");
CREATE INDEX "qr_codes_status_idx" ON "qr_codes"("status");
CREATE INDEX "qr_codes_expiresAt_idx" ON "qr_codes"("expiresAt");
CREATE INDEX "qr_codes_createdAt_idx" ON "qr_codes"("createdAt");
CREATE INDEX "qr_codes_organizationId_entityType_status_idx" ON "qr_codes"("organizationId", "entityType", "status");

-- CreateIndex for QR Scan Logs
CREATE INDEX "qr_scan_logs_qrCodeId_idx" ON "qr_scan_logs"("qrCodeId");
CREATE INDEX "qr_scan_logs_organizationId_idx" ON "qr_scan_logs"("organizationId");
CREATE INDEX "qr_scan_logs_scannedAt_idx" ON "qr_scan_logs"("scannedAt");
CREATE INDEX "qr_scan_logs_scannedBy_idx" ON "qr_scan_logs"("scannedBy");
CREATE INDEX "qr_scan_logs_ipAddress_idx" ON "qr_scan_logs"("ipAddress");
CREATE INDEX "qr_scan_logs_deviceType_idx" ON "qr_scan_logs"("deviceType");
CREATE INDEX "qr_scan_logs_scanAction_idx" ON "qr_scan_logs"("scanAction");
CREATE INDEX "qr_scan_logs_organizationId_scannedAt_scanAction_idx" ON "qr_scan_logs"("organizationId", "scannedAt", "scanAction");

-- CreateIndex for QR Batch Operations
CREATE UNIQUE INDEX "qr_batch_operations_batchId_key" ON "qr_batch_operations"("batchId");
CREATE INDEX "qr_batch_operations_organizationId_idx" ON "qr_batch_operations"("organizationId");
CREATE INDEX "qr_batch_operations_status_idx" ON "qr_batch_operations"("status");
CREATE INDEX "qr_batch_operations_createdBy_idx" ON "qr_batch_operations"("createdBy");
CREATE INDEX "qr_batch_operations_createdAt_idx" ON "qr_batch_operations"("createdAt");
CREATE INDEX "qr_batch_operations_operationType_idx" ON "qr_batch_operations"("operationType");

-- CreateIndex for QR Templates
CREATE UNIQUE INDEX "qr_templates_organizationId_name_key" ON "qr_templates"("organizationId", "name");
CREATE INDEX "qr_templates_organizationId_idx" ON "qr_templates"("organizationId");
CREATE INDEX "qr_templates_entityType_idx" ON "qr_templates"("entityType");
CREATE INDEX "qr_templates_isActive_idx" ON "qr_templates"("isActive");
CREATE INDEX "qr_templates_isDefault_idx" ON "qr_templates"("isDefault");

-- AddForeignKey
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_scan_logs" ADD CONSTRAINT "qr_scan_logs_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "qr_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_scan_logs" ADD CONSTRAINT "qr_scan_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_scan_logs" ADD CONSTRAINT "qr_scan_logs_scannedBy_fkey" FOREIGN KEY ("scannedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_batch_operations" ADD CONSTRAINT "qr_batch_operations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_batch_operations" ADD CONSTRAINT "qr_batch_operations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_templates" ADD CONSTRAINT "qr_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_templates" ADD CONSTRAINT "qr_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_qr_codes_updated_at 
    BEFORE UPDATE ON qr_codes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qr_batch_operations_updated_at 
    BEFORE UPDATE ON qr_batch_operations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qr_templates_updated_at 
    BEFORE UPDATE ON qr_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger function for auto-incrementing scan count
CREATE OR REPLACE FUNCTION increment_qr_scan_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE qr_codes 
    SET current_scans = current_scans + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.qr_code_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for scan count increment
CREATE TRIGGER increment_scan_count_trigger 
    AFTER INSERT ON qr_scan_logs
    FOR EACH ROW EXECUTE FUNCTION increment_qr_scan_count();

-- Create function for QR code cleanup (expired codes)
CREATE OR REPLACE FUNCTION cleanup_expired_qr_codes()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE qr_codes 
    SET status = 'EXPIRED', 
        updated_at = CURRENT_TIMESTAMP
    WHERE status = 'ACTIVE' 
      AND expires_at IS NOT NULL 
      AND expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ language 'plpgsql';

-- Create function for scan analytics aggregation
CREATE OR REPLACE FUNCTION get_qr_scan_analytics(
    p_organization_id INTEGER,
    p_start_date TIMESTAMP DEFAULT NULL,
    p_end_date TIMESTAMP DEFAULT NULL
)
RETURNS TABLE(
    total_scans BIGINT,
    unique_scanners BIGINT,
    scans_by_action JSONB,
    scans_by_device JSONB,
    avg_response_time NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_scans,
        COUNT(DISTINCT scanned_by) as unique_scanners,
        jsonb_object_agg(scan_action, action_count) as scans_by_action,
        jsonb_object_agg(device_type, device_count) as scans_by_device,
        AVG(response_time_ms) as avg_response_time
    FROM (
        SELECT 
            scan_action,
            device_type,
            scanned_by,
            response_time_ms,
            COUNT(*) OVER (PARTITION BY scan_action) as action_count,
            COUNT(*) OVER (PARTITION BY device_type) as device_count
        FROM qr_scan_logs
        WHERE organization_id = p_organization_id
          AND (p_start_date IS NULL OR scanned_at >= p_start_date)
          AND (p_end_date IS NULL OR scanned_at <= p_end_date)
    ) subquery;
END;
$$ language 'plpgsql';

-- Create function for batch operation progress tracking
CREATE OR REPLACE FUNCTION update_batch_progress(
    p_batch_id TEXT,
    p_processed INTEGER,
    p_successful INTEGER,
    p_failed INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE qr_batch_operations
    SET processed_items = p_processed,
        successful_items = p_successful,
        failed_items = p_failed,
        updated_at = CURRENT_TIMESTAMP
    WHERE batch_id = p_batch_id;
    
    RETURN FOUND;
END;
$$ language 'plpgsql';

-- Insert default QR templates for each entity type
INSERT INTO qr_templates (organization_id, name, description, entity_type, config, is_default, created_by)
SELECT 
    1 as organization_id,
    'Default ' || entity_type::text || ' QR Template' as name,
    'Default template for generating QR codes for ' || entity_type::text as description,
    entity_type,
    '{"format": "PNG", "size": 200, "color": "#000000", "backgroundColor": "#FFFFFF", "errorCorrectionLevel": "M"}' as config,
    true as is_default,
    1 as created_by
FROM (VALUES 
    ('ASSET'::QREntityType),
    ('LOCATION'::QREntityType),
    ('WORK_ORDER'::QREntityType),
    ('PM_SCHEDULE'::QREntityType),
    ('PART'::QREntityType)
) AS entity_types(entity_type)
WHERE EXISTS (SELECT 1 FROM "Organization" WHERE id = 1);

-- Create view for QR code analytics
CREATE VIEW qr_code_analytics AS
SELECT 
    qc.id,
    qc.unique_id,
    qc.organization_id,
    qc.entity_type,
    qc.entity_id,
    qc.title,
    qc.status,
    qc.current_scans,
    qc.created_at,
    COUNT(qsl.id) as total_scan_logs,
    COUNT(DISTINCT qsl.scanned_by) as unique_scanners,
    MAX(qsl.scanned_at) as last_scanned,
    AVG(qsl.response_time_ms) as avg_response_time,
    COUNT(CASE WHEN qsl.scan_result = 'ERROR' THEN 1 END) as error_count
FROM qr_codes qc
LEFT JOIN qr_scan_logs qsl ON qc.id = qsl.qr_code_id
GROUP BY qc.id, qc.unique_id, qc.organization_id, qc.entity_type, 
         qc.entity_id, qc.title, qc.status, qc.current_scans, qc.created_at;

-- Create view for batch operation summary
CREATE VIEW qr_batch_summary AS
SELECT 
    qbo.*,
    CASE 
        WHEN qbo.total_items > 0 THEN 
            ROUND((qbo.processed_items::numeric / qbo.total_items::numeric) * 100, 2)
        ELSE 0 
    END as progress_percentage,
    u.name as created_by_name,
    EXTRACT(EPOCH FROM (qbo.completed_at - qbo.started_at)) as duration_seconds
FROM qr_batch_operations qbo
LEFT JOIN "User" u ON qbo.created_by = u.id;