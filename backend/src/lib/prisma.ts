import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSQL } from "@prisma/adapter-libsql";

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { 
  prisma?: PrismaClient;
  tursoClient?: any;
};

const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
const hasTursoConfig = !!(process.env.LIBSQL_URL && process.env.LIBSQL_AUTH_TOKEN);

console.log('[Prisma] Environment check:', {
  isProduction,
  hasTursoConfig,
  VERCEL: !!process.env.VERCEL,
  NODE_ENV: process.env.NODE_ENV
});

function createPrismaClient(): PrismaClient {
  // Use Turso in production if configured
  if (isProduction && hasTursoConfig) {
    try {
      console.log('[Prisma] Using Turso database for production');
      
      const tursoClient = createClient({
        url: process.env.LIBSQL_URL!,
        authToken: process.env.LIBSQL_AUTH_TOKEN!,
      });

      const adapter = new PrismaLibSQL(tursoClient as any);
      
      return new PrismaClient({
        adapter: adapter as any,
        log: ['error'],
      });
    } catch (error) {
      console.error('[Prisma] Failed to connect to Turso:', error);
      throw new Error('Database connection failed. Please check Turso configuration.');
    }
  }

  // Use local SQLite for development
  console.log('[Prisma] Using local SQLite database');
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'warn', 'error'] 
      : ['error'],
  });
}

// Create Prisma client
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Create direct Turso client for raw queries if needed
let tursoClient: any = null;
if (hasTursoConfig) {
  try {
    tursoClient = createClient({
      url: process.env.LIBSQL_URL!,
      authToken: process.env.LIBSQL_AUTH_TOKEN!,
    });
    globalForPrisma.tursoClient = tursoClient;
  } catch (error) {
    console.warn('[Turso] Failed to create direct client:', error);
  }
}

export { tursoClient };

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Ensure we close the connection when the application shuts down
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;