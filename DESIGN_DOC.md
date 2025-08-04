# Compass CMMS - Developer Design Document

## Project Overview

**Compass CMMS** is a compliance-first, mobile-optimized computerized maintenance management system with AI-enhanced tools and an integrated advertising-driven marketplace.

### Core Goals
- ✅ MVP delivery in 12 months with mobile-first UX
- ✅ Advertising-based monetization without workflow disruption  
- ✅ Privacy compliance (GDPR, CCPA)
- ✅ Scale to 50,000+ users across industries

---

## Development Setup

### Quick Start (Development)
```bash
# Backend setup
cd backend
npm install
npx prisma db push --accept-data-loss # Apply schema changes
npx ts-node src/import/importLocations.ts # Import initial data
npx ts-node src/import/importAssets.ts
npx ts-node src/import/importVendors.ts
npx ts-node src/import/importParts.ts
npx ts-node src/import/importWorkOrders.ts
npx ts-node src/tools/assignDataToAdmin.ts # Assign all data to admin
npm run dev

# Frontend setup  
cd frontend
npm install
npm run dev

# Mobile setup
cd mobile  
npm install
npm run ios # or npm run android
```

### Development Stack
- **Database**: SQLite (dev) → PostgreSQL (prod)
- **Auth**: Local JWT (dev) → Supabase Auth (prod)
- **Storage**: Local filesystem (dev) → S3/Supabase Storage (prod)

---

## Architecture Overview

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Mobile App    │    │   Backend API   │
│                 │    │                 │    │                 │
│ React + TS      │◄──►│ React Native    │◄──►│ Node.js + TS    │
│ MUI + Tailwind  │    │ + WatermelonDB  │    │ Express/Fastify │
│ TanStack Query  │    │ Offline Sync    │    │ Prisma ORM      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                               ┌─────────────────┐
                                               │   Database      │
                                               │                 │
                                               │ SQLite (dev)    │
                                               │ PostgreSQL(prod)│
                                               └─────────────────┘
```

### Core Modules (Development Priority)

**Phase 1 (Months 1-3)**
- ✅ User Management & Auth
- ✅ Work Order CRUD
- ✅ Basic Asset Management
- ✅ Mobile App Foundation

**Phase 2 (Months 4-6)**  
- ✅ Preventive Maintenance Scheduling
- ✅ Inventory Management
- ✅ File Upload & OCR Integration
- ✅ Basic Reporting

**Phase 3 (Months 7-9)**
- ✅ AI Tools (OCR, Speech-to-Text)
- ✅ Advanced Reporting & Analytics
- ✅ Advertising Framework
- ✅ API Partner Portal

**Phase 4 (Months 10-12)**
- ✅ Predictive Maintenance
- ✅ Advanced Ad Targeting
- ✅ Performance Optimization
- ✅ Production Deployment

---

## Technology Stack

### Backend
```typescript
// Core Stack
Runtime: Node.js 18+ + TypeScript 5+
Framework: Express.js (simple) OR Fastify (performance)
Database: Prisma ORM + SQLite (dev) + PostgreSQL (prod) 
Auth: JWT (dev) + Supabase Auth (prod)
Caching: Redis (prod only)

// Development Dependencies
Testing: Jest + Supertest
Linting: ESLint + Prettier
Validation: Zod
Documentation: Swagger/OpenAPI
```

### Frontend  
```typescript
// Core Stack
Framework: React 18 + TypeScript 5+
UI Library: MUI (comprehensive) OR Radix UI + Tailwind (flexible)
State: Redux Toolkit (complex) OR Zustand (simple)
Data Fetching: TanStack Query (React Query)
Routing: React Router v6

// Development Dependencies  
Testing: Jest + React Testing Library
Build: Vite (fast) OR Create React App (stable)
```

### Mobile
```typescript
// Core Stack
Framework: React Native 0.72+ + TypeScript
Navigation: React Navigation v6
Storage: WatermelonDB (offline-first)
Camera: react-native-vision-camera
Push: React Native Firebase

// Development Dependencies
State: Redux Toolkit + RTK Query
Testing: Jest + Detox (E2E)
```

---

## Database Design

### Core Entities
```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ENUMS for data consistency
enum UserRole {
  ADMIN
  MANAGER
  TECHNICIAN
}

enum WorkOrderStatus {
  OPEN
  IN_PROGRESS
  ON_HOLD
  COMPLETED
  CANCELED
}

enum WorkOrderPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum AssetStatus {
  ONLINE
  OFFLINE
}

enum AssetCriticality {
  LOW
  MEDIUM
  HIGH
  IMPORTANT
}


// MODELS
model User {
  id             Int          @id @default(autoincrement())
  legacyId       Int?         @unique
  email          String       @unique
  name           String
  password       String // Will be hashed
  role           UserRole     @default(TECHNICIAN)
  organizationId Int
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  workOrders     WorkOrder[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Organization {
  id        Int      @id @default(autoincrement())
  legacyId  Int?     @unique
  name      String @unique
  settings  Json?
  users     User[]
  assets    Asset[]
  locations Location[]
  suppliers Supplier[]
  parts     Part[]
  workOrders WorkOrder[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Asset {
  id             Int          @id @default(autoincrement())
  legacyId       Int?         @unique
  name           String
  description    String?
  serialNumber   String?
  modelNumber    String?
  manufacturer   String?
  year           Int?
  status         AssetStatus  @default(ONLINE)
  criticality    AssetCriticality @default(MEDIUM)
  barcode        String?
  imageUrl       String?
  attachments    Json?
  locationId     Int
  organizationId Int
  parentId       Int?
  location       Location     @relation(fields: [locationId], references: [id], onDelete: Restrict)
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  parent         Asset?       @relation("AssetHierarchy", fields: [parentId], references: [id], onDelete: SetNull)
  children       Asset[]      @relation("AssetHierarchy")
  workOrders     WorkOrder[]
  pmSchedules    PMSchedule[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Location {
  id             Int          @id @default(autoincrement())
  legacyId       Int?         @unique
  name           String
  description    String?
  address        String?
  organizationId Int
  parentId       Int?
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  parent         Location?    @relation("LocationHierarchy", fields: [parentId], references: [id], onDelete: SetNull)
  children       Location[]   @relation("LocationHierarchy")
  assets         Asset[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model WorkOrder {
  id           Int               @id @default(autoincrement())
  legacyId     Int?              @unique
  title        String
  description  String?
  status       WorkOrderStatus   @default(OPEN)
  priority     WorkOrderPriority @default(MEDIUM)
  assetId      Int?
  assignedToId Int?
  asset        Asset?            @relation(fields: [assetId], references: [id], onDelete: Cascade)
  assignedTo   User?             @relation(fields: [assignedToId], references: [id], onDelete: SetNull)
  organizationId Int
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model PMSchedule {
  id          Int      @id @default(autoincrement())
  legacyId    Int?     @unique
  title       String
  description String?
  frequency   String // e.g., "daily", "weekly", "monthly"
  nextDue     DateTime
  assetId     Int
  asset       Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Part {
  id             Int       @id @default(autoincrement())
  legacyId       Int?      @unique
  name           String
  description    String?
  sku            String?   @unique
  stockLevel     Int       @default(0)
  reorderPoint   Int       @default(0)
  organizationId Int
  supplierId     Int?
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  supplier       Supplier? @relation(fields: [supplierId], references: [id], onDelete: SetNull)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Supplier {
  id             Int      @id @default(autoincrement())
  legacyId       Int?     @unique
  name           String
  contactInfo    String?
  address        String?
  organizationId Int
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  parts          Part[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Migration Strategy
```typescript
// Development: SQLite
DATABASE_URL="file:./dev.db"

// Production: PostgreSQL via Supabase
DATABASE_URL="postgresql://user:pass@db.supabase.co/postgres"

// Migration command
npx prisma migrate deploy
```

---

## API Design

### REST API Structure
```
/api/v1/
├── auth/
│   ├── POST /login
│   ├── POST /register  
│   └── POST /refresh
├── work-orders/
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PUT /:id
│   └── DELETE /:id
├── assets/
│   ├── GET /
│   ├── POST /
│   └── GET /:id/history
└── users/
    ├── GET /profile
    └── PUT /profile
```

### Authentication Flow
```typescript
// Development: Local JWT
const token = jwt.sign({ userId: user.id }, JWT_SECRET);

// Production: Supabase Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email, password
});
```

### Error Handling
```typescript
// Standardized error responses
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { "email": "Email is required" }
  }
}
```

---

## Mobile Architecture

### Offline-First Strategy
```typescript
// WatermelonDB for local storage
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

// Sync with backend when online
const syncChanges = async () => {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      const response = await api.get(`/sync/pull?since=${lastPulledAt}`);
      return response.data;
    },
    pushChanges: async ({ changes }) => {
      await api.post('/sync/push', changes);
    },
  });
};
```

### Camera Integration
```typescript
// OCR for equipment nameplates
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useTextRecognition } from 'react-native-text-recognition';

const ScanNameplate = () => {
  const device = useCameraDevice('back');
  const { scanText } = useTextRecognition();
  
  const handleCapture = async (photo) => {
    const text = await scanText(photo.path);
    // Process nameplate data
  };
};
```

---

## AI/ML Integration

### OCR Pipeline
```typescript
// Google Cloud Vision (production)
import { ImageAnnotatorClient } from '@google-cloud/vision';
const client = new ImageAnnotatorClient();

// Tesseract.js (development/fallback)  
import Tesseract from 'tesseract.js';
const { data: { text } } = await Tesseract.recognize(image, 'eng');
```

### Speech-to-Text
```typescript
// OpenAI Whisper API
const transcription = await openai.audio.transcriptions.create({
  file: audioFile,
  model: "whisper-1",
});
```

---

## Advertising Integration (Phase 3)

### Non-Intrusive Ad Placement
```typescript
// Contextual ads during non-critical workflows
const AdComponent = ({ context }) => {
  const { data: ad } = useQuery(['ad', context], 
    () => fetchContextualAd(context),
    { enabled: userConsent && !isUrgentWorkflow }
  );
  
  return ad ? <LazyAdBanner ad={ad} /> : null;
};

// Only show during: reports, asset browsing, inventory review
// Never during: active work orders, emergency situations
```

### Privacy-First Approach
```typescript
// Granular consent management
const ConsentManager = {
  analytics: boolean,
  advertising: boolean,
  functionalCookies: boolean,
  // User can opt-out anytime
};
```

---

## Security & Compliance

### Data Protection
```typescript
// Encryption at rest (production)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

// Audit logging
const auditLog = {
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  timestamp: Date,
  ipAddress: string
};
```

### GDPR/CCPA Compliance
```typescript
// Data deletion API
DELETE /api/v1/users/:id/data
// Removes: personal data, behavioral logs, ad targeting data
// Retains: anonymous audit logs, aggregated analytics
```

---

## DevOps & Deployment

### Development Environment
```bash
# Local development
docker-compose up  # Database, Redis, etc.
npm run dev       # Hot reload backend
npm start         # Frontend dev server
```

### Production Deployment
```yaml
# GitHub Actions CI/CD
name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
```

### Monitoring Stack  
```typescript
// Error tracking
import * as Sentry from "@sentry/node";

// Performance monitoring  
import { performance } from "perf_hooks";

// Business metrics
import { analytics } from "./services/analytics";
```

---

## Testing Strategy

### Backend Testing
```typescript
// Unit tests
describe('WorkOrderService', () => {
  it('should create work order', async () => {
    const workOrder = await createWorkOrder(mockData);
    expect(workOrder.status).toBe('OPEN');
  });
});

// Integration tests  
describe('WorkOrder API', () => {
  it('should create and retrieve work order', async () => {
    const response = await request(app)
      .post('/api/v1/work-orders')
      .send(mockWorkOrder);
    expect(response.status).toBe(201);
  });
});
```

### Frontend Testing
```typescript
// Component tests
import { render, screen } from '@testing-library/react';
import WorkOrderList from './WorkOrderList';

test('displays work orders', () => {
  render(<WorkOrderList workOrders={mockData} />);
  expect(screen.getByText('Fix Pump #1')).toBeInTheDocument();
});
```

---

## Performance Considerations

### Database Optimization
```sql
-- Index critical queries
CREATE INDEX idx_workorder_status ON work_orders(status);
CREATE INDEX idx_workorder_assigned ON work_orders(assigned_to_id);
CREATE INDEX idx_asset_organization ON assets(organization_id);
```

### Caching Strategy
```typescript
// Redis caching (production)
const getCachedAssets = async (organizationId: string) => {
  const cached = await redis.get(`assets:${organizationId}`);
  if (cached) return JSON.parse(cached);
  
  const assets = await prisma.asset.findMany({
    where: { organizationId }
  });
  
  await redis.setex(`assets:${organizationId}`, 300, JSON.stringify(assets));
  return assets;
};
```

### Bundle Optimization
```typescript
// Code splitting
const WorkOrderDetails = lazy(() => import('./WorkOrderDetails'));
const ReportsPage = lazy(() => import('./ReportsPage'));

// Tree shaking
import { debounce } from 'lodash-es'; // Not entire lodash
```

---

## Data Import Tools

To facilitate importing existing data, dedicated import tools have been developed for each major entity. These tools are designed to be run independently and can handle upsert operations (create if not exists, update if exists) based on `legacyId` from the source CSVs. This allows for incremental imports and re-imports without data duplication issues.

### Usage
Each import tool is a TypeScript file located in `backend/src/import/`. To run an import, navigate to the `backend` directory and execute the corresponding script using `ts-node`:

```bash
# Example: Import Locations
npx ts-node src/import/importLocations.ts

# Example: Import Assets
npx ts-node src/import/importAssets.ts

# Example: Import Vendors
npx ts-node src/import/importVendors.ts

# Example: Import Parts
npx ts-node src/import/importParts.ts

# Example: Import Work Orders
npx ts-node src/import/importWorkOrders.ts
```

**Important Notes:**
- Ensure your database is accessible and the schema is up-to-date before running import tools.
- The import tools rely on `legacyId` from the source CSVs to track existing records. Do not modify these IDs in your CSVs if you intend to re-import or update data.
- The order of execution matters for related data (e.g., Locations must be imported before Assets).

