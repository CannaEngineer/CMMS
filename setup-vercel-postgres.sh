#!/bin/bash

echo "============================================"
echo "CMMS Vercel Postgres Setup Script"
echo "============================================"
echo ""

# Check if user is logged in
echo "Step 1: Checking Vercel login status..."
if ! vercel whoami &>/dev/null; then
    echo "❌ You're not logged in to Vercel"
    echo "👉 Please run: vercel login"
    echo "   Then run this script again"
    exit 1
fi

echo "✅ Logged in as: $(vercel whoami)"
echo ""

# Link project
echo "Step 2: Linking project to Vercel..."
echo "👉 Follow the prompts to link your project"
vercel link

if [ $? -ne 0 ]; then
    echo "❌ Failed to link project"
    exit 1
fi

echo "✅ Project linked successfully"
echo ""

# Create Postgres database
echo "Step 3: Creating Vercel Postgres database..."
echo "👉 This will create a new Postgres database in your Vercel account"
vercel postgres create cmms-db

if [ $? -ne 0 ]; then
    echo "❌ Failed to create database"
    echo "Note: If database already exists, that's okay!"
fi

echo ""

# Pull environment variables
echo "Step 4: Pulling environment variables..."
vercel env pull .env.local

if [ $? -ne 0 ]; then
    echo "⚠️  Failed to pull environment variables"
    echo "You may need to set them manually in Vercel dashboard"
fi

echo ""

# Check if DATABASE_URL is set
if grep -q "POSTGRES_URL" .env.local 2>/dev/null; then
    echo "✅ Database connection strings found in .env.local"
    
    # Update DATABASE_URL to use POSTGRES_URL
    echo "DATABASE_URL=\$POSTGRES_URL" >> .env.local
    echo "✅ DATABASE_URL configured"
else
    echo "⚠️  Database URLs not found in .env.local"
    echo "You'll need to:"
    echo "1. Go to https://vercel.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to Storage tab"
    echo "4. Create a Postgres database"
    echo "5. Copy the connection string"
fi

echo ""
echo "Step 5: Setting up initial database schema..."
echo "👉 Running database migrations..."

# Export DATABASE_URL for Prisma
if [ -f .env.local ]; then
    export $(cat .env.local | grep POSTGRES_URL | xargs)
    export DATABASE_URL=$POSTGRES_URL
fi

cd backend

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully"
else
    echo "⚠️  Failed to create database schema"
    echo "You may need to run 'npx prisma db push' manually after setting DATABASE_URL"
fi

cd ..

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Deploy to Vercel: vercel --prod"
echo "2. Visit your app at the URL provided"
echo ""
echo "To add environment variables:"
echo "  vercel env add DATABASE_URL"
echo ""
echo "To check your deployment:"
echo "  vercel logs"
echo ""