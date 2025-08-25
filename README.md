# 🔧 Compass CMMS - Computerized Maintenance Management System

<div align="center">

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)]()
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)]()
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)]()

*A modern, mobile-first CMMS with real-time notifications, QR code integration, and comprehensive maintenance management*

[🚀 Quick Start](#-quick-start) • [📖 Documentation](#-documentation) • [🏗️ Architecture](#-architecture) • [🌐 Deployment](#-deployment)

</div>

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Development Guide](#-development-guide)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)

## 🎯 Overview

**Compass CMMS** is a comprehensive maintenance management system designed for modern organizations. Built with TypeScript, React, and Node.js, it provides real-time asset tracking, preventive maintenance scheduling, work order management, and advanced reporting capabilities.

### Key Highlights
- **Mobile-First Design**: Responsive UI optimized for technicians on the go
- **Real-Time Notifications**: WebSocket-powered alerts and updates
- **QR Code Integration**: Quick asset identification and work order creation
- **Public Portals**: Customer-facing maintenance request portals
- **Advanced Import/Export**: Bulk data management with intelligent mapping
- **Role-Based Access**: Admin, Manager, and Technician permission levels
- **Offline Support**: Progressive Web App capabilities for field work

## ✨ Features

### 🔧 Core Functionality
- **Asset Management**: Complete asset lifecycle tracking with maintenance history
- **Work Order System**: Create, assign, track, and complete maintenance tasks
- **Preventive Maintenance**: Automated scheduling based on time/usage triggers
- **Inventory Management**: Parts tracking with reorder points and supplier management
- **Location Management**: Hierarchical location structure with QR code support

### 🚀 Advanced Features
- **Real-Time Dashboard**: Live metrics, charts, and KPI tracking
- **Smart Notifications**: Contextual alerts with customizable preferences
- **Export Center**: Advanced reporting with multiple format support
- **Public Portals**: Branded customer portals for maintenance requests
- **Mobile QR Scanner**: Quick asset identification and work order creation
- **Bulk Import/Export**: CSV-based data management with intelligent field mapping

### 👥 User Roles
- **Technicians**: Mobile-optimized interface for field work
- **Managers**: Comprehensive oversight and reporting tools  
- **Admins**: Full system configuration and user management

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Git** for version control
- **VS Code** (recommended) with TypeScript and Prisma extensions

### 1️⃣ Clone & Install
```bash
# Clone the repository
git clone https://github.com/CannaEngineer/CMMS.git
cd CMMS

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

### 2️⃣ Database Setup
```bash
cd backend

# Initialize database with schema
npx prisma db push --accept-data-loss

# Import sample data (optional)
npx ts-node src/import/importLocations.ts
npx ts-node src/import/importAssets.ts
npx ts-node src/import/importVendors.ts
npx ts-node src/import/importParts.ts
npx ts-node src/import/importWorkOrders.ts

# Assign sample data to admin user
npx ts-node src/tools/assignDataToAdmin.ts
```

### 3️⃣ Start Development Servers
```bash
# Terminal 1: Start backend (from backend directory)
npm run dev
# Backend runs on http://localhost:3000

# Terminal 2: Start frontend (from frontend directory)  
npm run dev
# Frontend runs on http://localhost:5173
```

### 4️⃣ Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api-docs (if Swagger is configured)

### Default Login Credentials
```
Email: admin@example.com
Password: admin123
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js with middleware
- **Database**: SQLite (dev) / PostgreSQL (production)
- **ORM**: Prisma with type-safe queries
- **Authentication**: JWT tokens with bcrypt
- **Real-time**: Socket.IO for WebSocket connections
- **File Uploads**: Multer with cloud storage support
- **Email**: Nodemailer with template support

### Frontend  
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development
- **UI Library**: Material-UI (MUI) with custom theming
- **State Management**: React Query + Context API
- **Routing**: React Router with lazy loading
- **Forms**: React Hook Form with validation
- **Charts**: Recharts for data visualization
- **Offline**: Service workers for PWA functionality

### Development Tools
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier for consistent code style
- **Testing**: Jest + React Testing Library + Cypress
- **Type Checking**: TypeScript in strict mode
- **Git Hooks**: Husky for pre-commit validation

## 📁 Project Structure

```
CMMS/
├── 📁 backend/                 # Node.js backend application
│   ├── 📁 src/
│   │   ├── 📁 api/            # REST API endpoints
│   │   │   ├── 📁 asset/      # Asset management
│   │   │   ├── 📁 auth/       # Authentication & authorization  
│   │   │   ├── 📁 notification/ # Notification system
│   │   │   ├── 📁 work-order/ # Work order management
│   │   │   └── 📁 ...         # Other domain modules
│   │   ├── 📁 middleware/     # Express middleware
│   │   ├── 📁 services/       # Business logic services
│   │   ├── 📁 types/          # TypeScript type definitions
│   │   └── 📄 index.ts        # Application entry point
│   ├── 📁 prisma/             # Database schema & migrations
│   └── 📄 package.json
│
├── 📁 frontend/               # React frontend application
│   ├── 📁 src/
│   │   ├── 📁 components/     # Reusable UI components
│   │   │   ├── 📁 Forms/      # Form components
│   │   │   ├── 📁 Layout/     # Layout components
│   │   │   ├── 📁 Notifications/ # Notification UI
│   │   │   └── 📁 ...         # Other component categories
│   │   ├── 📁 pages/          # Application pages/routes
│   │   ├── 📁 services/       # API client services
│   │   ├── 📁 hooks/          # Custom React hooks
│   │   ├── 📁 types/          # TypeScript type definitions
│   │   └── 📄 App.tsx         # Main application component
│   └── 📄 package.json
│
├── 📁 docs/                   # Documentation files
│   ├── 📄 API_DOCUMENTATION.md
│   ├── 📄 DEPLOYMENT_GUIDE.md
│   └── 📄 DESIGN_DOC.md
│
└── 📄 README.md              # This file
```

## 💻 Development Guide

### Environment Setup
Create `.env` files for local development:

**Backend (.env):**
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-jwt-secret-key"
NODE_ENV="development"
PORT=3000

# Email configuration (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# File upload configuration
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10MB"
```

**Frontend (.env):**
```env
VITE_API_BASE_URL="http://localhost:3000"
VITE_WEBSOCKET_URL="ws://localhost:3000"
VITE_APP_NAME="Compass CMMS"
```

### Development Workflow

#### 1. Code Style & Standards
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Automated linting with TypeScript rules  
- **Prettier**: Code formatting on save
- **Conventional Commits**: Structured commit messages

#### 2. Git Workflow
```bash
# Create feature branch
git checkout -b feature/notification-system

# Make changes and commit
git add .
git commit -m "feat: add notification clear/acknowledge functionality"

# Push and create PR
git push origin feature/notification-system
```

#### 3. Database Changes
```bash
# Modify schema in prisma/schema.prisma
# Then apply changes
npx prisma db push

# Generate updated client
npx prisma generate

# View database (optional)
npx prisma studio
```

### Common Development Tasks

#### Adding a New API Endpoint
```bash
# 1. Create controller, service, and router files
mkdir -p src/api/new-feature
touch src/api/new-feature/{controller,service,router}.ts

# 2. Register the router in src/index.ts
# 3. Add database models if needed in prisma/schema.prisma
# 4. Run database migration
npx prisma db push
```

#### Creating a New React Component  
```bash
# 1. Create component directory
mkdir -p src/components/NewFeature

# 2. Create component files
touch src/components/NewFeature/{index.ts,NewFeature.tsx}

# 3. Export from components/index.ts
# 4. Add tests in __tests__ directory
```

#### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests  
cd frontend
npm test

# E2E tests
npm run cypress:open
```

## 📖 API Documentation

### Core Endpoints

#### Authentication
```typescript
POST /api/auth/login
POST /api/auth/register  
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/verify-email
```

#### Assets
```typescript
GET    /api/assets              # List all assets
POST   /api/assets              # Create new asset
GET    /api/assets/:id          # Get asset details
PUT    /api/assets/:id          # Update asset
DELETE /api/assets/:id          # Delete asset
POST   /api/assets/import       # Bulk import assets
```

#### Work Orders
```typescript
GET    /api/work-orders         # List work orders
POST   /api/work-orders         # Create work order
GET    /api/work-orders/:id     # Get work order details
PUT    /api/work-orders/:id     # Update work order
DELETE /api/work-orders/:id     # Delete work order
POST   /api/work-orders/:id/complete # Mark as complete
```

#### Notifications
```typescript  
GET    /api/notifications       # Get user notifications
PUT    /api/notifications/:id/read # Mark as read
DELETE /api/notifications/:id   # Delete notification
PUT    /api/notifications/all/read # Mark all as read
DELETE /api/notifications/all/clear # Clear all notifications
```

### Response Format
```typescript
// Success Response
{
  success: true,
  data: T,
  message?: string
}

// Error Response  
{
  success: false,
  error: string,
  details?: any
}
```

For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## 🧪 Testing

### Test Structure
```
├── 📁 backend/
│   ├── 📁 src/
│   │   └── 📁 __tests__/      # Unit & integration tests
│   └── 📁 jest.config.js
│
├── 📁 frontend/
│   ├── 📁 src/
│   │   └── 📁 __tests__/      # Component & utility tests
│   └── 📁 cypress/            # E2E tests
│       ├── 📁 e2e/
│       ├── 📁 fixtures/
│       └── 📁 support/
```

### Running Tests
```bash
# Backend unit tests
cd backend && npm test

# Frontend unit tests
cd frontend && npm test

# E2E tests (requires both servers running)
cd frontend && npm run cypress:open

# Test coverage
npm run test:coverage
```

### Writing Tests

**Backend Test Example:**
```typescript
// src/api/auth/__tests__/auth.test.ts
describe('Auth Controller', () => {
  it('should login user with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });
});
```

**Frontend Test Example:**
```typescript  
// src/components/__tests__/AssetForm.test.tsx
describe('AssetForm Component', () => {
  it('should submit form with valid data', async () => {
    render(<AssetForm onSubmit={mockSubmit} />);
    
    fireEvent.change(screen.getByLabelText('Asset Name'), {
      target: { value: 'Test Asset' }
    });
    
    fireEvent.click(screen.getByText('Submit'));
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'Test Asset'
      });
    });
  });
});
```

## 🌐 Deployment

### Development Deployment
```bash
# Build applications
cd backend && npm run build
cd frontend && npm run build

# Start production servers
cd backend && npm start
```

### Production Deployment Options

#### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from root directory
vercel

# Set environment variables via Vercel dashboard
```

#### Option 2: Docker
```dockerfile
# Dockerfile example (create in root)
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD ["npm", "start"]
```

#### Option 3: Traditional VPS
```bash
# Install PM2 for process management
npm install -g pm2

# Start applications
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Environment Variables (Production)
```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/cmms"

# Authentication
JWT_SECRET="strong-production-secret"

# File Storage
STORAGE_PROVIDER="s3" # or "vercel-blob"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_REGION="us-east-1"
AWS_BUCKET_NAME="cmms-uploads"

# Email
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"

# Monitoring (optional)
SENTRY_DSN="your-sentry-dsn"
```

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

## 🤝 Contributing

### Development Process
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes following the style guide
4. **Write** tests for new functionality
5. **Ensure** all tests pass: `npm test`
6. **Commit** with conventional commit format: `git commit -m "feat: add amazing feature"`
7. **Push** to your branch: `git push origin feature/amazing-feature`
8. **Submit** a Pull Request

### Code Style Guide
- Use **TypeScript** with strict mode
- Follow **functional programming** patterns where possible
- Write **comprehensive tests** for new features
- Use **meaningful variable names** and add comments for complex logic
- Follow **REST API conventions** for backend endpoints
- Use **React best practices** for frontend components

### Commit Message Format
```
type(scope): description

Examples:
feat(auth): add password reset functionality
fix(notifications): resolve duplicate notification bug
docs(api): update endpoint documentation
test(components): add tests for AssetForm component
```

## 🔍 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Reset database
npx prisma db push --accept-data-loss

# Check database URL
echo $DATABASE_URL

# View database in browser
npx prisma studio
```

#### Build Errors
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npx tsc --noEmit
```

#### Import/Export Issues
```bash
# Check CSV file format
# Ensure headers match expected field names
# See sample files in CSV/ directory
```

#### Authentication Issues
```bash
# Clear browser storage
localStorage.clear()

# Check JWT secret configuration
# Verify user exists in database
```

#### Performance Issues
```bash
# Enable React DevTools profiler
# Check database query performance with Prisma logging
# Monitor network requests in browser DevTools
```

### Getting Help
- **Issues**: [GitHub Issues](https://github.com/CannaEngineer/CMMS/issues)
- **Discussions**: [GitHub Discussions](https://github.com/CannaEngineer/CMMS/discussions)
- **Documentation**: Check the `/docs` directory for detailed guides

### Debugging Tips
```bash
# Backend debugging
DEBUG=* npm run dev

# Database debugging  
DATABASE_LOGGING=true npm run dev

# Frontend debugging
VITE_DEBUG=true npm run dev
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://react.dev/), [Node.js](https://nodejs.org/), and [Prisma](https://prisma.io/)
- UI components powered by [Material-UI](https://mui.com/)
- Icons by [Material Icons](https://fonts.google.com/icons)

---

<div align="center">

**Happy Coding!** 🚀

*If you find this project helpful, please consider giving it a ⭐*

</div>