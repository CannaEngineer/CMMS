# CMMS Vercel Deployment Guide

## Overview
This guide will help you deploy the CMMS application to Vercel with:
- Frontend (React + Vite) deployed as static site
- Backend (Node.js + Express) deployed as serverless functions
- PostgreSQL database (Vercel Postgres or external provider)

## Step 1: Database Setup

### Option A: Vercel Postgres (Recommended)
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Link project: `vercel link`
4. Add Postgres: `vercel storage create postgres`

### Option B: External PostgreSQL (Supabase, PlanetScale, etc.)
1. Create PostgreSQL database on your preferred provider
2. Get connection string
3. Add to environment variables

## Step 2: Backend Configuration

### 2.1 Add Production Scripts
Add to `backend/package.json`:
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "vercel-build": "npm run build && npx prisma generate && npx prisma db push"
  }
}
```

### 2.2 Create API Directory Structure
Vercel requires API routes in `/api` directory. We'll create wrapper functions.

### 2.3 Environment Variables
Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `NODE_ENV=production`
- `FRONTEND_URL` - Frontend URL for CORS

## Step 3: Frontend Configuration

### 3.1 Environment Variables
Create `.env.production` in frontend:
```
VITE_API_URL=https://your-app.vercel.app/api
```

### 3.2 Build Configuration
Update `frontend/vite.config.ts` for production builds.

## Step 4: Vercel Configuration

### 4.1 Project Structure
```
cmms-app/
├── api/                    # Vercel serverless functions
│   └── [...path].js       # Catch-all API route
├── backend/               # Original backend code
├── frontend/              # React frontend
└── vercel.json           # Vercel configuration
```

### 4.2 Updated vercel.json
Replace existing vercel.json with optimized configuration.

## Step 5: Deployment Steps

1. **Prepare Database**
   ```bash
   # Set up database URL
   export DATABASE_URL="your-postgres-url"
   
   # Run migrations
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```

2. **Build and Test Locally**
   ```bash
   # Build frontend
   cd frontend
   npm run build
   
   # Build backend
   cd ../backend
   npm run build
   ```

3. **Deploy to Vercel**
   ```bash
   # From root directory
   vercel --prod
   ```

## Step 6: Post-Deployment Setup

1. **Set Environment Variables in Vercel Dashboard**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all required environment variables

2. **Run Database Migrations**
   ```bash
   # If using Vercel Postgres
   vercel env pull .env.local
   cd backend
   npx prisma migrate deploy
   ```

3. **Test Application**
   - Frontend should load at your Vercel URL
   - API endpoints should work at `/api/*`
   - Database connections should be functional

## Troubleshooting

### Common Issues:
1. **Database Connection Errors**
   - Verify DATABASE_URL is correct
   - Check if database allows connections from Vercel IPs

2. **API Not Found**
   - Verify API routes are in `/api` directory
   - Check vercel.json configuration

3. **Build Failures**
   - Check TypeScript compilation
   - Verify all dependencies are in package.json

4. **CORS Issues**
   - Update FRONTEND_URL environment variable
   - Check CORS configuration in backend

## Environment Variables Checklist

### Backend:
- [ ] `DATABASE_URL`
- [ ] `JWT_SECRET`
- [ ] `NODE_ENV=production`
- [ ] `FRONTEND_URL`

### Frontend:
- [ ] `VITE_API_URL`

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files
   - Use Vercel environment variables for secrets

2. **Database Security**
   - Use connection pooling
   - Enable SSL connections
   - Restrict database access

3. **API Security**
   - Enable CORS properly
   - Use rate limiting
   - Validate all inputs

## Performance Optimization

1. **Frontend**
   - Enable static generation where possible
   - Optimize bundle size
   - Use CDN for assets

2. **Backend**
   - Use connection pooling
   - Enable caching
   - Optimize database queries

3. **Database**
   - Add proper indexes
   - Use connection pooling
   - Monitor query performance