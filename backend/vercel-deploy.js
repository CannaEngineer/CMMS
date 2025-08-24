#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('Starting Vercel deployment build...');

// For Vercel deployment, DATABASE_URL will be automatically set
console.log('Starting Vercel deployment build...');

// Check if we're in production and have a DATABASE_URL
const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

if (isProduction && (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('file:'))) {
  console.warn('⚠️ DATABASE_URL not configured. It will be set by Vercel Postgres integration.');
}

try {
  // Step 1: Build TypeScript
  console.log('Step 1: Building TypeScript...');
  execSync('node deploy-build.js', { stdio: 'inherit', env: process.env });
  
  // Step 2: Generate Prisma Client
  console.log('Step 2: Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit', env: process.env });
  
  // Step 3: Only run migrations if DATABASE_URL is available
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('file:')) {
    console.log('Step 3: Deploying database migrations...');
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env });
    } catch (migrationError) {
      console.log('Migration deployment failed, trying db push instead...');
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', env: process.env });
    }
  } else {
    console.log('Step 3: Skipping database setup (will be configured in Vercel)');
  }
  
  console.log('✅ Vercel deployment build completed successfully!');
} catch (error) {
  console.error('❌ Vercel deployment build failed:', error.message);
  process.exit(1);
}