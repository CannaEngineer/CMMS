# 🛠️ Development Guide

Comprehensive guide for developers working on the Compass CMMS project.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Development Workflow](#development-workflow)
- [Code Architecture](#code-architecture)
- [Database Management](#database-management)
- [Testing Strategy](#testing-strategy)
- [Debugging Guide](#debugging-guide)
- [Performance Guidelines](#performance-guidelines)
- [Security Considerations](#security-considerations)
- [Best Practices](#best-practices)

## Prerequisites

### Required Software
- **Node.js** 18.0+ (LTS recommended)
- **npm** 9.0+ or **yarn** 1.22+
- **Git** 2.30+
- **VS Code** (recommended) with extensions:
  - TypeScript and JavaScript Language Features
  - Prisma
  - ESLint
  - Prettier
  - Thunder Client (for API testing)
  - GitLens

### Recommended Tools
- **Postman** or **Insomnia** for API testing
- **DB Browser for SQLite** for database inspection
- **React Developer Tools** browser extension
- **Redux DevTools** browser extension (if using Redux)

## Environment Setup

### 1. Clone and Install Dependencies

```bash
# Clone repository
git clone https://github.com/CannaEngineer/CMMS.git
cd CMMS

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root directory
cd ..
```

### 2. Environment Variables

Create environment files for both backend and frontend:

**Backend `.env`:**
```env
# Database
DATABASE_URL="file:./dev.db"
NODE_ENV="development"
PORT=3000

# Authentication
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="1h"
BCRYPT_ROUNDS=12

# Email Configuration (optional for development)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="CMMS System <noreply@yourcompany.com>"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760" # 10MB in bytes
ALLOWED_EXTENSIONS="jpg,jpeg,png,pdf,doc,docx,xls,xlsx"

# WebSocket
WEBSOCKET_PORT=3001
CORS_ORIGIN="http://localhost:5173"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=3600000 # 1 hour
RATE_LIMIT_MAX=1000 # requests per window

# Logging
LOG_LEVEL="debug"
LOG_FILE="./logs/app.log"

# Feature Flags
ENABLE_WEBSOCKETS=true
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_QR_SYSTEM=true
ENABLE_PUBLIC_PORTALS=true
```

**Frontend `.env`:**
```env
# API Configuration
VITE_API_BASE_URL="http://localhost:3000"
VITE_WEBSOCKET_URL="ws://localhost:3001"

# App Configuration
VITE_APP_NAME="Compass CMMS"
VITE_APP_VERSION="1.0.0"
VITE_APP_ENVIRONMENT="development"

# Feature Flags
VITE_ENABLE_QR_SCANNER=true
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_ANALYTICS=false

# External Services
VITE_GOOGLE_MAPS_API_KEY="your-google-maps-key"
VITE_SENTRY_DSN=""

# Debug Options
VITE_DEBUG_MODE=true
VITE_SHOW_DEV_TOOLS=true
```

### 3. Database Setup

```bash
cd backend

# Initialize database
npx prisma db push --accept-data-loss

# (Optional) Import sample data for development
npx ts-node src/import/importLocations.ts
npx ts-node src/import/importAssets.ts
npx ts-node src/import/importVendors.ts
npx ts-node src/import/importParts.ts
npx ts-node src/import/importWorkOrders.ts

# Assign sample data to admin user
npx ts-node src/tools/assignDataToAdmin.ts

# Create additional test users
npx ts-node create-test-users.js
```

### 4. Start Development Servers

```bash
# Terminal 1: Backend server
cd backend
npm run dev

# Terminal 2: Frontend server
cd frontend
npm run dev

# Optional Terminal 3: Database studio
cd backend
npx prisma studio
```

**Access Points:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Prisma Studio: http://localhost:5555

## Development Workflow

### Branch Strategy

```bash
# Main branches
main        # Production-ready code
develop     # Integration branch

# Feature branches
feature/    # New features
bugfix/     # Bug fixes
hotfix/     # Critical production fixes
release/    # Release preparation
```

### Feature Development Process

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/notification-improvements

# 2. Make changes and commit regularly
git add .
git commit -m "feat(notifications): add bulk delete functionality"

# 3. Keep branch updated
git fetch origin develop
git rebase origin/develop

# 4. Push and create PR
git push origin feature/notification-improvements
# Create Pull Request to develop branch

# 5. After review and merge
git checkout develop
git pull origin develop
git branch -d feature/notification-improvements
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding missing tests
- `chore`: Updating build tasks, package manager configs, etc.

**Examples:**
```bash
feat(auth): add password reset functionality
fix(notifications): resolve duplicate notification bug  
docs(api): update endpoint documentation
refactor(database): optimize asset queries
test(components): add unit tests for AssetForm
chore(deps): update React to v18.2.0
```

## Code Architecture

### Backend Architecture

```
backend/src/
├── api/                    # API layer
│   ├── {domain}/
│   │   ├── {domain}.controller.ts    # Request handling
│   │   ├── {domain}.service.ts       # Business logic
│   │   ├── {domain}.router.ts        # Route definitions
│   │   └── __tests__/                # Unit tests
│   └── ...
├── middleware/             # Express middleware
├── services/              # Shared business services
├── types/                # TypeScript type definitions
├── validation/           # Input validation schemas
├── utils/               # Utility functions
└── index.ts            # Application entry point
```

### Frontend Architecture

```
frontend/src/
├── components/           # Reusable UI components
│   ├── {Feature}/
│   │   ├── index.ts           # Barrel exports
│   │   ├── {Component}.tsx    # Component implementation
│   │   └── __tests__/         # Component tests
│   └── ...
├── pages/               # Application pages/routes
├── hooks/              # Custom React hooks
├── services/           # API client services
├── types/             # TypeScript type definitions
├── utils/            # Utility functions
├── theme/           # MUI theme configuration
└── App.tsx         # Main application component
```

### Domain-Driven Design

Each business domain (Assets, Work Orders, Notifications, etc.) follows this structure:

**Backend Domain Module:**
```typescript
// controller.ts - HTTP request handling
export class AssetController {
  async getAssets(req: Request, res: Response) {
    const assets = await this.assetService.getAssets(req.query);
    res.json({ success: true, data: assets });
  }
}

// service.ts - Business logic
export class AssetService {
  async getAssets(filters: AssetFilters): Promise<Asset[]> {
    return await this.assetRepository.findMany(filters);
  }
}

// router.ts - Route definitions
router.get('/', controller.getAssets);
router.post('/', validate(assetSchema), controller.createAsset);
```

**Frontend Domain Module:**
```typescript
// hooks/useAssets.ts - Data fetching logic
export const useAssets = (filters: AssetFilters) => {
  return useQuery(['assets', filters], () => 
    assetService.getAssets(filters)
  );
};

// services/assetService.ts - API client
export const assetService = {
  getAssets: (filters: AssetFilters) =>
    apiClient.get('/assets', { params: filters }),
  
  createAsset: (data: CreateAssetRequest) =>
    apiClient.post('/assets', data)
};

// components/AssetList.tsx - UI component
export const AssetList = () => {
  const { data: assets, isLoading } = useAssets();
  return <AssetTable assets={assets} loading={isLoading} />;
};
```

## Database Management

### Schema Changes

```bash
# 1. Modify prisma/schema.prisma
# 2. Apply changes to development database
npx prisma db push

# 3. Generate updated Prisma client
npx prisma generate

# 4. Create migration for production
npx prisma migrate dev --name add_notification_preferences

# 5. View database
npx prisma studio
```

### Data Seeding

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create organizations
  const org = await prisma.organization.create({
    data: {
      name: 'Development Company',
      // ...
    }
  });

  // Create users
  await prisma.user.createMany({
    data: [
      {
        email: 'admin@dev.com',
        name: 'Admin User',
        role: 'ADMIN',
        organizationId: org.id
      }
    ]
  });
}

main().catch(console.error);
```

### Database Queries Best Practices

```typescript
// ✅ Good: Use select to limit fields
const assets = await prisma.asset.findMany({
  select: {
    id: true,
    name: true,
    status: true,
    location: { select: { name: true } }
  }
});

// ✅ Good: Use pagination
const assets = await prisma.asset.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
});

// ✅ Good: Use transactions for multiple operations
await prisma.$transaction(async (tx) => {
  const workOrder = await tx.workOrder.create({ data: workOrderData });
  await tx.notification.create({ data: notificationData });
});

// ❌ Bad: N+1 queries
for (const asset of assets) {
  const workOrders = await prisma.workOrder.findMany({
    where: { assetId: asset.id }
  });
}

// ✅ Good: Use include or nested queries
const assets = await prisma.asset.findMany({
  include: { workOrders: true }
});
```

## Testing Strategy

### Test Types

1. **Unit Tests** - Individual functions/components
2. **Integration Tests** - API endpoints with database
3. **E2E Tests** - Complete user workflows
4. **Visual Regression Tests** - UI component snapshots

### Backend Testing

```typescript
// __tests__/asset.controller.test.ts
describe('Asset Controller', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should create asset with valid data', async () => {
    const assetData = {
      name: 'Test Asset',
      locationId: 1
    };

    const response = await request(app)
      .post('/api/assets')
      .send(assetData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(assetData.name);
  });

  it('should validate required fields', async () => {
    const response = await request(app)
      .post('/api/assets')
      .send({}) // Empty data
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('name is required');
  });
});
```

### Frontend Testing

```typescript
// __tests__/AssetForm.test.tsx
describe('AssetForm Component', () => {
  it('should submit form with valid data', async () => {
    const mockOnSubmit = jest.fn();
    render(<AssetForm onSubmit={mockOnSubmit} />);

    // Fill form fields
    fireEvent.change(screen.getByLabelText(/asset name/i), {
      target: { value: 'Test Asset' }
    });

    fireEvent.click(screen.getByText(/submit/i));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Asset'
      });
    });
  });

  it('should display validation errors', async () => {
    render(<AssetForm onSubmit={jest.fn()} />);

    fireEvent.click(screen.getByText(/submit/i));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });
});
```

### E2E Testing with Cypress

```typescript
// cypress/e2e/asset-management.cy.ts
describe('Asset Management', () => {
  beforeEach(() => {
    cy.login('admin@dev.com', 'admin123');
    cy.visit('/assets');
  });

  it('should create new asset', () => {
    cy.get('[data-testid=add-asset-button]').click();
    
    cy.get('#asset-name').type('New Asset');
    cy.get('#asset-location').select('Warehouse');
    
    cy.get('[data-testid=submit-button]').click();
    
    cy.get('[data-testid=success-message]')
      .should('contain', 'Asset created successfully');
  });
});
```

### Running Tests

```bash
# Backend tests
cd backend
npm test                    # Run all tests
npm test -- --watch       # Watch mode
npm test -- --coverage    # With coverage

# Frontend tests  
cd frontend
npm test                   # Run all tests
npm test -- --watch      # Watch mode
npm run test:coverage     # With coverage

# E2E tests
npm run cypress:open      # Interactive mode
npm run cypress:run       # Headless mode
```

## Debugging Guide

### Backend Debugging

```typescript
// Enable debug logging
DEBUG=* npm run dev

// Prisma query logging
DATABASE_LOGGING=true npm run dev

// VS Code launch.json for debugging
{
  "type": "node",
  "request": "launch",
  "name": "Debug Backend",
  "program": "${workspaceFolder}/backend/src/index.ts",
  "env": {
    "NODE_ENV": "development",
    "DEBUG": "*"
  },
  "runtimeArgs": ["-r", "ts-node/register"]
}
```

### Frontend Debugging

```typescript
// React DevTools
import { useEffect } from 'react';

const MyComponent = () => {
  useEffect(() => {
    console.log('Component mounted');
    // Set breakpoint here for debugging
  }, []);

  return <div>Component content</div>;
};

// API debugging with network tab
const debugApiCall = async () => {
  try {
    const response = await fetch('/api/assets');
    console.log('Response:', response);
    const data = await response.json();
    console.log('Data:', data);
  } catch (error) {
    console.error('API Error:', error);
  }
};
```

### Database Debugging

```bash
# View database in browser
npx prisma studio

# Generate and view ERD
npx prisma generate
npx prisma-erd-generator

# Check database integrity
npx prisma db seed --preview-feature
```

## Performance Guidelines

### Backend Performance

```typescript
// ✅ Use database indexes
// In schema.prisma
model Asset {
  name     String
  status   String
  
  @@index([status])
  @@index([name, status])
}

// ✅ Implement pagination
const getAssets = async (page: number, limit: number) => {
  const assets = await prisma.asset.findMany({
    skip: (page - 1) * limit,
    take: Math.min(limit, 100), // Cap at 100
    orderBy: { createdAt: 'desc' }
  });
  
  const total = await prisma.asset.count();
  return { assets, pagination: { page, limit, total } };
};

// ✅ Use caching for expensive operations
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

const getExpensiveData = async (key: string) => {
  let data = cache.get(key);
  if (!data) {
    data = await expensiveOperation();
    cache.set(key, data);
  }
  return data;
};
```

### Frontend Performance

```typescript
// ✅ Use React.memo for expensive components
const AssetCard = React.memo(({ asset }: { asset: Asset }) => {
  return <div>{asset.name}</div>;
});

// ✅ Implement lazy loading
const AssetDetail = lazy(() => import('./pages/AssetDetail'));

// ✅ Use virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

const AssetList = ({ assets }: { assets: Asset[] }) => (
  <List
    height={600}
    itemCount={assets.length}
    itemSize={100}
    itemData={assets}
  >
    {({ index, data }) => <AssetCard asset={data[index]} />}
  </List>
);

// ✅ Optimize API calls with React Query
const useAssets = (filters: AssetFilters) => {
  return useQuery({
    queryKey: ['assets', filters],
    queryFn: () => assetService.getAssets(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

## Security Considerations

### Input Validation

```typescript
// ✅ Backend: Use validation middleware
import { z } from 'zod';

const assetSchema = z.object({
  name: z.string().min(1).max(100),
  status: z.enum(['ONLINE', 'OFFLINE']),
  locationId: z.number().positive()
});

export const validateAsset = (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = assetSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ✅ Frontend: Validate forms
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const AssetForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(assetSchema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
    </form>
  );
};
```

### Authentication & Authorization

```typescript
// ✅ JWT token validation
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as User;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ✅ Role-based access control
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Usage
router.get('/admin', authenticate, authorize(['ADMIN']), adminController.getData);
```

## Best Practices

### Code Style

```typescript
// ✅ Use TypeScript interfaces
interface CreateAssetRequest {
  name: string;
  description?: string;
  locationId: number;
}

interface AssetResponse {
  success: boolean;
  data: Asset;
}

// ✅ Use proper error handling
const createAsset = async (data: CreateAssetRequest): Promise<AssetResponse> => {
  try {
    const asset = await prisma.asset.create({ data });
    return { success: true, data: asset };
  } catch (error) {
    logger.error('Failed to create asset:', error);
    throw new Error('Asset creation failed');
  }
};

// ✅ Use consistent naming
const getUserNotifications = async (userId: number) => { ... };
const createWorkOrder = async (workOrderData: CreateWorkOrderRequest) => { ... };
const updateAssetStatus = async (assetId: number, status: AssetStatus) => { ... };
```

### Component Structure

```typescript
// ✅ Good component structure
interface AssetCardProps {
  asset: Asset;
  onEdit?: (asset: Asset) => void;
  onDelete?: (assetId: number) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  onEdit,
  onDelete
}) => {
  const handleEdit = useCallback(() => {
    onEdit?.(asset);
  }, [asset, onEdit]);

  const handleDelete = useCallback(() => {
    if (confirm('Are you sure?')) {
      onDelete?.(asset.id);
    }
  }, [asset.id, onDelete]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{asset.name}</Typography>
        <Typography color="textSecondary">{asset.status}</Typography>
      </CardContent>
      <CardActions>
        <Button onClick={handleEdit}>Edit</Button>
        <Button onClick={handleDelete} color="error">Delete</Button>
      </CardActions>
    </Card>
  );
};
```

### API Design

```typescript
// ✅ Consistent response format
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ✅ RESTful endpoints
GET    /api/assets              # List assets
POST   /api/assets              # Create asset
GET    /api/assets/:id          # Get specific asset
PUT    /api/assets/:id          # Update asset
DELETE /api/assets/:id          # Delete asset

// ✅ Nested resources
GET    /api/assets/:id/work-orders     # Get work orders for asset
POST   /api/assets/:id/work-orders     # Create work order for asset
```

This development guide provides a comprehensive foundation for working on the Compass CMMS project. For specific implementation details or advanced topics, refer to the source code or contact the development team.