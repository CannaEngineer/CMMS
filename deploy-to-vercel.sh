#!/bin/bash

# CMMS Vercel Deployment Script
# This script helps you deploy the CMMS application to Vercel

set -e

echo "🚀 CMMS Vercel Deployment Setup"
echo "================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel..."
    vercel login
fi

echo "✅ Prerequisites check complete"

# Build and test locally first
echo ""
echo "🔧 Building project locally for testing..."

# Build backend
echo "Building backend..."
cd backend
npm install
npm run build
cd ..

# Build frontend  
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "✅ Local build successful"

# Environment variables checklist
echo ""
echo "📋 Environment Variables Checklist"
echo "Please ensure these are set in your Vercel project settings:"
echo ""
echo "Backend Environment Variables:"
echo "- DATABASE_URL (PostgreSQL connection string)"
echo "- JWT_SECRET (random string for JWT signing)"
echo "- NODE_ENV=production"
echo "- FRONTEND_URL (will be your Vercel app URL)"
echo ""
echo "Frontend Environment Variables:"
echo "- VITE_API_URL (will be your Vercel app URL + /api)"
echo ""

# Database setup
echo "💾 Database Setup"
echo "=================="
echo "You need a PostgreSQL database for production."
echo "Recommended options:"
echo "1. Vercel Postgres (run: vercel storage create postgres)"
echo "2. Supabase (https://supabase.com)"
echo "3. PlanetScale (https://planetscale.com)"
echo "4. Railway (https://railway.app)"
echo ""

read -p "Have you set up your PostgreSQL database? (y/n): " db_ready
if [ "$db_ready" != "y" ]; then
    echo "⚠️  Please set up your database first, then run this script again."
    exit 1
fi

read -p "Enter your DATABASE_URL: " database_url
if [ -z "$database_url" ]; then
    echo "❌ DATABASE_URL is required"
    exit 1
fi

# Run database migrations
echo ""
echo "🗄️  Running database migrations..."
cd backend
export DATABASE_URL="$database_url"
npx prisma migrate deploy
npx prisma generate
cd ..

echo "✅ Database setup complete"

# Deploy to Vercel
echo ""
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "🎉 Deployment initiated!"
echo ""
echo "Next steps:"
echo "1. Go to your Vercel dashboard"
echo "2. Set the environment variables listed above"
echo "3. Update VITE_API_URL to your actual Vercel URL"
echo "4. Redeploy if needed"
echo ""
echo "Your CMMS application should be live shortly!"