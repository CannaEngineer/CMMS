# Preventive Maintenance Workflow API Test Results

## Current API Status

### ✅ Working Endpoints

1. **Asset Management** (`/api/assets`)
   - GET / - List all assets with location, work orders, and PM schedules
   - GET /:id - Get specific asset details
   - POST / - Create new asset with all required fields
   - PUT /:id - Update asset information
   - DELETE /:id - Remove asset
   - **Parent-child hierarchy supported** via `parentId` field

2. **PM Schedule Management** (`/api/pm-schedules`)
   - GET / - List all PM schedules
   - GET /:id - Get specific PM schedule
   - POST / - Create new PM schedule
   - PUT /:id - Update PM schedule
   - DELETE /:id - Remove PM schedule

3. **Work Order Management** (`/api/work-orders`)
   - GET / - List all work orders
   - GET /:id - Get specific work order
   - POST / - Create new work order (can be linked to assets)
   - PUT /:id - Update work order (status changes)
   - DELETE /:id - Remove work order
   - Status workflow: OPEN → IN_PROGRESS → COMPLETED

4. **Dashboard Metrics** (`/api/dashboard`)
   - GET /stats - Overall system statistics
   - GET /work-order-trends - Work order trend data
   - GET /asset-health - Asset health status
   - GET /recent-work-orders - Recent work orders
   - GET /maintenance-schedule - Upcoming maintenance counts

5. **Supporting Endpoints**
   - `/api/users` - User management
   - `/api/locations` - Location hierarchy
   - `/api/parts` - Inventory management
   - `/api/auth` - Authentication

## ❌ Missing PM Workflow Features

### 1. PM Tasks & Checklists
**Current State**: No dedicated task/checklist models
**Required**:
- Task templates with step-by-step procedures
- Safety checks (LOTO, PPE requirements)
- Estimated time, tools, and parts required
- Ability to check off tasks during execution

### 2. Advanced PM Triggers
**Current State**: Only basic frequency string ("daily", "weekly", "monthly")
**Required**:
- Usage-based triggers (hours, mileage, cycles)
- Condition-based triggers (temperature, pressure thresholds)
- Meter reading integration
- Event-based triggers (after last completed + X days)

### 3. PM Calendar Generation
**Current State**: Basic maintenance schedule counts only
**Required**:
- Full calendar view with all upcoming PMs
- Filter by technician, department, or site
- Conflict detection and optimization
- Drag-and-drop rescheduling

### 4. Automatic Work Order Generation
**Current State**: Manual work order creation only
**Required**:
- Auto-generate work orders from PM schedules
- Link work orders to PM schedules
- Track PM compliance rates

### 5. Work Order Enhancements
**Current State**: Basic work order fields
**Required**:
- Linked parts/tools tracking
- SOPs or training video attachments
- Time tracking (actual vs estimated)
- Technician notes and findings
- Photo/video attachments
- Downtime tracking

### 6. History & Compliance
**Current State**: Basic creation/update timestamps only
**Required**:
- Detailed maintenance history per asset
- PM compliance tracking
- Missed vs completed PM metrics
- Cost tracking per PM

### 7. Optimization Features
**Current State**: None
**Required**:
- PM frequency optimization based on failure data
- Automated scheduling suggestions
- Resource balancing

## Recommended Database Schema Extensions

```prisma
// Add to existing schema

model PMTask {
  id           Int         @id @default(autoincrement())
  name         String
  description  String?
  procedure    String      // Step-by-step instructions
  estimatedTime Int        // In minutes
  safetyRequirements String?
  toolsRequired String?
  pmScheduleId Int
  pmSchedule   PMSchedule  @relation(fields: [pmScheduleId], references: [id])
  taskCompletions TaskCompletion[]
  
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

model PMTrigger {
  id           Int         @id @default(autoincrement())
  type         TriggerType
  value        Float       // Threshold value
  unit         String?     // hours, miles, cycles, etc.
  pmScheduleId Int
  pmSchedule   PMSchedule  @relation(fields: [pmScheduleId], references: [id])
  
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

model WorkOrderTask {
  id           Int         @id @default(autoincrement())
  workOrderId  Int
  taskName     String
  completed    Boolean     @default(false)
  completedAt  DateTime?
  completedBy  Int?
  notes        String?
  workOrder    WorkOrder   @relation(fields: [workOrderId], references: [id])
  
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

model MaintenanceHistory {
  id           Int         @id @default(autoincrement())
  assetId      Int
  workOrderId  Int
  pmScheduleId Int?
  performedBy  Int
  performedAt  DateTime
  duration     Int         // In minutes
  findings     String?
  partsUsed    Json?
  cost         Float?
  
  asset        Asset       @relation(fields: [assetId], references: [id])
  workOrder    WorkOrder   @relation(fields: [workOrderId], references: [id])
  pmSchedule   PMSchedule? @relation(fields: [pmScheduleId], references: [id])
  
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

enum TriggerType {
  TIME_BASED
  USAGE_BASED
  CONDITION_BASED
  METER_READING
  EVENT_BASED
}
```

## API Endpoint Recommendations

### New Endpoints Needed

1. **PM Task Management**
   - POST /api/pm-schedules/:id/tasks - Add tasks to PM schedule
   - GET /api/pm-schedules/:id/tasks - Get all tasks for PM
   - PUT /api/pm-tasks/:id - Update task details

2. **PM Trigger Management**
   - POST /api/pm-schedules/:id/triggers - Add triggers
   - GET /api/pm-schedules/:id/triggers - Get all triggers
   - POST /api/assets/:id/meter-reading - Submit meter readings

3. **Work Order Tasks**
   - GET /api/work-orders/:id/tasks - Get checklist for work order
   - PUT /api/work-orders/:id/tasks/:taskId - Update task status
   - POST /api/work-orders/:id/complete - Complete with all task statuses

4. **PM Calendar**
   - GET /api/pm-calendar - Get calendar view with filters
   - PUT /api/pm-calendar/reschedule - Bulk reschedule PMs

5. **Auto Work Order Generation**
   - POST /api/pm-schedules/:id/generate-work-order - Manual trigger
   - GET /api/pm-schedules/due - Get all due PM schedules
   - POST /api/pm-schedules/generate-all-due - Batch generate

6. **Compliance & History**
   - GET /api/assets/:id/maintenance-history
   - GET /api/reports/pm-compliance
   - GET /api/reports/pm-optimization

## Implementation Priority

1. **High Priority** (Required for basic PM workflow)
   - PM task templates and checklists
   - Work order task tracking
   - Auto work order generation from PM schedules
   - Basic maintenance history logging

2. **Medium Priority** (Enhanced functionality)
   - Advanced trigger types (usage, condition-based)
   - PM calendar view
   - Compliance reporting
   - Cost tracking

3. **Low Priority** (Optimization features)
   - PM frequency optimization
   - Predictive maintenance suggestions
   - Resource balancing algorithms