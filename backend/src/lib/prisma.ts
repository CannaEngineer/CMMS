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
  NODE_ENV: process.env.NODE_ENV,
  LIBSQL_URL: process.env.LIBSQL_URL ? 'SET' : 'MISSING',
  LIBSQL_AUTH_TOKEN: process.env.LIBSQL_AUTH_TOKEN ? 'SET' : 'MISSING'
});

function createPrismaClient(): PrismaClient {
  // Use Turso in production if configured
  if (isProduction && hasTursoConfig) {
    try {
      console.log('[Prisma] Using Turso database for production');
      
      // Validate environment variables exist and are not empty
      const libsqlUrl = process.env.LIBSQL_URL;
      const libsqlAuthToken = process.env.LIBSQL_AUTH_TOKEN;
      
      if (!libsqlUrl || libsqlUrl === 'undefined' || libsqlUrl.trim() === '') {
        throw new Error('LIBSQL_URL is missing or invalid');
      }
      
      if (!libsqlAuthToken || libsqlAuthToken === 'undefined' || libsqlAuthToken.trim() === '') {
        throw new Error('LIBSQL_AUTH_TOKEN is missing or invalid');
      }
      
      console.log('[Prisma] Turso config validated:', {
        url: libsqlUrl.substring(0, 20) + '...',
        tokenLength: libsqlAuthToken.length
      });
      
      const tursoClient = createClient({
        url: libsqlUrl,
        authToken: libsqlAuthToken,
      });

      const adapter = new PrismaLibSQL(tursoClient as any);
      
      return new PrismaClient({
        adapter: adapter as any,
        log: ['error'],
      });
    } catch (error) {
      console.error('[Prisma] Failed to connect to Turso:', error);
      console.error('[Prisma] Falling back to local SQLite');
      // Fallback to local SQLite if Turso fails
    }
  }

  // Use local SQLite for development or as fallback
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
if (hasTursoConfig && process.env.LIBSQL_URL && process.env.LIBSQL_AUTH_TOKEN) {
  try {
    const libsqlUrl = process.env.LIBSQL_URL;
    const libsqlAuthToken = process.env.LIBSQL_AUTH_TOKEN;
    
    if (libsqlUrl !== 'undefined' && libsqlAuthToken !== 'undefined') {
      tursoClient = createClient({
        url: libsqlUrl,
        authToken: libsqlAuthToken,
      });
      globalForPrisma.tursoClient = tursoClient;
      console.log('[Turso] Direct client created successfully');
    }
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