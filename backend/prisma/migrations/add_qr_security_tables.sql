-- Migration: Add QR Security Tables
-- This migration adds security-focused tables for QR code management

-- QR Token Metadata Table
-- Stores metadata about generated QR tokens for audit and management
CREATE TABLE IF NOT EXISTS QRTokenMetadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL UNIQUE,
    resourceType TEXT NOT NULL, -- 'asset', 'work-order', etc.
    resourceId TEXT NOT NULL,
    organizationId INTEGER NOT NULL,
    createdBy INTEGER,
    createdAt INTEGER NOT NULL, -- Unix timestamp
    expiresAt INTEGER NOT NULL, -- Unix timestamp
    isRevoked BOOLEAN DEFAULT FALSE,
    revokedAt INTEGER, -- Unix timestamp
    revokedBy INTEGER,
    scanCount INTEGER DEFAULT 0,
    scanLimit INTEGER, -- Optional scan limit
    lastScannedAt INTEGER, -- Unix timestamp
    
    -- Indexes for performance
    CONSTRAINT fk_qr_organization FOREIGN KEY (organizationId) REFERENCES Organization(id) ON DELETE CASCADE,
    CONSTRAINT fk_qr_created_by FOREIGN KEY (createdBy) REFERENCES User(id) ON DELETE SET NULL,
    CONSTRAINT fk_qr_revoked_by FOREIGN KEY (revokedBy) REFERENCES User(id) ON DELETE SET NULL
);

-- Create indexes for QRTokenMetadata
CREATE INDEX IF NOT EXISTS idx_qr_token_metadata_token ON QRTokenMetadata(token);
CREATE INDEX IF NOT EXISTS idx_qr_token_metadata_org ON QRTokenMetadata(organizationId);
CREATE INDEX IF NOT EXISTS idx_qr_token_metadata_resource ON QRTokenMetadata(resourceType, resourceId);
CREATE INDEX IF NOT EXISTS idx_qr_token_metadata_expires ON QRTokenMetadata(expiresAt);
CREATE INDEX IF NOT EXISTS idx_qr_token_metadata_created ON QRTokenMetadata(createdAt);

-- QR Access Log Table
-- Comprehensive audit trail for all QR access attempts
CREATE TABLE IF NOT EXISTS QRAccessLog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    qrToken TEXT NOT NULL, -- Reference to QR token (not FK for performance)
    userId INTEGER,
    organizationId INTEGER NOT NULL,
    ipAddress TEXT NOT NULL,
    userAgent TEXT,
    scanResult TEXT NOT NULL, -- 'success', 'denied', 'expired', 'invalid'
    timestamp INTEGER NOT NULL, -- Unix timestamp
    latitude REAL, -- Optional location data
    longitude REAL,
    riskScore INTEGER DEFAULT 0, -- Security risk score
    blockedReason TEXT, -- Reason if access was blocked
    deviceFingerprint TEXT, -- Optional device identification
    sessionId TEXT, -- Optional session tracking
    
    -- Foreign keys
    CONSTRAINT fk_qr_log_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE SET NULL,
    CONSTRAINT fk_qr_log_organization FOREIGN KEY (organizationId) REFERENCES Organization(id) ON DELETE CASCADE
);

-- Create indexes for QRAccessLog
CREATE INDEX IF NOT EXISTS idx_qr_access_log_token ON QRAccessLog(qrToken);
CREATE INDEX IF NOT EXISTS idx_qr_access_log_user ON QRAccessLog(userId);
CREATE INDEX IF NOT EXISTS idx_qr_access_log_org ON QRAccessLog(organizationId);
CREATE INDEX IF NOT EXISTS idx_qr_access_log_timestamp ON QRAccessLog(timestamp);
CREATE INDEX IF NOT EXISTS idx_qr_access_log_result ON QRAccessLog(scanResult);
CREATE INDEX IF NOT EXISTS idx_qr_access_log_ip ON QRAccessLog(ipAddress);
CREATE INDEX IF NOT EXISTS idx_qr_access_log_risk ON QRAccessLog(riskScore);

-- QR Permissions Table
-- Fine-grained permissions for QR operations
CREATE TABLE IF NOT EXISTS QRPermissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    organizationId INTEGER NOT NULL,
    resourceType TEXT NOT NULL, -- 'asset', 'work-order', etc.
    resourceId TEXT, -- NULL means permission applies to all resources of this type
    permission TEXT NOT NULL, -- 'scan', 'generate', 'revoke', 'audit'
    grantedBy INTEGER NOT NULL,
    grantedAt INTEGER NOT NULL, -- Unix timestamp
    expiresAt INTEGER, -- Optional expiration
    isActive BOOLEAN DEFAULT TRUE,
    
    -- Foreign keys
    CONSTRAINT fk_qr_perm_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    CONSTRAINT fk_qr_perm_organization FOREIGN KEY (organizationId) REFERENCES Organization(id) ON DELETE CASCADE,
    CONSTRAINT fk_qr_perm_granted_by FOREIGN KEY (grantedBy) REFERENCES User(id) ON DELETE RESTRICT,
    
    -- Unique constraint to prevent duplicate permissions
    CONSTRAINT uk_qr_permissions UNIQUE (userId, organizationId, resourceType, resourceId, permission)
);

-- Create indexes for QRPermissions
CREATE INDEX IF NOT EXISTS idx_qr_permissions_user ON QRPermissions(userId);
CREATE INDEX IF NOT EXISTS idx_qr_permissions_org ON QRPermissions(organizationId);
CREATE INDEX IF NOT EXISTS idx_qr_permissions_resource ON QRPermissions(resourceType, resourceId);
CREATE INDEX IF NOT EXISTS idx_qr_permissions_active ON QRPermissions(isActive);

-- QR Security Events Table
-- High-level security events for monitoring
CREATE TABLE IF NOT EXISTS QRSecurityEvents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eventType TEXT NOT NULL, -- 'suspicious_activity', 'rate_limit_exceeded', 'brute_force', etc.
    severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    organizationId INTEGER NOT NULL,
    userId INTEGER, -- May be NULL for unauthenticated events
    ipAddress TEXT NOT NULL,
    userAgent TEXT,
    description TEXT NOT NULL,
    metadata TEXT, -- JSON blob for additional data
    timestamp INTEGER NOT NULL, -- Unix timestamp
    resolved BOOLEAN DEFAULT FALSE,
    resolvedBy INTEGER,
    resolvedAt INTEGER,
    
    -- Foreign keys
    CONSTRAINT fk_qr_security_organization FOREIGN KEY (organizationId) REFERENCES Organization(id) ON DELETE CASCADE,
    CONSTRAINT fk_qr_security_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE SET NULL,
    CONSTRAINT fk_qr_security_resolved_by FOREIGN KEY (resolvedBy) REFERENCES User(id) ON DELETE SET NULL
);

-- Create indexes for QRSecurityEvents
CREATE INDEX IF NOT EXISTS idx_qr_security_events_type ON QRSecurityEvents(eventType);
CREATE INDEX IF NOT EXISTS idx_qr_security_events_severity ON QRSecurityEvents(severity);
CREATE INDEX IF NOT EXISTS idx_qr_security_events_org ON QRSecurityEvents(organizationId);
CREATE INDEX IF NOT EXISTS idx_qr_security_events_timestamp ON QRSecurityEvents(timestamp);
CREATE INDEX IF NOT EXISTS idx_qr_security_events_resolved ON QRSecurityEvents(resolved);
CREATE INDEX IF NOT EXISTS idx_qr_security_events_ip ON QRSecurityEvents(ipAddress);

-- QR Rate Limits Table
-- Store rate limiting data per user/IP
CREATE TABLE IF NOT EXISTS QRRateLimits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier TEXT NOT NULL, -- User ID, IP address, or composite key
    organizationId INTEGER NOT NULL,
    limitType TEXT NOT NULL, -- 'scan', 'generate', 'api_call'
    requestCount INTEGER DEFAULT 0,
    windowStart INTEGER NOT NULL, -- Unix timestamp
    windowEnd INTEGER NOT NULL, -- Unix timestamp
    lastRequestAt INTEGER NOT NULL, -- Unix timestamp
    
    -- Foreign key
    CONSTRAINT fk_qr_rate_limit_organization FOREIGN KEY (organizationId) REFERENCES Organization(id) ON DELETE CASCADE,
    
    -- Unique constraint for rate limiting windows
    CONSTRAINT uk_qr_rate_limits UNIQUE (identifier, organizationId, limitType, windowStart)
);

-- Create indexes for QRRateLimits
CREATE INDEX IF NOT EXISTS idx_qr_rate_limits_identifier ON QRRateLimits(identifier);
CREATE INDEX IF NOT EXISTS idx_qr_rate_limits_org ON QRRateLimits(organizationId);
CREATE INDEX IF NOT EXISTS idx_qr_rate_limits_type ON QRRateLimits(limitType);
CREATE INDEX IF NOT EXISTS idx_qr_rate_limits_window ON QRRateLimits(windowStart, windowEnd);

-- Add QR-related columns to existing User table
-- (Use ALTER TABLE if the columns don't exist)
ALTER TABLE User ADD COLUMN qrGenerationCount INTEGER DEFAULT 0;
ALTER TABLE User ADD COLUMN qrScanCount INTEGER DEFAULT 0;
ALTER TABLE User ADD COLUMN lastQRActivity INTEGER; -- Unix timestamp
ALTER TABLE User ADD COLUMN qrSecurityScore INTEGER DEFAULT 100; -- 0-100 scale

-- Add QR-related columns to existing Organization table
ALTER TABLE Organization ADD COLUMN qrSecurityPolicy TEXT; -- JSON blob for QR security settings
ALTER TABLE Organization ADD COLUMN qrGenerationLimit INTEGER DEFAULT 1000; -- Per month
ALTER TABLE Organization ADD COLUMN qrScanLimit INTEGER DEFAULT 10000; -- Per month
ALTER TABLE Organization ADD COLUMN qrTokenExpiry INTEGER DEFAULT 86400; -- Default 24 hours in seconds

-- Create a view for QR security dashboard
CREATE VIEW IF NOT EXISTS QRSecurityDashboard AS
SELECT 
    o.id as organizationId,
    o.name as organizationName,
    COUNT(DISTINCT qtm.id) as totalQRCodes,
    COUNT(DISTINCT CASE WHEN qtm.isRevoked = FALSE AND qtm.expiresAt > strftime('%s', 'now') * 1000 THEN qtm.id END) as activeQRCodes,
    COUNT(DISTINCT qal.id) as totalScans,
    COUNT(DISTINCT CASE WHEN qal.scanResult = 'success' THEN qal.id END) as successfulScans,
    COUNT(DISTINCT CASE WHEN qal.scanResult = 'denied' THEN qal.id END) as deniedScans,
    COUNT(DISTINCT CASE WHEN qal.timestamp > strftime('%s', 'now', '-24 hours') * 1000 THEN qal.id END) as scansLast24h,
    COUNT(DISTINCT qse.id) as securityEvents,
    COUNT(DISTINCT CASE WHEN qse.severity IN ('high', 'critical') AND qse.resolved = FALSE THEN qse.id END) as criticalEvents
FROM Organization o
LEFT JOIN QRTokenMetadata qtm ON o.id = qtm.organizationId
LEFT JOIN QRAccessLog qal ON o.id = qal.organizationId
LEFT JOIN QRSecurityEvents qse ON o.id = qse.organizationId
GROUP BY o.id, o.name;

-- Add triggers for automatic cleanup of old data
-- Clean up old access logs (keep 1 year)
CREATE TRIGGER IF NOT EXISTS cleanup_old_qr_access_logs
AFTER INSERT ON QRAccessLog
BEGIN
    DELETE FROM QRAccessLog 
    WHERE timestamp < (strftime('%s', 'now', '-1 year') * 1000);
END;

-- Clean up expired QR tokens
CREATE TRIGGER IF NOT EXISTS cleanup_expired_qr_tokens
AFTER INSERT ON QRTokenMetadata
BEGIN
    DELETE FROM QRTokenMetadata 
    WHERE expiresAt < (strftime('%s', 'now') * 1000) 
    AND isRevoked = FALSE;
END;

-- Insert default QR permissions for existing users
INSERT OR IGNORE INTO QRPermissions (userId, organizationId, resourceType, permission, grantedBy, grantedAt, isActive)
SELECT 
    u.id as userId,
    u.organizationId,
    'asset' as resourceType,
    CASE 
        WHEN u.role = 'ADMIN' THEN 'generate'
        WHEN u.role = 'MANAGER' THEN 'generate'
        ELSE 'scan'
    END as permission,
    1 as grantedBy, -- Assuming admin user ID is 1
    strftime('%s', 'now') * 1000 as grantedAt,
    TRUE as isActive
FROM User u
WHERE u.id IS NOT NULL;