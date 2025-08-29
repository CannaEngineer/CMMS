# Turso Database Migration Guide

## ✅ Completed Setup

1. **Installed Turso CLI** - The Turso CLI is now installed at `~/.turso`
2. **Updated Prisma Schema** - Changed from PostgreSQL to SQLite provider
3. **Installed Required Packages** - Added `@libsql/client` and `@prisma/adapter-libsql`
4. **Created Adaptive Prisma Client** - The Prisma client now automatically uses Turso when `LIBSQL_URL` is set
5. **Generated Migration SQL** - Created `prisma/turso-init.sql` with the complete schema
6. **Created Migration Script** - `scripts/migrate-to-turso.ts` handles data migration

## 🚀 Steps You Need to Complete

### 1. Authenticate with Turso

```bash
# If you don't have a Turso account, sign up:
export PATH=$PATH:/home/daniel-crawford/.turso
turso auth signup

# Or if you already have an account:
turso auth login
```

### 2. Create Your Turso Database

```bash
# Create a new database
turso db create cmms-db

# Get the database URL (save this!)
turso db show cmms-db

# Create an auth token (save this!)
turso db tokens create cmms-db
```

### 3. Update Environment Variables

Create a `.env.turso` file (or update your `.env`):

```env
# Keep this for Prisma CLI
DATABASE_URL="file:./prisma/dev.db"

# Add these for Turso (use your actual values from step 2)
LIBSQL_URL="libsql://cmms-db-YOUR-ORG.turso.io"
LIBSQL_AUTH_TOKEN="your-token-here"
```

### 4. Apply Schema to Turso

```bash
# Apply the schema to your Turso database
turso db shell cmms-db < prisma/turso-init.sql
```

### 5. Migrate Your Data

```bash
# Load your Turso environment variables
source .env.turso  # or export them manually

# Run the migration script
npx ts-node scripts/migrate-to-turso.ts
```

### 6. Test the Connection

```bash
# Test with Turso environment variables
LIBSQL_URL="your-url" LIBSQL_AUTH_TOKEN="your-token" npm run dev
```

### 7. Deploy to Production

For Vercel deployment, add these environment variables:
- `DATABASE_URL` - Keep as `file:./prisma/dev.db` for build process
- `LIBSQL_URL` - Your Turso database URL
- `LIBSQL_AUTH_TOKEN` - Your Turso auth token

## 🔄 How It Works

1. **Development**: Can still use local SQLite file (`prisma/dev.db`)
2. **Production**: Automatically uses Turso when `LIBSQL_URL` is set
3. **Fallback**: If `LIBSQL_URL` is not set, falls back to local SQLite

## 📝 Key Files

- `src/lib/prisma.ts` - Adaptive Prisma client that switches between local and Turso
- `prisma/turso-init.sql` - Complete schema for Turso database
- `scripts/migrate-to-turso.ts` - Data migration script
- `.env.turso.example` - Example environment configuration

## 🛠 Troubleshooting

### If schema application fails:
```bash
# Check if tables already exist
turso db shell cmms-db
.tables
.exit
```

### If data migration fails:
- Check that foreign keys are properly handled
- Verify all environment variables are set
- Review error messages for specific table issues

### To rollback:
1. Remove `LIBSQL_URL` from environment
2. App will automatically use local SQLite file
3. Your backup is at `prisma/backup-*.db`

## 🎯 Benefits of Turso

1. **Global Edge Deployment** - Low latency worldwide
2. **Automatic Backups** - Built-in disaster recovery
3. **Scale to Zero** - Pay only for what you use
4. **SQLite Compatible** - No major code changes needed
5. **HTTP-based** - Works perfectly with edge functions

## 📊 Cost Estimation

- **Free Tier**: 8 GB storage, 1 billion row reads/month
- **Your Current DB**: ~860KB
- **Estimated Monthly Cost**: $0 (well within free tier)

## 🔒 Security Notes

- Never commit `.env` files with real tokens
- Rotate tokens periodically using `turso db tokens create`
- Use different tokens for dev/staging/production
- Enable Turso's built-in encryption at rest

## 📞 Next Steps After Migration

1. Set up automated backups:
   ```bash
   # Daily backup (add to cron)
   turso db dump cmms-db > backups/$(date +%F).sql
   ```

2. Monitor usage:
   ```bash
   turso db inspect cmms-db
   ```

3. Set up read replicas if needed:
   ```bash
   turso db replicate cmms-db --region sin  # Singapore
   turso db replicate cmms-db --region syd  # Sydney
   ```