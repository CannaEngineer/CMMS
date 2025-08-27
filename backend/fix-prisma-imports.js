#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Fixing Prisma imports to use singleton pattern...\n');

// Find all TypeScript files that import PrismaClient
const files = glob.sync('src/**/*.ts', { 
  ignore: ['**/node_modules/**', 'src/lib/prisma.ts', 'src/lib/db.ts'] 
});

let filesUpdated = 0;
let totalInstances = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let updated = false;
  
  // Pattern 1: import { PrismaClient } from '@prisma/client';
  if (content.includes("import { PrismaClient } from '@prisma/client';")) {
    // Replace the import
    content = content.replace(
      "import { PrismaClient } from '@prisma/client';",
      "import { prisma } from '../lib/prisma';"
    );
    
    // Handle nested paths
    const depth = file.split('/').length - 2; // -2 for src/
    const relPath = '../'.repeat(depth) + 'lib/prisma';
    content = content.replace(
      "import { prisma } from '../lib/prisma';",
      `import { prisma } from '${relPath}';`
    );
    
    updated = true;
  }
  
  // Pattern 2: const prisma = new PrismaClient();
  if (content.includes('const prisma = new PrismaClient()')) {
    content = content.replace(/const prisma = new PrismaClient\(\);?/g, '// Prisma client imported from singleton');
    updated = true;
    totalInstances++;
  }
  
  // Pattern 3: new PrismaClient() inline
  if (content.includes('new PrismaClient(')) {
    console.log(`⚠️  Found inline PrismaClient instantiation in ${file}`);
    // Don't auto-fix these, they need manual review
  }
  
  if (updated) {
    fs.writeFileSync(file, content);
    filesUpdated++;
    console.log(`✅ Updated: ${file}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Files updated: ${filesUpdated}`);
console.log(`   PrismaClient instances replaced: ${totalInstances}`);
console.log('\n✨ Done! Now run: npm install && npx prisma generate');