import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { 
  prisma?: PrismaClient;
  tursoClient?: any;
};

// Environment check and logging
const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
const hasTursoConfig = !!(process.env.LIBSQL_URL && process.env.LIBSQL_AUTH_TOKEN);

console.log('[Prisma] Environment check:', {
  isProduction,
  hasTursoConfig,
  LIBSQL_URL: process.env.LIBSQL_URL ? 'SET' : 'MISSING',
  LIBSQL_AUTH_TOKEN: process.env.LIBSQL_AUTH_TOKEN ? 'SET' : 'MISSING'
});

let prismaClient: PrismaClient;

if (hasTursoConfig) {
  console.log('[Prisma] Using Turso libSQL adapter');
  console.log('[Prisma] LIBSQL_URL value:', process.env.LIBSQL_URL);
  console.log('[Prisma] LIBSQL_AUTH_TOKEN length:', process.env.LIBSQL_AUTH_TOKEN?.length);
  
  // Create Turso client with explicit config
  const clientConfig = {
    url: process.env.LIBSQL_URL!,
    authToken: process.env.LIBSQL_AUTH_TOKEN!,
  };
  
  const tursoClient = createClient(clientConfig);
  console.log('[Prisma] Turso client created successfully');
  
  // Create Prisma adapter with explicit config
  // The adapter might need the config, not just the client
  const adapter = new PrismaLibSQL({
    url: process.env.LIBSQL_URL!,
    authToken: process.env.LIBSQL_AUTH_TOKEN!,
  } as any);
  console.log('[Prisma] libSQL adapter created successfully');
  
  // Create Prisma client with Turso adapter
  prismaClient = new PrismaClient({
    adapter,
    log: isProduction ? ['error'] : ['query', 'warn', 'error'],
  });
  
  console.log('[Prisma] PrismaClient with adapter created successfully');
  
  // Store Turso client for direct queries
  globalForPrisma.tursoClient = tursoClient;
} else {
  console.log('[Prisma] Using local SQLite database');
  
  // Fallback to local SQLite
  prismaClient = new PrismaClient({
    log: isProduction ? ['error'] : ['query', 'warn', 'error'],
  });
}

// Export Prisma client
export const prisma = globalForPrisma.prisma ?? prismaClient;

// Direct Turso client for custom queries (if available)
export const tursoClient = globalForPrisma.tursoClient;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Ensure we close the connection when the application shuts down
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;