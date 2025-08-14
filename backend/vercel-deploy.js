#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('Starting Vercel deployment build...');

// Set DATABASE_URL environment variable for all child processes
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';
console.log('DATABASE_URL set to:', process.env.DATABASE_URL);

try {
  // Step 1: Build TypeScript
  console.log('Step 1: Building TypeScript...');
  execSync('node deploy-build.js', { stdio: 'inherit', env: process.env });
  
  // Step 2: Generate Prisma Client
  console.log('Step 2: Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit', env: process.env });
  
  // Step 3: Push database schema (for production this would be different)
  console.log('Step 3: Pushing database schema...');
  execSync('npx prisma db push', { stdio: 'inherit', env: process.env });
  
  console.log('✅ Vercel deployment build completed successfully!');
} catch (error) {
  console.error('❌ Vercel deployment build failed:', error.message);
  process.exit(1);
}