-- Comprehensive Export/Reporting System Database Schema
-- For CMMS Application using Supabase/PostgreSQL

-- Export Templates Table
-- Stores reusable export configurations and report templates
CREATE TABLE export_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(50) NOT NULL, -- 'report', 'export', 'compliance'
    data_source VARCHAR(100) NOT NULL, -- 'work_orders', 'assets', 'maintenance', 'inventory', 'custom_query'
    
    -- Template Configuration
    config JSONB NOT NULL DEFAULT '{}', -- Stores filters, columns, formatting rules
    query_config JSONB, -- Custom SQL queries or advanced filters
    format_settings JSONB DEFAULT '{}', -- Format-specific settings (PDF layout, Excel styling, etc.)
    
    -- Report Layout & Styling
    layout_config JSONB DEFAULT '{}', -- Page layout, headers, footers, charts
    chart_configs JSONB DEFAULT '[]', -- Chart definitions for visual reports
    
    -- Scheduling & Automation
    is_scheduled BOOLEAN DEFAULT FALSE,
    schedule_config JSONB, -- Cron expression, frequency, timezone
    email_config JSONB, -- Recipients, subject template, body template
    
    -- Permissions & Access Control
    is_public BOOLEAN DEFAULT FALSE,
    allowed_roles TEXT[] DEFAULT '{}',
    allowed_users UUID[] DEFAULT '{}',
    
    -- Compliance & Quality
    compliance_type VARCHAR(50), -- 'ISO_9001', 'FDA', 'OSHA', 'Custom'
    quality_level VARCHAR(20) DEFAULT 'standard', -- 'basic', 'standard', 'enhanced', 'audit'
    retention_period INTEGER DEFAULT 2555, -- Days to retain exports (7 years default)
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    organization_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_template_type CHECK (template_type IN ('report', 'export', 'compliance', 'dashboard', 'alert')),
    CONSTRAINT valid_data_source CHECK (data_source IN ('work_orders', 'assets', 'maintenance', 'inventory', 'locations', 'users', 'parts', 'custom_query', 'dashboard_stats')),
    CONSTRAINT valid_quality_level CHECK (quality_level IN ('basic', 'standard', 'enhanced', 'audit'))
);

-- Export History Table
-- Tracks all export executions with full audit trail
CREATE TABLE export_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES export_templates(id) ON DELETE SET NULL,
    template_name VARCHAR(255) NOT NULL, -- Cached for deleted templates
    
    -- Export Details
    export_type VARCHAR(50) NOT NULL, -- 'manual', 'scheduled', 'api', 'bulk'
    output_format VARCHAR(20) NOT NULL, -- 'csv', 'excel', 'pdf', 'json'
    file_name VARCHAR(500),
    file_size BIGINT, -- Bytes
    file_path TEXT, -- Storage path/URL
    file_hash VARCHAR(128), -- SHA-256 for integrity verification
    
    -- Execution Information
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'expired'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    execution_time_ms INTEGER, -- Processing time in milliseconds
    
    -- Data & Filters
    filters_applied JSONB DEFAULT '{}', -- Filters used for this export
    data_range JSONB, -- Date ranges, record counts, etc.
    record_count INTEGER,
    estimated_record_count INTEGER,
    
    -- Quality & Compliance
    compliance_validated BOOLEAN DEFAULT FALSE,
    quality_checks JSONB DEFAULT '{}', -- Results of quality validations
    data_integrity_hash VARCHAR(128), -- Hash of exported data for compliance
    
    -- User & Context
    requested_by UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    organization_id UUID,
    
    -- Error Handling
    error_message TEXT,
    error_code VARCHAR(50),
    retry_count INTEGER DEFAULT 0,
    
    -- Email & Delivery
    email_sent BOOLEAN DEFAULT FALSE,
    email_recipients TEXT[],
    email_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Lifecycle
    expires_at TIMESTAMP WITH TIME ZONE,
    downloaded_at TIMESTAMP WITH TIME ZONE,
    download_count INTEGER DEFAULT 0,
    
    CONSTRAINT valid_export_type CHECK (export_type IN ('manual', 'scheduled', 'api', 'bulk')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired', 'cancelled')),
    CONSTRAINT valid_output_format CHECK (output_format IN ('csv', 'excel', 'pdf', 'json', 'xml'))
);

-- Export Queue Table
-- Manages export job queue and processing status
CREATE TABLE export_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES export_templates(id) ON DELETE CASCADE,
    history_id UUID REFERENCES export_history(id) ON DELETE CASCADE,
    
    -- Queue Management
    priority INTEGER DEFAULT 5, -- 1-10, higher = more urgent
    queue_position INTEGER,
    estimated_duration_ms INTEGER,
    
    -- Processing
    status VARCHAR(20) DEFAULT 'queued',
    assigned_worker VARCHAR(100), -- Worker/process ID
    processing_started_at TIMESTAMP WITH TIME ZONE,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    current_step VARCHAR(100),
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    max_retries INTEGER DEFAULT 3,
    retry_delay_seconds INTEGER DEFAULT 30,
    
    -- Context
    request_data JSONB DEFAULT '{}', -- Original request parameters
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_queue_status CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled', 'retry')),
    CONSTRAINT valid_priority CHECK (priority BETWEEN 1 AND 10)
);

-- Export Permissions Table
-- Fine-grained permissions for templates and data access
CREATE TABLE export_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES export_templates(id) ON DELETE CASCADE,
    
    -- Permission Subject
    subject_type VARCHAR(20) NOT NULL, -- 'user', 'role', 'organization'
    subject_id VARCHAR(100) NOT NULL, -- UUID for user/org, string for role
    
    -- Permissions
    can_view BOOLEAN DEFAULT TRUE,
    can_execute BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_schedule BOOLEAN DEFAULT FALSE,
    
    -- Data Access Restrictions
    row_level_filters JSONB DEFAULT '{}', -- Additional filters to apply
    column_restrictions TEXT[], -- Columns to exclude
    max_records INTEGER, -- Maximum records this subject can export
    
    -- Time Restrictions
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    allowed_hours JSONB DEFAULT '{}', -- Time windows when exports are allowed
    
    -- Metadata
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_subject_type CHECK (subject_type IN ('user', 'role', 'organization')),
    UNIQUE(template_id, subject_type, subject_id)
);

-- Export Data Sources Table
-- Configurable data source definitions for complex reports
CREATE TABLE export_data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Source Configuration
    source_type VARCHAR(50) NOT NULL, -- 'table', 'view', 'function', 'query'
    source_definition TEXT NOT NULL, -- SQL query or table name
    
    -- Parameters & Variables
    parameters JSONB DEFAULT '{}', -- Parameter definitions
    default_filters JSONB DEFAULT '{}',
    
    -- Caching
    cache_duration_minutes INTEGER DEFAULT 0, -- 0 = no cache
    last_cached_at TIMESTAMP WITH TIME ZONE,
    cache_key VARCHAR(255),
    
    -- Security
    requires_permission VARCHAR(100), -- Permission required to use this source
    row_level_security BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    organization_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_source_type CHECK (source_type IN ('table', 'view', 'function', 'query', 'api'))
);

-- Export Audit Log Table
-- Comprehensive audit trail for compliance and security
CREATE TABLE export_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event Information
    event_type VARCHAR(50) NOT NULL, -- 'template_created', 'export_executed', 'file_downloaded', etc.
    event_description TEXT,
    
    -- Related Objects
    template_id UUID,
    history_id UUID,
    user_id UUID REFERENCES auth.users(id),
    
    -- Event Data
    old_values JSONB DEFAULT '{}',
    new_values JSONB DEFAULT '{}',
    event_metadata JSONB DEFAULT '{}',
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    organization_id UUID,
    
    -- Compliance
    compliance_level VARCHAR(20) DEFAULT 'standard',
    retention_required_until TIMESTAMP WITH TIME ZONE,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_event_type CHECK (event_type IN (
        'template_created', 'template_updated', 'template_deleted',
        'export_requested', 'export_started', 'export_completed', 'export_failed',
        'file_downloaded', 'file_deleted', 'file_expired',
        'permission_granted', 'permission_revoked',
        'schedule_created', 'schedule_updated', 'scheduled_execution'
    ))
);

-- Create Indexes for Performance
CREATE INDEX idx_export_templates_org_active ON export_templates(organization_id, is_active);
CREATE INDEX idx_export_templates_type_source ON export_templates(template_type, data_source);
CREATE INDEX idx_export_templates_scheduled ON export_templates(is_scheduled) WHERE is_scheduled = TRUE;

CREATE INDEX idx_export_history_template ON export_history(template_id);
CREATE INDEX idx_export_history_user_date ON export_history(requested_by, started_at DESC);
CREATE INDEX idx_export_history_org_date ON export_history(organization_id, started_at DESC);
CREATE INDEX idx_export_history_status ON export_history(status);
CREATE INDEX idx_export_history_expires ON export_history(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_export_queue_status_priority ON export_queue(status, priority DESC);
CREATE INDEX idx_export_queue_scheduled ON export_queue(scheduled_for) WHERE status IN ('queued', 'retry');

CREATE INDEX idx_export_permissions_template ON export_permissions(template_id);
CREATE INDEX idx_export_permissions_subject ON export_permissions(subject_type, subject_id);

CREATE INDEX idx_export_audit_log_user_date ON export_audit_log(user_id, created_at DESC);
CREATE INDEX idx_export_audit_log_template_event ON export_audit_log(template_id, event_type);
CREATE INDEX idx_export_audit_log_org_date ON export_audit_log(organization_id, created_at DESC);

-- Row Level Security Policies
ALTER TABLE export_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_audit_log ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (customize based on your auth setup)
-- Templates: Users can see templates they have permission for
CREATE POLICY "export_templates_select" ON export_templates
    FOR SELECT USING (
        is_public = TRUE OR 
        created_by = auth.uid() OR
        organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
    );

-- History: Users can see their own exports and those in their organization
CREATE POLICY "export_history_select" ON export_history
    FOR SELECT USING (
        requested_by = auth.uid() OR
        organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
    );

-- Queue: Users can see queue items for their exports
CREATE POLICY "export_queue_select" ON export_queue
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM export_history h 
            WHERE h.id = export_queue.history_id 
            AND (h.requested_by = auth.uid() OR h.organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid()))
        )
    );

-- Create Functions for Common Operations

-- Function to clean up expired exports
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    -- Mark expired exports
    UPDATE export_history 
    SET status = 'expired' 
    WHERE expires_at < NOW() 
    AND status NOT IN ('expired', 'failed');
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    -- Log cleanup activity
    INSERT INTO export_audit_log (event_type, event_description, event_metadata)
    VALUES ('cleanup_expired', 'Automatic cleanup of expired exports', 
            jsonb_build_object('cleaned_count', cleaned_count));
    
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update queue positions
CREATE OR REPLACE FUNCTION update_queue_positions()
RETURNS VOID AS $$
BEGIN
    WITH ranked_queue AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY priority DESC, created_at ASC) as new_position
        FROM export_queue
        WHERE status = 'queued'
    )
    UPDATE export_queue
    SET queue_position = ranked_queue.new_position
    FROM ranked_queue
    WHERE export_queue.id = ranked_queue.id;
END;
$$ LANGUAGE plpgsql;

-- Function to get next export job
CREATE OR REPLACE FUNCTION get_next_export_job()
RETURNS TABLE (
    queue_id UUID,
    template_id UUID,
    history_id UUID,
    priority INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT eq.id, eq.template_id, eq.history_id, eq.priority
    FROM export_queue eq
    WHERE eq.status = 'queued' 
    AND eq.scheduled_for <= NOW()
    ORDER BY eq.priority DESC, eq.created_at ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_export_templates_updated_at BEFORE UPDATE ON export_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_export_queue_updated_at BEFORE UPDATE ON export_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample Data for Development/Testing
INSERT INTO export_templates (name, description, template_type, data_source, config, created_by) VALUES
('Daily Work Orders Report', 'Daily summary of all work orders with status breakdown', 'report', 'work_orders', 
 '{"filters": {"date_range": "today"}, "columns": ["id", "title", "status", "priority", "created_at"], "groupBy": "status"}', 
 null),
 
('Asset Maintenance History', 'Complete maintenance history for compliance audits', 'compliance', 'maintenance',
 '{"filters": {}, "columns": ["asset_id", "asset_name", "task_name", "completed_at", "technician"], "includeCharts": true}',
 null),
 
('Inventory Low Stock Alert', 'Parts below reorder point for procurement', 'alert', 'inventory',
 '{"filters": {"stock_level": "below_reorder"}, "columns": ["name", "sku", "current_stock", "reorder_point", "supplier"], "autoEmail": true}',
 null);