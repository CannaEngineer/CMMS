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
  
  // Step 3: Skip database operations during build - handle separately in production
  console.log('Step 3: Skipping database migrations during build (will be handled at runtime)');
  
  console.log('✅ Vercel deployment build completed successfully!');
} catch (error) {
  console.error('❌ Vercel deployment build failed:', error.message);
  process.exit(1);
}