# 🔌 CMMS API Reference

Complete API documentation for the Compass CMMS backend services.

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Core Resources](#core-resources)
  - [Authentication](#auth-endpoints)
  - [Assets](#assets)
  - [Work Orders](#work-orders)
  - [Notifications](#notifications)
  - [Maintenance](#maintenance)
  - [Inventory](#inventory)
  - [Users](#users)
  - [Portals](#portals)
- [Specialized Features](#specialized-features)
  - [Import/Export](#importexport)
  - [QR Code System](#qr-code-system)
  - [Public Endpoints](#public-endpoints)
- [Webhooks](#webhooks)

## Overview

**Base URL**: `https://your-domain.com/api` (Production) | `http://localhost:3000/api` (Development)

**Content Type**: All requests and responses use `application/json` unless specified otherwise.

**API Version**: v1 (included in URL path where applicable)

## Authentication

### JWT Token Authentication
The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### Token Lifecycle
- **Access Token**: Valid for 1 hour
- **Refresh Token**: Valid for 30 days (if implemented)
- **Token Storage**: Store securely in httpOnly cookies or secure storage

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation error details"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

## Rate Limiting

- **Global**: 1000 requests per hour per IP
- **Authentication**: 20 login attempts per hour per IP
- **Import/Export**: 10 operations per hour per user
- **File Upload**: 100MB per hour per user

Rate limit headers included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

## Auth Endpoints

### POST /api/auth/login
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "ADMIN",
      "organizationId": 1
    }
  }
}
```

### POST /api/auth/register
Register new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "New User",
  "role": "TECHNICIAN"
}
```

### POST /api/auth/forgot-password
Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

### POST /api/auth/reset-password
Reset password with token from email.

**Request:**
```json
{
  "token": "reset_token_from_email",
  "password": "newpassword123"
}
```

---

## Assets

### GET /api/assets
List all assets with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50, max: 100)
- `search` (string): Search in name, description, serial number
- `status` (string): Filter by status (ONLINE, OFFLINE)
- `criticality` (string): Filter by criticality (LOW, MEDIUM, HIGH, IMPORTANT)
- `locationId` (number): Filter by location
- `sortBy` (string): Sort field (name, createdAt, status)
- `sortOrder` (string): Sort direction (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "assets": [
      {
        "id": 1,
        "name": "Boiler Unit #1",
        "description": "Main heating boiler",
        "serialNumber": "BU001",
        "modelNumber": "HB-2000",
        "manufacturer": "ACME Heating",
        "year": 2020,
        "status": "ONLINE",
        "criticality": "HIGH",
        "barcode": "AST001",
        "imageUrl": "https://...",
        "location": {
          "id": 1,
          "name": "Boiler Room"
        },
        "createdAt": "2024-01-01T12:00:00Z",
        "updatedAt": "2024-01-01T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "pages": 2
    }
  }
}
```

### GET /api/assets/:id
Get detailed asset information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Boiler Unit #1",
    "description": "Main heating boiler",
    "serialNumber": "BU001",
    "modelNumber": "HB-2000",
    "manufacturer": "ACME Heating",
    "year": 2020,
    "status": "ONLINE",
    "criticality": "HIGH",
    "barcode": "AST001",
    "imageUrl": "https://...",
    "attachments": ["doc1.pdf", "manual.pdf"],
    "location": {
      "id": 1,
      "name": "Boiler Room",
      "parent": "Building A"
    },
    "maintenanceHistory": [
      {
        "id": 1,
        "workOrderId": 123,
        "title": "Monthly Inspection",
        "completedAt": "2024-01-01T12:00:00Z",
        "technician": "John Doe"
      }
    ],
    "upcomingMaintenance": [
      {
        "id": 2,
        "title": "Annual Service",
        "dueDate": "2024-02-01T12:00:00Z",
        "priority": "HIGH"
      }
    ],
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

### POST /api/assets
Create new asset.

**Request:**
```json
{
  "name": "New Asset",
  "description": "Asset description",
  "serialNumber": "SN123",
  "modelNumber": "Model-X",
  "manufacturer": "ManufacturerName",
  "year": 2024,
  "status": "ONLINE",
  "criticality": "MEDIUM",
  "barcode": "BARCODE123",
  "locationId": 1,
  "parentId": 2
}
```

### PUT /api/assets/:id
Update existing asset.

### DELETE /api/assets/:id
Delete asset (soft delete with history preservation).

---

## Work Orders

### GET /api/work-orders
List work orders with comprehensive filtering.

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: Filter by status (OPEN, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELED)
- `priority`: Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `assignedTo`: Filter by assigned technician ID
- `assetId`: Filter by asset
- `locationId`: Filter by location
- `dueDate`: Filter by due date range
- `search`: Search in title and description

**Response:**
```json
{
  "success": true,
  "data": {
    "workOrders": [
      {
        "id": 1,
        "title": "Replace Air Filter",
        "description": "Monthly air filter replacement",
        "status": "OPEN",
        "priority": "MEDIUM",
        "workType": "PREVENTIVE",
        "estimatedHours": 2.5,
        "actualHours": null,
        "dueDate": "2024-01-15T09:00:00Z",
        "completedAt": null,
        "asset": {
          "id": 1,
          "name": "HVAC Unit #1"
        },
        "location": {
          "id": 1,
          "name": "Roof Level"
        },
        "assignedTo": {
          "id": 2,
          "name": "John Smith",
          "email": "john@example.com"
        },
        "createdBy": {
          "id": 1,
          "name": "Manager"
        },
        "createdAt": "2024-01-01T12:00:00Z",
        "updatedAt": "2024-01-01T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 25,
      "pages": 1
    },
    "summary": {
      "total": 25,
      "open": 10,
      "inProgress": 8,
      "completed": 7,
      "overdue": 3
    }
  }
}
```

### GET /api/work-orders/:id
Get detailed work order with comments, time logs, and attachments.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Replace Air Filter",
    "description": "Monthly air filter replacement with detailed inspection",
    "status": "IN_PROGRESS",
    "priority": "MEDIUM",
    "workType": "PREVENTIVE",
    "estimatedHours": 2.5,
    "actualHours": 1.75,
    "dueDate": "2024-01-15T09:00:00Z",
    "startedAt": "2024-01-14T08:30:00Z",
    "completedAt": null,
    "asset": {
      "id": 1,
      "name": "HVAC Unit #1",
      "location": "Roof Level"
    },
    "assignedTo": {
      "id": 2,
      "name": "John Smith",
      "email": "john@example.com"
    },
    "tasks": [
      {
        "id": 1,
        "title": "Remove old filter",
        "completed": true,
        "completedAt": "2024-01-14T09:00:00Z"
      },
      {
        "id": 2,
        "title": "Install new filter",
        "completed": false
      }
    ],
    "comments": [
      {
        "id": 1,
        "text": "Old filter was heavily clogged",
        "author": "John Smith",
        "createdAt": "2024-01-14T09:15:00Z"
      }
    ],
    "timeLogs": [
      {
        "id": 1,
        "startTime": "2024-01-14T08:30:00Z",
        "endTime": "2024-01-14T10:15:00Z",
        "duration": 1.75,
        "description": "Filter replacement work"
      }
    ],
    "attachments": [
      {
        "id": 1,
        "fileName": "before_photo.jpg",
        "url": "https://...",
        "uploadedAt": "2024-01-14T09:00:00Z"
      }
    ],
    "partsUsed": [
      {
        "partId": 1,
        "partName": "Air Filter 20x25x4",
        "quantity": 1,
        "unitCost": 25.99
      }
    ]
  }
}
```

### POST /api/work-orders
Create new work order.

**Request:**
```json
{
  "title": "Repair Pump Motor",
  "description": "Pump motor making unusual noise",
  "priority": "HIGH",
  "assetId": 5,
  "assignedToId": 2,
  "dueDate": "2024-01-20T10:00:00Z",
  "estimatedHours": 4,
  "tasks": [
    {
      "title": "Inspect motor bearings"
    },
    {
      "title": "Replace if necessary"
    }
  ]
}
```

### PUT /api/work-orders/:id/status
Update work order status with validation and notifications.

**Request:**
```json
{
  "status": "COMPLETED",
  "completionNotes": "Filter replaced successfully",
  "actualHours": 2.0,
  "partsUsed": [
    {
      "partId": 1,
      "quantity": 1
    }
  ]
}
```

---

## Notifications

### GET /api/notifications
Get user notifications with filtering.

**Query Parameters:**
- `page`, `limit`: Pagination
- `category`: Filter by category (WORK_ORDER, ASSET, MAINTENANCE, SYSTEM, etc.)
- `type`: Filter by type (INFO, WARNING, ALERT, SUCCESS)
- `priority`: Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `isRead`: Filter by read status (true/false)
- `isArchived`: Include archived notifications (default: false)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_123",
        "title": "Work Order Overdue",
        "message": "Work Order #45 is 2 days overdue",
        "type": "ALERT",
        "priority": "HIGH",
        "category": "WORK_ORDER",
        "isRead": false,
        "isArchived": false,
        "actionUrl": "/work-orders/45",
        "actionLabel": "View Work Order",
        "createdAt": "2024-01-01T12:00:00Z",
        "readAt": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 15,
      "pages": 1
    },
    "summary": {
      "total": 15,
      "unread": 8,
      "byCategory": {
        "WORK_ORDER": 5,
        "ASSET": 3,
        "SYSTEM": 2,
        "MAINTENANCE": 5
      }
    }
  }
}
```

### PUT /api/notifications/:id/read
Mark notification as read.

### PUT /api/notifications/:id/acknowledge
Acknowledge notification (mark as read and optionally archive).

**Request:**
```json
{
  "archive": true
}
```

### DELETE /api/notifications/:id
Delete single notification.

### DELETE /api/notifications/all/clear
Clear all notifications with optional category filter.

**Query Parameters:**
- `category`: Only clear notifications of specific category

### GET /api/notifications/stats
Get notification statistics for dashboard.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "unread": 8,
    "urgent": 2,
    "byCategory": {
      "WORK_ORDER": 10,
      "ASSET": 5,
      "MAINTENANCE": 7,
      "SYSTEM": 3
    },
    "byType": {
      "INFO": 15,
      "WARNING": 6,
      "ALERT": 3,
      "SUCCESS": 1
    }
  }
}
```

---

## Maintenance

### GET /api/maintenance/schedules
List preventive maintenance schedules.

**Response:**
```json
{
  "success": true,
  "data": {
    "schedules": [
      {
        "id": 1,
        "title": "Monthly Filter Change",
        "description": "Replace HVAC filters monthly",
        "frequency": "monthly",
        "frequencyValue": 1,
        "asset": {
          "id": 1,
          "name": "HVAC Unit #1"
        },
        "assignedTo": {
          "id": 2,
          "name": "John Smith"
        },
        "lastCompleted": "2023-12-15T10:00:00Z",
        "nextDue": "2024-01-15T10:00:00Z",
        "isActive": true,
        "tasks": [
          {
            "id": 1,
            "title": "Inspect current filter",
            "description": "Check filter condition",
            "estimatedMinutes": 10
          },
          {
            "id": 2,
            "title": "Replace filter if needed",
            "estimatedMinutes": 15
          }
        ]
      }
    ]
  }
}
```

### GET /api/maintenance/calendar
Get maintenance calendar data for specified date range.

**Query Parameters:**
- `startDate`: Start date (ISO 8601)
- `endDate`: End date (ISO 8601)
- `assetId`: Filter by specific asset
- `assigneeId`: Filter by assigned technician

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": 1,
        "title": "Monthly Filter Change",
        "date": "2024-01-15",
        "time": "10:00",
        "type": "PREVENTIVE",
        "priority": "MEDIUM",
        "asset": "HVAC Unit #1",
        "assignedTo": "John Smith",
        "status": "SCHEDULED",
        "estimatedDuration": 60
      }
    ]
  }
}
```

---

## Inventory

### GET /api/parts
List inventory parts with stock levels.

**Response:**
```json
{
  "success": true,
  "data": {
    "parts": [
      {
        "id": 1,
        "name": "Air Filter 20x25x4",
        "description": "MERV 11 pleated air filter",
        "sku": "AF-20254-M11",
        "category": "HVAC",
        "stockLevel": 15,
        "reorderPoint": 5,
        "unitCost": 25.99,
        "supplier": {
          "id": 1,
          "name": "HVAC Supply Co"
        },
        "location": "Storage Room A",
        "lowStock": false,
        "lastRestocked": "2023-12-01T10:00:00Z"
      }
    ],
    "summary": {
      "totalParts": 150,
      "lowStockItems": 8,
      "outOfStockItems": 2,
      "totalValue": 15750.50
    }
  }
}
```

### POST /api/parts/:id/restock
Record inventory restock transaction.

**Request:**
```json
{
  "quantity": 20,
  "unitCost": 25.99,
  "supplier": "HVAC Supply Co",
  "invoiceNumber": "INV-2024-001",
  "notes": "Bulk purchase for quarterly stock"
}
```

---

## Portals

### GET /api/portals
List public portals for organization.

**Response:**
```json
{
  "success": true,
  "data": {
    "portals": [
      {
        "id": "portal_123",
        "name": "Customer Maintenance Requests",
        "slug": "maintenance-requests",
        "description": "Submit maintenance requests for your facility",
        "isActive": true,
        "isPublic": true,
        "theme": {
          "primaryColor": "#1976d2",
          "logo": "https://...",
          "brandName": "Acme Corp"
        },
        "formConfig": {
          "fields": [
            {
              "id": "location",
              "type": "location-picker",
              "label": "Location",
              "required": true
            },
            {
              "id": "description",
              "type": "textarea",
              "label": "Issue Description",
              "required": true
            }
          ]
        },
        "createdAt": "2024-01-01T12:00:00Z",
        "submissions": 45
      }
    ]
  }
}
```

### GET /api/portals/:slug/public
Get public portal configuration (no authentication required).

---

## Import/Export

### POST /api/import/analyze
Analyze CSV file and generate column mappings.

**Request:** (multipart/form-data)
- `file`: CSV file
- `entityType`: Type of data (assets, work-orders, parts, etc.)

**Response:**
```json
{
  "success": true,
  "data": {
    "fileName": "assets.csv",
    "totalRows": 100,
    "headers": ["Name", "Serial Number", "Location", "Status"],
    "columnMappings": [
      {
        "csvColumn": "Name",
        "targetField": "name",
        "confidence": 100,
        "required": true
      },
      {
        "csvColumn": "Serial Number",
        "targetField": "serialNumber",
        "confidence": 95,
        "required": false
      }
    ],
    "preview": [
      {
        "Name": "Boiler #1",
        "Serial Number": "B001",
        "Location": "Basement",
        "Status": "Online"
      }
    ]
  }
}
```

### POST /api/import/execute
Execute data import with validated mappings.

**Request:**
```json
{
  "entityType": "assets",
  "mappings": [
    {
      "csvColumn": "Name",
      "targetField": "name"
    }
  ],
  "csvData": [
    {
      "Name": "Boiler #1",
      "Serial Number": "B001"
    }
  ]
}
```

### GET /api/export/templates/:entityType
Get export template for entity type.

### POST /api/export/generate
Generate export file with custom configuration.

---

## QR Code System

### GET /api/qr/:code/info
Get information associated with QR code (requires QR authentication).

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "ASSET",
    "entityId": 1,
    "entity": {
      "id": 1,
      "name": "Boiler Unit #1",
      "status": "ONLINE",
      "location": "Boiler Room"
    },
    "quickActions": [
      "CREATE_WORK_ORDER",
      "VIEW_MAINTENANCE_HISTORY",
      "UPDATE_STATUS"
    ]
  }
}
```

### POST /api/qr/generate
Generate QR code for entity.

**Request:**
```json
{
  "entityType": "ASSET",
  "entityId": 1,
  "size": 256
}
```

---

## Public Endpoints

### POST /api/public/portals/:slug/submit
Submit form to public portal (no authentication required).

**Request:**
```json
{
  "formData": {
    "location": "Building A - Room 101",
    "description": "Air conditioning not working",
    "priority": "HIGH",
    "contactEmail": "user@example.com"
  },
  "captcha": "captcha_token"
}
```

### GET /api/public/share/:token
Access shared work order or asset (public sharing).

---

## Webhooks

### POST /api/webhooks/configure
Configure webhook endpoints for real-time notifications.

**Request:**
```json
{
  "url": "https://your-app.com/webhooks/cmms",
  "events": [
    "work_order.created",
    "work_order.completed",
    "asset.status_changed",
    "maintenance.due"
  ],
  "secret": "webhook_secret_key"
}
```

### Webhook Event Format
```json
{
  "event": "work_order.completed",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "workOrderId": 123,
    "title": "Filter Replacement",
    "completedBy": "John Smith",
    "completedAt": "2024-01-01T11:45:00Z"
  }
}
```

---

## SDK and Integration Examples

### JavaScript/TypeScript
```typescript
import { CMMSClient } from '@compass/cmms-sdk';

const client = new CMMSClient({
  baseURL: 'https://api.your-domain.com',
  token: 'your_jwt_token'
});

// Get assets
const assets = await client.assets.list({
  status: 'ONLINE',
  page: 1,
  limit: 50
});

// Create work order
const workOrder = await client.workOrders.create({
  title: 'Emergency Repair',
  assetId: 123,
  priority: 'URGENT'
});
```

### curl Examples
```bash
# Login
curl -X POST https://api.your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Get assets
curl -X GET "https://api.your-domain.com/api/assets?status=ONLINE" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Create work order
curl -X POST https://api.your-domain.com/api/work-orders \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Repair Task","assetId":1,"priority":"HIGH"}'
```

---

## Performance & Optimization

### Response Caching
- **Assets**: 5 minutes
- **Work Orders**: 1 minute
- **Notifications**: Real-time (no cache)
- **Reports**: 15 minutes

### Pagination Best Practices
- Use `limit` parameter (max 100 items)
- Include `total` count for UI pagination
- Use cursor-based pagination for large datasets

### Bulk Operations
- Import: Max 10,000 records per request
- Export: Max 50,000 records per request
- Use async processing for large operations

---

This API reference covers the core functionality of the Compass CMMS system. For additional endpoints or detailed implementation examples, refer to the source code or contact the development team.
