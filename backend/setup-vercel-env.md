# 🔧 Vercel Environment Variables Setup Guide

## ⚠️ CRITICAL: Fixing `db.prisma.io` Connection Errors

If you're seeing errors like:
```
Can't reach database server at db.prisma.io:5432
```

This means your app is trying to use Prisma Data Proxy instead of direct database connection.

## ✅ Required Environment Variables for Vercel

### 1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables

### 2. Set the following variables for ALL environments (Development, Preview, Production):

```bash
# Primary database connection (REQUIRED)
# Use the pooled connection string from Vercel Postgres
DATABASE_URL="${POSTGRES_PRISMA_URL}"

# JWT Secret (REQUIRED - generate a secure random string)
JWT_SECRET="your-secure-random-string-here"

# Frontend URL (REQUIRED)
FRONTEND_URL="https://your-app.vercel.app"  # Update with your actual domain

# Optional: Direct connection for migrations
DIRECT_DATABASE_URL="${POSTGRES_URL}"

# Optional: Email configuration
EMAIL_ENABLED="false"  # Set to true if you have SMTP configured
SMTP_HOST="your-smtp-host"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-email-password"
SMTP_FROM="noreply@example.com"
SMTP_FROM_NAME="CMMS System"
```

### 3. IMPORTANT: Remove/Delete these if they exist:
- ❌ `PRISMA_DATABASE_URL` (unless you're using Data Proxy intentionally)
- ❌ Any variable containing `prisma://` URLs
- ❌ `ACCELERATE_API_KEY` or similar

## 🎯 Quick Fix Checklist

1. **Check Current Environment Variables:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Ensure `DATABASE_URL` is set to `${POSTGRES_PRISMA_URL}` (NOT a `prisma://` URL)
   - Check ALL tabs: Development, Preview, Production

2. **Redeploy After Changes:**
   ```bash
   vercel --prod --force
   ```

3. **Verify No Data Proxy Code:**
   ```bash
   # Run these in your backend directory
   grep -R "prisma://" .
   grep -R "@prisma/client/edge" .
   grep -R "withAccelerate" .
   ```
   All should return no results.

4. **Ensure Clean Client Generation:**
   ```bash
   cd backend
   rm -rf node_modules/.prisma
   rm -rf node_modules/@prisma
   npm install
   npx prisma generate
   ```

## 🔍 Debugging Connection Issues

### Create a debug endpoint to check your configuration:

Add this to `backend/src/api/debug/debug.router.ts`:

```typescript
import { Router } from 'express';
import { prisma } from '../../lib/prisma';

const router = Router();

router.get('/debug/db-info', async (req, res) => {
  try {
    // Test connection
    const userCount = await prisma.user.count();
    
    // Get connection info (safe version)
    const dbUrl = process.env.DATABASE_URL || 'not set';
    const urlType = dbUrl.includes('prisma://') ? 'DATA_PROXY' : 
                    dbUrl.includes('postgres://') ? 'DIRECT' : 
                    dbUrl.includes('postgresql://') ? 'DIRECT' : 'UNKNOWN';
    
    res.json({
      status: 'connected',
      userCount,
      connectionType: urlType,
      runtime: process.env.VERCEL_ENV || 'local',
      nodeVersion: process.version,
      // Don't expose actual URL for security
      dbConfigured: !!process.env.DATABASE_URL,
      isVercel: !!process.env.VERCEL
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      // Check if it's trying to connect to proxy
      isProxyError: error.message.includes('db.prisma.io'),
      hint: error.message.includes('db.prisma.io') 
        ? 'DATABASE_URL is pointing to Prisma Data Proxy. Update to use POSTGRES_PRISMA_URL' 
        : 'Check database configuration'
    });
  }
});

export default router;
```

## 📝 Local Development Setup

For local development, create `.env.local`:

```bash
# Use local SQLite for development
DATABASE_URL="file:./dev.db"

# Or connect to your Vercel database
# DATABASE_URL="postgresql://user:pass@host:5432/dbname"

JWT_SECRET="local-dev-secret"
FRONTEND_URL="http://localhost:5173"
```

## 🚀 Deployment Command

After setting environment variables, redeploy:

```bash
# Force rebuild to ensure new environment variables are used
vercel --prod --force
```

## ✅ Verification

Visit: `https://your-app.vercel.app/api/debug/db-info`

Should return:
```json
{
  "status": "connected",
  "connectionType": "DIRECT",
  "dbConfigured": true,
  "isVercel": true
}
```

If you see `"connectionType": "DATA_PROXY"` or any `db.prisma.io` errors, your DATABASE_URL is still pointing to Prisma Data Proxy.