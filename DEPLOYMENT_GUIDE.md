# 🚀 CMMS Vercel Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying your CMMS application to Vercel, including both frontend and backend components with optimized configuration for production.

## 📋 Pre-Deployment Checklist

### ✅ **Issues Fixed:**
- **API Import Error**: Fixed `workOrderService` → `workOrdersService` naming inconsistency
- **Environment Configuration**: Created production-ready environment files
- **Build Optimization**: Configured Vite for production deployment
- **Bundle Splitting**: Optimized chunk splitting for better caching

## 🔧 Configuration Files Created

### **1. Vercel Configuration** (`vercel.json`)
```json
{
  "version": 2,
  "name": "cmms-app",
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/node"
    },
    {
      "src": "backend/package.json", 
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/src/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/dist/$1"
    }
  ]
}
```

### **2. Environment Files**
- **`.env.example`**: Template for environment variables
- **`.env.production`**: Production-specific configuration
- **Frontend Environment Variables**:
  - `VITE_API_URL`: API endpoint URL
  - `VITE_APP_NAME`: Application name
  - `VITE_ENABLE_PWA`: Progressive Web App features
  - `VITE_MOCK_API`: Toggle for mock data

### **3. Optimized Vite Configuration**
- **Bundle Splitting**: Separate chunks for vendor, MUI, charts
- **Path Aliases**: Clean import paths (@components, @services, etc.)
- **Production Optimization**: Minification, tree shaking
- **Performance**: Chunk size warnings and optimization

## 🚀 Deployment Steps

### **Step 1: Repository Setup**

1. **Ensure your code is in a Git repository**:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Project Structure** should look like:
   ```
   CMMS/
   ├── frontend/           # React Vite app
   │   ├── src/
   │   ├── package.json
   │   ├── vite.config.ts
   │   └── .env.production
   ├── backend/            # Node.js API
   │   ├── src/
   │   └── package.json
   ├── vercel.json         # Vercel configuration
   └── DEPLOYMENT_GUIDE.md
   ```

### **Step 2: Vercel Account Setup**

1. **Create Vercel Account**: Go to [vercel.com](https://vercel.com) and sign up
2. **Connect GitHub**: Link your GitHub account to Vercel
3. **Import Project**: Click "New Project" and import your CMMS repository

### **Step 3: Project Configuration**

1. **Framework Detection**: Vercel should auto-detect it as a monorepo
2. **Root Directory**: Set to `/` (project root)
3. **Build Command**: `cd frontend && npm run vercel-build`
4. **Output Directory**: `frontend/dist`
5. **Install Command**: `npm install` (in both frontend and backend)

### **Step 4: Environment Variables**

In Vercel dashboard, add these environment variables:

#### **Production Environment Variables:**
```bash
NODE_ENV=production
VITE_API_URL=https://your-app-name.vercel.app/api
VITE_APP_NAME=CMMS
VITE_APP_VERSION=1.0.0
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=false
VITE_DEV_MODE=false
VITE_MOCK_API=false
```

#### **Backend Environment Variables:**
```bash
DATABASE_URL=your-database-url
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=https://your-app-name.vercel.app
```

### **Step 5: Deploy**

1. **Click "Deploy"** - Vercel will:
   - Clone your repository
   - Install dependencies
   - Build frontend and backend
   - Deploy to global CDN

2. **Monitor Build Process**:
   - Watch the build logs for any errors
   - Verify both frontend and backend build successfully

3. **Test Deployment**:
   - Visit your deployed URL
   - Test all major functionality
   - Check mobile responsiveness
   - Verify API endpoints work

## 🔧 Advanced Configuration

### **Custom Domains**

1. **Add Domain** in Vercel settings:
   ```
   Production: your-domain.com
   Staging: staging.your-domain.com
   ```

2. **Update Environment Variables** to match your domain:
   ```bash
   VITE_API_URL=https://your-domain.com/api
   CORS_ORIGIN=https://your-domain.com
   ```

### **Database Setup**

For production, you'll need a hosted database:

#### **Option 1: Vercel Postgres**
```bash
# Install Vercel Postgres
npm install @vercel/postgres

# Add to environment variables
DATABASE_URL=postgres://...
```

#### **Option 2: PlanetScale/Supabase**
```bash
# Update your DATABASE_URL
DATABASE_URL=mysql://... # or postgresql://...
```

#### **Option 3: Railway/Render**
- Set up external database service
- Update DATABASE_URL in Vercel environment variables

### **Performance Optimization**

#### **1. Edge Functions** (Optional)
```typescript
// pages/api/health.ts
export const config = {
  runtime: 'edge',
}

export default function handler() {
  return new Response('OK', { status: 200 })
}
```

#### **2. CDN Caching**
```json
// vercel.json - Add headers
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

#### **3. Bundle Analysis**
```bash
# Analyze bundle size locally
npm run build:analyze

# Check for optimization opportunities
npx webpack-bundle-analyzer frontend/dist
```

## 🚨 Troubleshooting

### **Common Issues & Solutions**

#### **1. Build Failures**
```bash
# Issue: TypeScript errors
# Solution: Run type check locally
npm run type-check

# Issue: Missing dependencies
# Solution: Ensure all deps are in package.json
npm install --save-dev @types/node
```

#### **2. API Connection Issues**
```bash
# Issue: API calls failing
# Check: VITE_API_URL is correct
# Check: CORS settings in backend
# Check: API routes in vercel.json
```

#### **3. Environment Variable Issues**
```bash
# Issue: Variables not loading
# Solution: Prefix with VITE_ for frontend
# Solution: Redeploy after env var changes
```

#### **4. Mobile Performance Issues**
```bash
# Issue: Slow loading on mobile
# Solution: Check bundle sizes
npm run build:analyze

# Solution: Optimize images and assets
# Solution: Implement service worker caching
```

## 📊 Monitoring & Analytics

### **1. Vercel Analytics**
```javascript
// Add to your app
import { Analytics } from '@vercel/analytics/react'

function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  )
}
```

### **2. Performance Monitoring**
```bash
# Add Web Vitals tracking
npm install web-vitals

# Monitor Core Web Vitals
npm install @vercel/speed-insights
```

### **3. Error Tracking**
```bash
# Optional: Add Sentry for error tracking
npm install @sentry/react @sentry/tracing
```

## 🔄 Continuous Deployment

### **1. Automatic Deployments**
- **Push to main**: Deploys to production
- **Push to develop**: Deploys to preview (optional)
- **Pull Requests**: Creates preview deployments

### **2. Branch Configuration**
```json
// vercel.json - Add branch config
{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "develop": false
    }
  }
}
```

### **3. Build Hooks**
```bash
# Add pre-build checks
"scripts": {
  "prebuild": "npm run lint && npm run type-check",
  "build": "tsc -b && vite build"
}
```

## 📱 PWA Configuration (Optional)

### **1. Service Worker**
```bash
# Add PWA support
npm install vite-plugin-pwa

# Update vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'
```

### **2. Manifest Configuration**
```json
// public/manifest.json
{
  "name": "CMMS - Maintenance Management",
  "short_name": "CMMS",
  "description": "Industrial Maintenance Management System",
  "theme_color": "#1565C0",
  "background_color": "#F5F7FA",
  "display": "standalone",
  "start_url": "/",
  "icons": [...]
}
```

## ✅ Post-Deployment Checklist

### **1. Functionality Tests**
- [ ] Dashboard loads correctly
- [ ] Work orders can be created/updated
- [ ] Mobile swipe actions work
- [ ] Location hierarchy displays
- [ ] Charts and reports render
- [ ] Offline mode functions (if enabled)

### **2. Performance Tests**
- [ ] Page load speed < 3s on 3G
- [ ] First Contentful Paint < 1.5s
- [ ] No console errors
- [ ] Mobile responsive design works
- [ ] Touch targets are 48px+

### **3. Security Tests**
- [ ] API endpoints secured
- [ ] CORS configured correctly
- [ ] Environment variables protected
- [ ] No sensitive data in client bundle

## 🎯 Success Metrics

### **Expected Performance:**
- **Lighthouse Score**: 90+ for Performance, Accessibility, Best Practices
- **Bundle Size**: < 1MB initial load
- **Time to Interactive**: < 3s on 3G
- **Core Web Vitals**: Green scores

### **User Experience:**
- **Mobile-First**: Perfect experience on phones/tablets
- **Touch Interactions**: Smooth swipe gestures
- **Offline Support**: Basic functionality without network
- **Industrial Focus**: Optimized for maintenance workers

## 🚀 Go Live!

Once everything is configured and tested:

1. **Final Build**: `npm run build:prod`
2. **Deploy**: Push to main branch
3. **Monitor**: Watch Vercel deployment logs
4. **Test**: Verify production functionality
5. **Announce**: Your CMMS is live! 🎉

Your mobile-first CMMS application is now deployed and ready for maintenance teams to use across all devices with excellent performance and user experience.

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review browser console for errors
3. Verify environment variables are set
4. Test locally with production build
5. Check the troubleshooting section above

Happy deploying! 🚀