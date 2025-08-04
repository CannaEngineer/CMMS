# PM API Quick Reference Guide

## 🚀 Getting Started

All PM endpoints require authentication (except in development mode). Base URL: `http://localhost:5000/api`

## 📋 PM Tasks & Templates

### Create Task Template
```bash
curl -X POST http://localhost:5000/api/pm-tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Monthly HVAC Filter Replacement",
    "description": "Replace air filters in HVAC units",
    "type": "REPLACEMENT",
    "procedure": "1. Turn off HVAC\n2. Remove old filter\n3. Install new filter\n4. Turn on and test",
    "safetyRequirements": "LOTO required, wear gloves",
    "toolsRequired": "Screwdriver, flashlight",
    "partsRequired": "HEPA filter 20x25x1",
    "estimatedMinutes": 30
  }'
```

### Link Task to PM Schedule
```bash
curl -X POST http://localhost:5000/api/pm-tasks/schedule/1/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "pmTaskId": 1,
    "orderIndex": 1,
    "isRequired": true
  }'
```

## ⚡ PM Triggers

### Create Time-Based Trigger
```bash
curl -X POST http://localhost:5000/api/pm-triggers \
  -H "Content-Type: application/json" \
  -d '{
    "pmScheduleId": 1,
    "type": "TIME_BASED",
    "name": "Monthly Maintenance",
    "intervalMonths": 1
  }'
```

### Create Usage-Based Trigger
```bash
curl -X POST http://localhost:5000/api/pm-triggers \
  -H "Content-Type: application/json" \
  -d '{
    "pmScheduleId": 1,
    "type": "USAGE_BASED",
    "name": "Every 500 Hours",
    "meterType": "HOURS",
    "thresholdValue": 500
  }'
```

### Create Condition-Based Trigger
```bash
curl -X POST http://localhost:5000/api/pm-triggers \
  -H "Content-Type: application/json" \
  -d '{
    "pmScheduleId": 1,
    "type": "CONDITION_BASED",
    "name": "High Temperature Alert",
    "sensorField": "temperature",
    "comparisonOperator": ">",
    "thresholdValue": 85
  }'
```

### Check Due Triggers
```bash
curl http://localhost:5000/api/pm-triggers/evaluate/due
```

## 📊 Meter Readings

### Record Meter Reading
```bash
curl -X POST http://localhost:5000/api/meter-readings/asset/670 \
  -H "Content-Type: application/json" \
  -d '{
    "meterType": "HOURS",
    "value": 1250.5,
    "unit": "hours",
    "notes": "Regular reading during inspection"
  }'
```

### Get Latest Readings
```bash
curl http://localhost:5000/api/meter-readings/asset/670/latest
```

### Get Usage Trends
```bash
curl "http://localhost:5000/api/meter-readings/asset/670/trends?meterType=HOURS&days=30"
```

## 🔧 Work Order Generation

The work order generator service runs automatically, but you can also trigger it manually:

### Generate Work Orders from Due PMs
```bash
# This would typically be called by the scheduler service
# For manual testing, you can call the PM evaluation endpoints
curl http://localhost:5000/api/pm-triggers/evaluate/due
```

## 📈 Maintenance History

### Create Maintenance Record
```bash
curl -X POST http://localhost:5000/api/maintenance-history \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": 670,
    "workOrderId": 363,
    "type": "PREVENTIVE",
    "title": "Monthly HVAC Maintenance",
    "description": "Completed filter replacement and system check",
    "durationMinutes": 45,
    "laborCost": 75.00,
    "partsCost": 25.00,
    "notes": "All systems operating normally"
  }'
```

### Get Asset Maintenance History
```bash
curl http://localhost:5000/api/maintenance-history/asset/670
```

### Get Maintenance Statistics
```bash
curl "http://localhost:5000/api/maintenance-history/asset/670/stats?days=90"
```

### Get Compliance Report
```bash
curl "http://localhost:5000/api/maintenance-history/compliance/report?startDate=2025-01-01&endDate=2025-12-31"
```

## 📅 PM Calendar Integration

The PM Calendar is a React component that integrates with these APIs:

```typescript
// Example usage in React component
import { PMCalendar } from './components/PMCalendar';

const MaintenancePage = () => {
  return (
    <div>
      <PMCalendar 
        onDateSelect={(date) => console.log('Selected:', date)}
        onPMClick={(pm) => console.log('PM clicked:', pm)}
      />
    </div>
  );
};
```

## 🔄 Complete PM Workflow Example

Here's how to set up a complete PM workflow:

### 1. Create Asset (if not exists)
```bash
curl -X POST http://localhost:5000/api/assets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Line Conveyor",
    "serialNumber": "CONV-001",
    "modelNumber": "CX-2000",
    "manufacturer": "ConveyorCorp",
    "locationId": 1,
    "organizationId": 1,
    "criticality": "HIGH"
  }'
```

### 2. Create PM Task Template
```bash
curl -X POST http://localhost:5000/api/pm-tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Conveyor Belt Inspection",
    "type": "INSPECTION",
    "procedure": "1. Check belt alignment\n2. Inspect for wear\n3. Lubricate bearings\n4. Test emergency stops",
    "estimatedMinutes": 60,
    "safetyRequirements": "LOTO, safety glasses"
  }'
```

### 3. Create PM Schedule
```bash
curl -X POST http://localhost:5000/api/pm-schedules \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Weekly Conveyor Maintenance",
    "description": "Regular preventive maintenance",
    "frequency": "weekly",
    "nextDue": "2025-08-11T08:00:00.000Z",
    "assetId": 671
  }'
```

### 4. Link Task to Schedule
```bash
curl -X POST http://localhost:5000/api/pm-tasks/schedule/2/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "pmTaskId": 1,
    "orderIndex": 1
  }'
```

### 5. Add Time-Based Trigger
```bash
curl -X POST http://localhost:5000/api/pm-triggers \
  -H "Content-Type: application/json" \
  -d '{
    "pmScheduleId": 2,
    "type": "TIME_BASED",
    "name": "Weekly Schedule",
    "intervalWeeks": 1
  }'
```

### 6. Record Equipment Usage
```bash
curl -X POST http://localhost:5000/api/meter-readings/asset/671 \
  -H "Content-Type: application/json" \
  -d '{
    "meterType": "HOURS",
    "value": 168.5,
    "notes": "End of week reading"
  }'
```

Now the system will:
- ✅ Automatically generate work orders when triggers fire
- ✅ Create task checklists from your templates
- ✅ Track completion and compliance
- ✅ Log maintenance history
- ✅ Show everything in the calendar view

## 🎯 Key Response Formats

### PM Task Response
```json
{
  "id": 1,
  "title": "Monthly HVAC Filter Replacement",
  "type": "REPLACEMENT",
  "estimatedMinutes": 30,
  "procedure": "Step-by-step instructions...",
  "safetyRequirements": "LOTO required, wear gloves",
  "toolsRequired": "Screwdriver, flashlight",
  "partsRequired": "HEPA filter 20x25x1"
}
```

### PM Trigger Response
```json
{
  "id": 1,
  "type": "TIME_BASED",
  "name": "Monthly Maintenance",
  "intervalMonths": 1,
  "nextDue": "2025-09-01T00:00:00.000Z",
  "isActive": true
}
```

### Maintenance History Response
```json
{
  "id": 1,
  "type": "PREVENTIVE",
  "title": "Monthly HVAC Maintenance",
  "performedAt": "2025-08-04T10:30:00.000Z",
  "durationMinutes": 45,
  "totalCost": 100.00,
  "isCompleted": true,
  "asset": {
    "name": "Test HVAC Unit"
  }
}
```

## 🛠️ Development Tips

- Use the development auth bypass for testing (automatic in non-production)
- Check server logs for detailed error messages
- Use the PM Calendar component to visualize schedules
- Test trigger evaluation endpoints to verify logic
- Monitor maintenance history for compliance tracking

## 📚 Related Documentation

- `PM_IMPLEMENTATION_COMPLETE.md` - Full implementation details
- `PM_IMPLEMENTATION_PLAN.md` - Original planning document
- Frontend calendar components in `/frontend/src/components/PMCalendar/`