# Vercel Deployment Guide

## ✅ Ready for Deployment

Your CMMS backend is ready to deploy to Vercel! The build process has been tested and works without errors.

## 🚀 Deployment Steps

### 1. Environment Variables Setup

Add these environment variables in your Vercel project dashboard:

```bash
# Database
DATABASE_URL="file:./prisma/dev.db"

# Turso Database (Optional - for future use)
LIBSQL_URL="libsql://cmms-db-cannaengineer.aws-us-east-2.turso.io"
LIBSQL_AUTH_TOKEN="your-turso-auth-token"

# Frontend URL
FRONTEND_URL="https://your-frontend-domain.vercel.app"

# Security
IP_HASH_SALT="your-production-salt"
JWT_SECRET="your-production-jwt-secret"

# Email Configuration
SMTP_HOST="heracles.mxrouting.net"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="cmms@elevatedcompliance.tech"
SMTP_PASS="your-smtp-password"
SMTP_FROM="cmms@elevatedcompliance.tech"
SMTP_FROM_NAME="Elevated Compliance CMMS"
EMAIL_ENABLED="true"
EMAIL_QUEUE_ENABLED="false"

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="your-production-blob-token"
```

### 2. Vercel Configuration

Your `vercel.json` should already be configured properly:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/src/index.ts"
    }
  ],
  "functions": {
    "src/index.ts": {
      "maxDuration": 30
    }
  }
}
```

### 3. Deploy Command

```bash
# From your project root
vercel --prod
```

Or connect your GitHub repository for automatic deployments.

## 🔄 Database Strategy

### Current Setup (SQLite)
- Uses local SQLite file during build
- Works perfectly for Vercel Edge Functions
- Database resets on each deployment (stateless)

### Future Turso Integration
When the Prisma adapter is stable, you can:
1. Enable Turso in production by setting `LIBSQL_URL`
2. Keep local SQLite for development
3. Enjoy persistent, globally distributed database

## 📁 Project Structure for Vercel

```
backend/
├── src/
│   └── index.ts          # Main entry point
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── dev.db           # SQLite database
├── package.json         # Dependencies
├── vercel.json          # Vercel configuration
└── tsconfig.json        # TypeScript config
```

## 🚦 Health Check

After deployment, test these endpoints:

- `GET /api/health` - Server health check
- `GET /api/auth/test` - Authentication test
- `GET /api/users` - Database connectivity test

## 🔧 Build Process

The build process includes:
1. TypeScript compilation (`tsc`)
2. Prisma client generation
3. Dependency bundling for Vercel

## ⚡ Performance Notes

- SQLite provides excellent performance for Edge Functions
- No cold start database connection issues
- Fast query execution
- Automatic scaling with Vercel

## 🐛 Troubleshooting

### Build Fails
```bash
# Test build locally first
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

### Database Issues
```bash
# Regenerate Prisma client
npx prisma generate

# Check schema validity
npx prisma validate
```

### Environment Variable Issues
- Ensure all required variables are set in Vercel dashboard
- Check variable names match exactly (case-sensitive)
- Verify no trailing spaces in values

## 🔄 Future Turso Migration

When you're ready to use Turso in production:

1. Set `LIBSQL_URL` and `LIBSQL_AUTH_TOKEN` in Vercel
2. Your data is already in Turso from the migration
3. Update Prisma configuration to use the adapter
4. Deploy with persistent database

## 📊 Monitoring

After deployment, monitor:
- Function execution time
- Error rates
- Database query performance
- Memory usage

Your backend is now ready for production deployment! 🎉