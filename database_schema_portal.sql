-- Portal System Database Schema for Supabase/PostgreSQL
-- Extends existing CMMS schema with portal functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For location data

-- Portal Configuration Table
CREATE TABLE portals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL, -- Multi-tenant support
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'maintenance-request',
        'asset-registration', 
        'equipment-info',
        'general-inquiry',
        'inspection-report',
        'safety-incident'
    )),
    
    -- Portal Settings
    is_active BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT true,
    allow_anonymous BOOLEAN DEFAULT true,
    max_file_size INTEGER DEFAULT 10485760, -- 10MB
    allowed_file_types TEXT[] DEFAULT ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    
    -- Rate Limiting
    rate_limit_per_hour INTEGER DEFAULT 10,
    rate_limit_per_day INTEGER DEFAULT 50,
    
    -- Auto-create work orders
    auto_create_work_orders BOOLEAN DEFAULT true,
    default_work_order_priority VARCHAR(20) DEFAULT 'MEDIUM',
    default_assigned_user_id UUID,
    
    -- QR Code Configuration
    qr_code_url TEXT,
    qr_enabled BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    
    -- Constraints
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (default_assigned_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Portal Form Fields Configuration
CREATE TABLE portal_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portal_id UUID NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL CHECK (field_type IN (
        'text', 'email', 'phone', 'number', 'date', 'datetime', 'time',
        'textarea', 'select', 'multiselect', 'radio', 'checkbox',
        'file', 'image', 'location', 'rating', 'priority', 'asset_picker',
        'signature', 'hidden'
    )),
    field_label VARCHAR(255) NOT NULL,
    field_placeholder TEXT,
    field_description TEXT,
    
    -- Field Configuration
    is_required BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    field_order INTEGER NOT NULL,
    
    -- Field Options (JSON for select, radio, etc.)
    field_options JSONB,
    
    -- Validation Rules
    validation_rules JSONB, -- min_length, max_length, pattern, etc.
    
    -- Conditional Logic
    conditional_logic JSONB, -- show/hide based on other fields
    
    -- Integration Mapping
    maps_to_work_order_field VARCHAR(100), -- Maps to work_orders table column
    maps_to_asset_field VARCHAR(100), -- Maps to assets table column
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (portal_id) REFERENCES portals(id) ON DELETE CASCADE,
    UNIQUE(portal_id, field_name)
);

-- Portal Branding and Customization
CREATE TABLE portal_branding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portal_id UUID NOT NULL UNIQUE,
    
    -- Colors and Styling
    primary_color VARCHAR(7) DEFAULT '#1976d2',
    secondary_color VARCHAR(7) DEFAULT '#dc004e',
    background_color VARCHAR(7) DEFAULT '#ffffff',
    text_color VARCHAR(7) DEFAULT '#333333',
    
    -- Logo and Images
    logo_url TEXT,
    background_image_url TEXT,
    favicon_url TEXT,
    
    -- Typography
    font_family VARCHAR(100) DEFAULT 'Roboto, sans-serif',
    font_size_base INTEGER DEFAULT 16,
    
    -- Layout Options
    layout_style VARCHAR(50) DEFAULT 'modern' CHECK (layout_style IN ('modern', 'classic', 'minimal')),
    show_progress_bar BOOLEAN DEFAULT true,
    show_step_numbers BOOLEAN DEFAULT true,
    
    -- Content
    welcome_title VARCHAR(255),
    welcome_message TEXT,
    success_title VARCHAR(255) DEFAULT 'Submission Received',
    success_message TEXT DEFAULT 'Thank you for your submission. We will review it shortly.',
    footer_text TEXT,
    
    -- Contact Information
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    
    -- Custom CSS
    custom_css TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (portal_id) REFERENCES portals(id) ON DELETE CASCADE
);

-- Portal Submissions
CREATE TABLE portal_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portal_id UUID NOT NULL,
    submission_code VARCHAR(20) UNIQUE NOT NULL, -- Public tracking code
    
    -- Submitter Information
    submitter_name VARCHAR(255),
    submitter_email VARCHAR(255),
    submitter_phone VARCHAR(50),
    submitter_location GEOGRAPHY(POINT), -- PostGIS for location data
    
    -- Submission Data
    form_data JSONB NOT NULL, -- All form field responses
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    category VARCHAR(100),
    
    -- Status Tracking
    status VARCHAR(50) DEFAULT 'SUBMITTED' CHECK (status IN (
        'SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED', 
        'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    )),
    
    -- Integration
    work_order_id UUID, -- Created work order
    asset_id UUID, -- Related asset if applicable
    location_id UUID, -- Related location
    
    -- Review Information
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    
    -- Internal Notes
    internal_notes TEXT,
    
    -- Analytics Data
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    session_id VARCHAR(100),
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    FOREIGN KEY (portal_id) REFERENCES portals(id) ON DELETE CASCADE,
    FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE SET NULL,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Portal Submission Files
CREATE TABLE portal_submission_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL,
    field_name VARCHAR(100) NOT NULL, -- Which form field this file belongs to
    
    -- File Information
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL, -- Path in storage system
    file_url TEXT, -- Public URL if available
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    
    -- Image Metadata (if applicable)
    image_width INTEGER,
    image_height INTEGER,
    
    -- Security
    virus_scan_status VARCHAR(20) DEFAULT 'PENDING' CHECK (virus_scan_status IN ('PENDING', 'CLEAN', 'INFECTED', 'ERROR')),
    virus_scan_result TEXT,
    
    -- Timestamps
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (submission_id) REFERENCES portal_submissions(id) ON DELETE CASCADE
);

-- Portal Communication/Messages
CREATE TABLE portal_communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL,
    
    -- Message Details
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('ADMIN', 'SUBMITTER', 'SYSTEM')),
    sender_user_id UUID, -- Admin user if sender_type = 'ADMIN'
    sender_name VARCHAR(255), -- For submitter messages
    sender_email VARCHAR(255), -- For submitter messages
    
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'MESSAGE' CHECK (message_type IN (
        'MESSAGE', 'STATUS_UPDATE', 'QUESTION', 'UPDATE_REQUEST', 'NOTIFICATION'
    )),
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    is_internal BOOLEAN DEFAULT false, -- Internal admin notes
    
    -- Email notification
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (submission_id) REFERENCES portal_submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Portal Analytics and Metrics
CREATE TABLE portal_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portal_id UUID NOT NULL,
    
    -- Event Information
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'VIEW', 'START', 'SUBMIT', 'ABANDON', 'ERROR', 'SHARE', 'QR_SCAN'
    )),
    event_data JSONB, -- Additional event-specific data
    
    -- User Information
    session_id VARCHAR(100),
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    
    -- Location Data
    user_location GEOGRAPHY(POINT),
    
    -- Timestamp
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (portal_id) REFERENCES portals(id) ON DELETE CASCADE
);

-- Portal Rate Limiting
CREATE TABLE portal_rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portal_id UUID NOT NULL,
    ip_address INET NOT NULL,
    
    -- Counters
    requests_last_hour INTEGER DEFAULT 1,
    requests_last_day INTEGER DEFAULT 1,
    
    -- Timestamps
    first_request_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_request_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    
    FOREIGN KEY (portal_id) REFERENCES portals(id) ON DELETE CASCADE,
    UNIQUE(portal_id, ip_address)
);

-- Portal Templates for Quick Setup
CREATE TABLE portal_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    portal_type VARCHAR(50) NOT NULL,
    
    -- Template Configuration
    template_config JSONB NOT NULL, -- Fields, branding, settings
    is_system_template BOOLEAN DEFAULT false, -- Built-in vs custom
    is_public BOOLEAN DEFAULT true, -- Available to all organizations
    
    -- Usage Stats
    usage_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for Performance
CREATE INDEX idx_portals_organization_id ON portals(organization_id);
CREATE INDEX idx_portals_slug ON portals(slug);
CREATE INDEX idx_portals_type ON portals(type);
CREATE INDEX idx_portals_active ON portals(is_active) WHERE is_active = true;

CREATE INDEX idx_portal_fields_portal_id ON portal_fields(portal_id);
CREATE INDEX idx_portal_fields_order ON portal_fields(portal_id, field_order);

CREATE INDEX idx_portal_submissions_portal_id ON portal_submissions(portal_id);
CREATE INDEX idx_portal_submissions_status ON portal_submissions(status);
CREATE INDEX idx_portal_submissions_submitted_at ON portal_submissions(submitted_at);
CREATE INDEX idx_portal_submissions_code ON portal_submissions(submission_code);
CREATE INDEX idx_portal_submissions_work_order ON portal_submissions(work_order_id);

CREATE INDEX idx_portal_submission_files_submission_id ON portal_submission_files(submission_id);

CREATE INDEX idx_portal_communications_submission_id ON portal_communications(submission_id);
CREATE INDEX idx_portal_communications_created_at ON portal_communications(created_at);

CREATE INDEX idx_portal_analytics_portal_id ON portal_analytics(portal_id);
CREATE INDEX idx_portal_analytics_occurred_at ON portal_analytics(occurred_at);
CREATE INDEX idx_portal_analytics_event_type ON portal_analytics(event_type);

CREATE INDEX idx_portal_rate_limits_portal_ip ON portal_rate_limits(portal_id, ip_address);
CREATE INDEX idx_portal_rate_limits_blocked ON portal_rate_limits(blocked_until) WHERE blocked_until IS NOT NULL;

-- Row Level Security (RLS) Policies for Supabase
ALTER TABLE portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_submission_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Examples - adjust based on your auth system)
CREATE POLICY "Users can view their organization's portals" ON portals
    FOR SELECT USING (organization_id = (SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage their organization's portals" ON portals
    FOR ALL USING (
        organization_id = (SELECT organization_id FROM user_profiles WHERE user_id = auth.uid())
        AND (SELECT role FROM user_profiles WHERE user_id = auth.uid()) IN ('ADMIN', 'MANAGER')
    );

CREATE POLICY "Public can view active portals for submissions" ON portals
    FOR SELECT USING (is_active = true);

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply timestamp triggers
CREATE TRIGGER update_portals_updated_at BEFORE UPDATE ON portals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portal_fields_updated_at BEFORE UPDATE ON portal_fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portal_branding_updated_at BEFORE UPDATE ON portal_branding
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portal_submissions_updated_at BEFORE UPDATE ON portal_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate submission codes
CREATE OR REPLACE FUNCTION generate_submission_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 8-character alphanumeric code
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM portal_submissions WHERE submission_code = code) INTO exists;
        
        IF NOT exists THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate submission codes
CREATE OR REPLACE FUNCTION set_submission_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.submission_code IS NULL OR NEW.submission_code = '' THEN
        NEW.submission_code := generate_submission_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_portal_submission_code BEFORE INSERT ON portal_submissions
    FOR EACH ROW EXECUTE FUNCTION set_submission_code();

-- Function for automatic work order creation
CREATE OR REPLACE FUNCTION create_work_order_from_submission()
RETURNS TRIGGER AS $$
DECLARE
    portal_config RECORD;
    work_order_id UUID;
BEGIN
    -- Get portal configuration
    SELECT p.auto_create_work_orders, p.default_work_order_priority, p.default_assigned_user_id, p.organization_id
    INTO portal_config
    FROM portals p
    WHERE p.id = NEW.portal_id;
    
    -- Create work order if auto-creation is enabled
    IF portal_config.auto_create_work_orders AND NEW.status = 'APPROVED' THEN
        INSERT INTO work_orders (
            organization_id,
            title,
            description,
            priority,
            status,
            assigned_to,
            asset_id,
            location_id,
            source_type,
            source_id,
            created_at
        ) VALUES (
            portal_config.organization_id,
            COALESCE(NEW.form_data->>'title', NEW.form_data->>'subject', 'Portal Submission'),
            COALESCE(NEW.form_data->>'description', NEW.form_data->>'details', 'Submitted via portal'),
            COALESCE(NEW.priority, portal_config.default_work_order_priority),
            'OPEN',
            portal_config.default_assigned_user_id,
            NEW.asset_id,
            NEW.location_id,
            'PORTAL',
            NEW.id,
            NOW()
        ) RETURNING id INTO work_order_id;
        
        -- Update submission with work order ID
        NEW.work_order_id := work_order_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_work_order_on_approval BEFORE UPDATE ON portal_submissions
    FOR EACH ROW 
    WHEN (OLD.status != 'APPROVED' AND NEW.status = 'APPROVED')
    EXECUTE FUNCTION create_work_order_from_submission();