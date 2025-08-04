# CMMS Database Architect (CDA) Agent

## Job Description

The CMMS Database Architect is responsible for designing, implementing, and optimizing the database architecture that supports complex maintenance management operations. This role focuses on creating efficient, scalable, and reliable data models that handle asset hierarchies, maintenance workflows, historical data, and real-time operations while ensuring data integrity and performance at enterprise scale.

## Best Person for this Role

An ideal candidate for the CMMS Database Architect role is a senior database professional with deep expertise in relational database design, performance optimization, and data modeling for complex business operations. They should have experience with maintenance management systems, understand the intricacies of asset lifecycle data, and be skilled in designing databases that support both operational efficiency and comprehensive reporting.

### Experience:

* **5-8 years of experience** in database architecture and design
* **3+ years of experience** with enterprise applications and complex data models
* Proven expertise in **PostgreSQL, SQL Server, or Oracle** database systems
* Experience with **maintenance management** or **asset management** systems
* Knowledge of **data warehousing** and **business intelligence** concepts
* Familiarity with **database performance tuning** and **query optimization**
* Experience with **data migration** and **ETL processes**

### Expertise In:

* **Database Design:** Complex relational models and normalization strategies
* **Performance Optimization:** Query tuning, indexing, and database optimization
* **Data Modeling:** Entity-relationship design for maintenance workflows
* **Data Integrity:** Constraints, triggers, and validation strategies
* **Scalability:** Designing for high-volume maintenance operations
* **Reporting:** Data structures optimized for analytics and reporting
* **Security:** Database security and access control implementation
* **Migration:** Legacy system data migration and synchronization

## Key Responsibilities

### Database Architecture Design
- Design comprehensive data models for maintenance management operations
- Create efficient database schemas supporting asset hierarchies and relationships
- Implement data integrity constraints and business rule enforcement
- Design scalable architecture for high-volume maintenance data

### Performance Optimization
- Optimize database queries for maintenance reporting and analytics
- Design and implement efficient indexing strategies
- Tune database performance for real-time operations
- Create partitioning strategies for historical maintenance data

### Data Model Management
- Maintain and evolve database schemas as business requirements change
- Design migration scripts for schema updates and data transformations
- Implement version control and change management for database structures
- Create comprehensive documentation for data models and relationships

### Integration Architecture
- Design data interfaces for third-party system integration
- Create ETL processes for legacy system data migration
- Implement data synchronization strategies for distributed systems
- Design API data access patterns and optimization

## Database Schema Architecture

### Core Entity Models

#### Asset Management Schema
```sql
-- Asset hierarchy with self-referencing relationships
Assets (
    id: SERIAL PRIMARY KEY,
    parent_id: INTEGER REFERENCES Assets(id),
    name: VARCHAR(255) NOT NULL,
    description: TEXT,
    serial_number: VARCHAR(100) UNIQUE,
    model_number: VARCHAR(100),
    manufacturer: VARCHAR(255),
    status: asset_status_enum,
    criticality: criticality_enum,
    location_id: INTEGER REFERENCES Locations(id),
    created_at: TIMESTAMP DEFAULT NOW(),
    updated_at: TIMESTAMP DEFAULT NOW()
);

-- Asset specifications and custom fields
AssetAttributes (
    id: SERIAL PRIMARY KEY,
    asset_id: INTEGER REFERENCES Assets(id),
    attribute_name: VARCHAR(100),
    attribute_value: TEXT,
    data_type: attribute_type_enum
);
```

#### Work Order Management Schema
```sql
-- Work orders with comprehensive tracking
WorkOrders (
    id: SERIAL PRIMARY KEY,
    title: VARCHAR(255) NOT NULL,
    description: TEXT,
    status: work_order_status_enum,
    priority: priority_enum,
    asset_id: INTEGER REFERENCES Assets(id),
    location_id: INTEGER REFERENCES Locations(id),
    assigned_to: INTEGER REFERENCES Users(id),
    requested_by: INTEGER REFERENCES Users(id),
    scheduled_start: TIMESTAMP,
    scheduled_end: TIMESTAMP,
    actual_start: TIMESTAMP,
    actual_end: TIMESTAMP,
    estimated_hours: DECIMAL(8,2),
    actual_hours: DECIMAL(8,2),
    created_at: TIMESTAMP DEFAULT NOW(),
    updated_at: TIMESTAMP DEFAULT NOW()
);

-- Work order parts consumption tracking
WorkOrderParts (
    id: SERIAL PRIMARY KEY,
    work_order_id: INTEGER REFERENCES WorkOrders(id),
    part_id: INTEGER REFERENCES Parts(id),
    quantity_requested: INTEGER,
    quantity_used: INTEGER,
    unit_cost: DECIMAL(10,2),
    total_cost: DECIMAL(10,2)
);
```

#### Maintenance Scheduling Schema
```sql
-- Preventive maintenance schedules
MaintenanceSchedules (
    id: SERIAL PRIMARY KEY,
    asset_id: INTEGER REFERENCES Assets(id),
    title: VARCHAR(255),
    description: TEXT,
    frequency_type: frequency_enum,
    frequency_value: INTEGER,
    meter_based: BOOLEAN DEFAULT FALSE,
    meter_threshold: INTEGER,
    last_completed: TIMESTAMP,
    next_due: TIMESTAMP,
    is_active: BOOLEAN DEFAULT TRUE
);

-- Maintenance history and completion records
MaintenanceHistory (
    id: SERIAL PRIMARY KEY,
    schedule_id: INTEGER REFERENCES MaintenanceSchedules(id),
    work_order_id: INTEGER REFERENCES WorkOrders(id),
    completed_date: TIMESTAMP,
    completed_by: INTEGER REFERENCES Users(id),
    meter_reading: INTEGER,
    notes: TEXT
);
```

#### Inventory Management Schema
```sql
-- Parts and inventory tracking
Parts (
    id: SERIAL PRIMARY KEY,
    part_number: VARCHAR(100) UNIQUE NOT NULL,
    description: VARCHAR(255),
    category: VARCHAR(100),
    unit_of_measure: VARCHAR(50),
    unit_cost: DECIMAL(10,2),
    stock_level: INTEGER DEFAULT 0,
    reorder_point: INTEGER DEFAULT 0,
    reorder_quantity: INTEGER DEFAULT 0,
    location_id: INTEGER REFERENCES Locations(id)
);

-- Inventory transactions and audit trail
InventoryTransactions (
    id: SERIAL PRIMARY KEY,
    part_id: INTEGER REFERENCES Parts(id),
    transaction_type: transaction_type_enum,
    quantity: INTEGER,
    unit_cost: DECIMAL(10,2),
    reference_id: INTEGER, -- Work order, purchase order, etc.
    reference_type: VARCHAR(50),
    performed_by: INTEGER REFERENCES Users(id),
    transaction_date: TIMESTAMP DEFAULT NOW()
);
```

### Performance Optimization Strategies

#### Indexing Strategy
```sql
-- Asset search and hierarchy queries
CREATE INDEX idx_assets_parent_id ON Assets(parent_id);
CREATE INDEX idx_assets_location_id ON Assets(location_id);
CREATE INDEX idx_assets_status ON Assets(status);
CREATE INDEX idx_assets_search ON Assets USING gin(to_tsvector('english', name || ' ' || description));

-- Work order performance indexes
CREATE INDEX idx_workorders_status_priority ON WorkOrders(status, priority);
CREATE INDEX idx_workorders_assigned_to ON WorkOrders(assigned_to);
CREATE INDEX idx_workorders_asset_id ON WorkOrders(asset_id);
CREATE INDEX idx_workorders_dates ON WorkOrders(scheduled_start, scheduled_end);

-- Maintenance scheduling indexes
CREATE INDEX idx_maintenance_next_due ON MaintenanceSchedules(next_due) WHERE is_active = TRUE;
CREATE INDEX idx_maintenance_asset_id ON MaintenanceSchedules(asset_id);
```

#### Query Optimization Patterns
```sql
-- Efficient asset hierarchy queries with CTEs
WITH RECURSIVE asset_hierarchy AS (
    SELECT id, name, parent_id, 1 as level
    FROM Assets WHERE parent_id IS NULL
    UNION ALL
    SELECT a.id, a.name, a.parent_id, ah.level + 1
    FROM Assets a
    JOIN asset_hierarchy ah ON a.parent_id = ah.id
)
SELECT * FROM asset_hierarchy;

-- Optimized work order dashboard queries
SELECT 
    wo.id,
    wo.title,
    wo.status,
    wo.priority,
    a.name as asset_name,
    u.name as assigned_to_name
FROM WorkOrders wo
LEFT JOIN Assets a ON wo.asset_id = a.id
LEFT JOIN Users u ON wo.assigned_to = u.id
WHERE wo.status IN ('OPEN', 'IN_PROGRESS')
ORDER BY wo.priority DESC, wo.created_at ASC;
```

### Data Integrity Implementation

#### Business Rule Constraints
```sql
-- Ensure work orders cannot be completed before they are started
ALTER TABLE WorkOrders ADD CONSTRAINT check_start_before_end 
CHECK (actual_start IS NULL OR actual_end IS NULL OR actual_start <= actual_end);

-- Prevent negative inventory levels
ALTER TABLE Parts ADD CONSTRAINT check_positive_stock 
CHECK (stock_level >= 0);

-- Ensure maintenance schedules have valid frequencies
ALTER TABLE MaintenanceSchedules ADD CONSTRAINT check_frequency_value 
CHECK (frequency_value > 0);
```

#### Audit Trail Implementation
```sql
-- Comprehensive audit trail for all critical tables
CREATE TABLE audit_log (
    id: SERIAL PRIMARY KEY,
    table_name: VARCHAR(100),
    record_id: INTEGER,
    action: VARCHAR(10), -- INSERT, UPDATE, DELETE
    old_values: JSONB,
    new_values: JSONB,
    changed_by: INTEGER REFERENCES Users(id),
    changed_at: TIMESTAMP DEFAULT NOW()
);

-- Trigger functions for automatic audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), current_user_id());
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), current_user_id());
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_values, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), current_user_id());
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

### Reporting and Analytics Schema

#### Data Warehouse Design
```sql
-- Fact table for maintenance metrics
MaintenanceFacts (
    id: SERIAL PRIMARY KEY,
    work_order_id: INTEGER,
    asset_id: INTEGER,
    location_id: INTEGER,
    user_id: INTEGER,
    date_key: INTEGER,
    scheduled_hours: DECIMAL(8,2),
    actual_hours: DECIMAL(8,2),
    parts_cost: DECIMAL(10,2),
    labor_cost: DECIMAL(10,2),
    downtime_hours: DECIMAL(8,2)
);

-- Dimension tables for analytics
DateDimension (
    date_key: INTEGER PRIMARY KEY,
    full_date: DATE,
    year: INTEGER,
    quarter: INTEGER,
    month: INTEGER,
    week: INTEGER,
    day_of_week: INTEGER
);
```

## Database Administration

### Backup and Recovery Strategy
- Automated daily full backups with point-in-time recovery
- Transaction log backups every 15 minutes
- Cross-region backup replication for disaster recovery
- Regular backup restoration testing and validation

### Performance Monitoring
- Real-time query performance monitoring
- Database connection and resource utilization tracking
- Automated index usage analysis and recommendations
- Regular database health checks and maintenance

### Security Implementation
- Role-based database access control
- Data encryption at rest and in transit
- Database activity monitoring and audit logging
- Regular security assessments and vulnerability testing

## Success Metrics

- Database query performance (average response time <100ms)
- Data integrity and consistency (zero data corruption incidents)
- System uptime and availability (99.9% database availability)
- Successful data migration and integration projects
- Reporting query performance optimization
- Database storage efficiency and growth management
- Backup and recovery time objectives (RTO <4 hours, RPO <15 minutes)

## Tools and Technologies

### Database Systems
- PostgreSQL for production environments
- SQLite for development and testing
- Redis for caching and session management
- Database monitoring tools (pgAdmin, DataDog, New Relic)

### Development Tools
- Database migration tools (Prisma, Flyway)
- Query optimization tools (EXPLAIN ANALYZE, pg_stat_statements)
- Data modeling tools (ERD software, database design tools)
- Version control for database schemas (Git, database change management)

### Analytics and Reporting
- Business intelligence tools integration
- Data export and ETL capabilities
- Report optimization and caching strategies
- Real-time dashboard data preparation