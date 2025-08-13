-- =====================================================
-- QR SYSTEM DATABASE SCHEMA FOR CMMS APPLICATION
-- =====================================================

-- QR Code Entity Type Enum
CREATE TYPE qr_entity_type AS ENUM (
  'ASSET',
  'LOCATION', 
  'WORK_ORDER',
  'PM_SCHEDULE',
  'PART',
  'USER',
  'PORTAL'
);

-- QR Code Status Enum
CREATE TYPE qr_status AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'EXPIRED',
  'REVOKED'
);

-- QR Batch Operation Status Enum
CREATE TYPE qr_batch_status AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);

-- QR Scan Action Type Enum
CREATE TYPE qr_scan_action AS ENUM (
  'VIEW',
  'EDIT',
  'CREATE_WORK_ORDER',
  'UPDATE_STATUS',
  'LOG_METER',
  'INSPECT',
  'DOWNLOAD'
);

-- =====================================================
-- CORE QR CODE TABLE
-- =====================================================
CREATE TABLE qr_codes (
  id SERIAL PRIMARY KEY,
  unique_id VARCHAR(255) UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  organization_id INTEGER NOT NULL,
  
  -- Entity Association (Polymorphic)
  entity_type qr_entity_type NOT NULL,
  entity_id INTEGER NOT NULL,
  entity_unique_id VARCHAR(255), -- For human-readable references
  
  -- QR Code Properties
  qr_data TEXT NOT NULL, -- The actual QR code data/URL
  qr_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hash for deduplication
  qr_image_url TEXT, -- Generated QR code image URL
  short_url VARCHAR(255) UNIQUE, -- Shortened URL for QR code
  
  -- Metadata
  title VARCHAR(255),
  description TEXT,
  custom_data JSONB DEFAULT '{}', -- Flexible additional data
  
  -- Configuration
  status qr_status DEFAULT 'ACTIVE',
  expires_at TIMESTAMP,
  max_scans INTEGER, -- Optional scan limit
  current_scans INTEGER DEFAULT 0,
  
  -- Security & Access Control
  is_public BOOLEAN DEFAULT false,
  requires_auth BOOLEAN DEFAULT true,
  allowed_roles TEXT[], -- Array of allowed user roles
  access_permissions JSONB DEFAULT '{}', -- Granular permissions
  
  -- Format & Display Options
  format VARCHAR(50) DEFAULT 'PNG', -- PNG, SVG, PDF
  size INTEGER DEFAULT 200, -- QR code size in pixels
  color VARCHAR(7) DEFAULT '#000000', -- Hex color
  background_color VARCHAR(7) DEFAULT '#FFFFFF',
  logo_url TEXT, -- Optional logo overlay
  
  -- Audit Fields
  created_by INTEGER,
  updated_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT qr_codes_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT qr_codes_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT qr_codes_updated_by_fk FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT qr_codes_entity_unique UNIQUE (organization_id, entity_type, entity_id)
);

-- =====================================================
-- QR SCAN LOG TABLE - Analytics & Audit Trail
-- =====================================================
CREATE TABLE qr_scan_logs (
  id SERIAL PRIMARY KEY,
  qr_code_id INTEGER NOT NULL,
  organization_id INTEGER NOT NULL,
  
  -- Scan Details
  scan_action qr_scan_action DEFAULT 'VIEW',
  scan_result VARCHAR(50) DEFAULT 'SUCCESS', -- SUCCESS, ERROR, BLOCKED
  error_message TEXT,
  
  -- User Information
  scanned_by INTEGER, -- NULL for anonymous scans
  user_role VARCHAR(50),
  session_id VARCHAR(255),
  
  -- Technical Details
  ip_address INET,
  user_agent TEXT,
  device_type VARCHAR(50), -- mobile, desktop, tablet
  browser VARCHAR(100),
  platform VARCHAR(100),
  
  -- Location & Context
  scan_location POINT, -- GPS coordinates if available
  scan_context JSONB DEFAULT '{}', -- Additional context data
  referrer_url TEXT,
  
  -- Performance Metrics
  response_time_ms INTEGER,
  data_transferred_bytes INTEGER,
  
  -- Timestamp
  scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT qr_scan_logs_qr_code_fk FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE,
  CONSTRAINT qr_scan_logs_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT qr_scan_logs_scanned_by_fk FOREIGN KEY (scanned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- QR BATCH OPERATIONS TABLE - Bulk Operations
-- =====================================================
CREATE TABLE qr_batch_operations (
  id SERIAL PRIMARY KEY,
  batch_id VARCHAR(255) UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  organization_id INTEGER NOT NULL,
  
  -- Operation Details
  operation_type VARCHAR(50) NOT NULL, -- GENERATE, UPDATE, DELETE, EXPORT
  entity_type qr_entity_type NOT NULL,
  status qr_batch_status DEFAULT 'PENDING',
  
  -- Batch Configuration
  batch_name VARCHAR(255),
  description TEXT,
  filters JSONB DEFAULT '{}', -- Entity selection filters
  template_config JSONB DEFAULT '{}', -- QR generation template
  
  -- Progress Tracking
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  successful_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  
  -- Results & Errors
  results JSONB DEFAULT '[]', -- Array of operation results
  errors JSONB DEFAULT '[]', -- Array of error details
  output_files TEXT[], -- Generated file URLs
  
  -- Timing
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  estimated_completion TIMESTAMP,
  
  -- User & Audit
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT qr_batch_ops_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT qr_batch_ops_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- QR TEMPLATES TABLE - Reusable QR Configurations
-- =====================================================
CREATE TABLE qr_templates (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  
  -- Template Identity
  name VARCHAR(255) NOT NULL,
  description TEXT,
  entity_type qr_entity_type NOT NULL,
  
  -- Template Configuration
  config JSONB NOT NULL DEFAULT '{}', -- QR generation settings
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Usage Tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  
  -- Audit
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT qr_templates_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT qr_templates_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT qr_templates_name_unique UNIQUE (organization_id, name)
);

-- =====================================================
-- INDEXES FOR OPTIMAL PERFORMANCE
-- =====================================================

-- QR Codes Indexes
CREATE INDEX idx_qr_codes_organization_id ON qr_codes(organization_id);
CREATE INDEX idx_qr_codes_entity_type_id ON qr_codes(entity_type, entity_id);
CREATE INDEX idx_qr_codes_status ON qr_codes(status);
CREATE INDEX idx_qr_codes_hash ON qr_codes(qr_hash);
CREATE INDEX idx_qr_codes_short_url ON qr_codes(short_url);
CREATE INDEX idx_qr_codes_expires_at ON qr_codes(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_qr_codes_created_at ON qr_codes(created_at);
CREATE INDEX idx_qr_codes_org_entity_composite ON qr_codes(organization_id, entity_type, status);

-- QR Scan Logs Indexes
CREATE INDEX idx_qr_scan_logs_qr_code_id ON qr_scan_logs(qr_code_id);
CREATE INDEX idx_qr_scan_logs_organization_id ON qr_scan_logs(organization_id);
CREATE INDEX idx_qr_scan_logs_scanned_at ON qr_scan_logs(scanned_at);
CREATE INDEX idx_qr_scan_logs_scanned_by ON qr_scan_logs(scanned_by);
CREATE INDEX idx_qr_scan_logs_ip_address ON qr_scan_logs(ip_address);
CREATE INDEX idx_qr_scan_logs_device_type ON qr_scan_logs(device_type);
CREATE INDEX idx_qr_scan_logs_scan_action ON qr_scan_logs(scan_action);
CREATE INDEX idx_qr_scan_logs_composite_analytics ON qr_scan_logs(organization_id, scanned_at, scan_action);

-- QR Batch Operations Indexes
CREATE INDEX idx_qr_batch_ops_organization_id ON qr_batch_operations(organization_id);
CREATE INDEX idx_qr_batch_ops_batch_id ON qr_batch_operations(batch_id);
CREATE INDEX idx_qr_batch_ops_status ON qr_batch_operations(status);
CREATE INDEX idx_qr_batch_ops_created_by ON qr_batch_operations(created_by);
CREATE INDEX idx_qr_batch_ops_created_at ON qr_batch_operations(created_at);
CREATE INDEX idx_qr_batch_ops_operation_type ON qr_batch_operations(operation_type);

-- QR Templates Indexes
CREATE INDEX idx_qr_templates_organization_id ON qr_templates(organization_id);
CREATE INDEX idx_qr_templates_entity_type ON qr_templates(entity_type);
CREATE INDEX idx_qr_templates_is_active ON qr_templates(is_active);
CREATE INDEX idx_qr_templates_is_default ON qr_templates(is_default);

-- =====================================================
-- TRIGGERS FOR AUTOMATED MAINTENANCE
-- =====================================================

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply timestamp triggers
CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON qr_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qr_batch_ops_updated_at BEFORE UPDATE ON qr_batch_operations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qr_templates_updated_at BEFORE UPDATE ON qr_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-increment scan counter trigger
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

CREATE TRIGGER increment_scan_count_trigger 
    AFTER INSERT ON qr_scan_logs
    FOR EACH ROW EXECUTE FUNCTION increment_qr_scan_count();