import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { 
  prisma?: PrismaClient;
  tursoClient?: any;
};

console.log('[Prisma] Environment check:', {
  VERCEL: !!process.env.VERCEL,
  LIBSQL_URL: !!process.env.LIBSQL_URL,
  NODE_ENV: process.env.NODE_ENV
});

// For now, use regular Prisma client with local SQLite
// Turso adapter will be added when it's more stable
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'warn', 'error'] 
      : ['error'],
  });

// Create Turso client for direct queries when needed
let tursoClient: any = null;
if (process.env.LIBSQL_URL && process.env.LIBSQL_AUTH_TOKEN) {
  try {
    console.log('[Turso] Creating direct client for custom queries');
    tursoClient = createClient({
      url: process.env.LIBSQL_URL,
      authToken: process.env.LIBSQL_AUTH_TOKEN,
    });
    globalForPrisma.tursoClient = tursoClient;
  } catch (error) {
    console.warn('[Turso] Failed to create direct client:', error);
  }
}

// Export direct Turso client for custom queries
export { tursoClient };

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Ensure we close the connection when the application shuts down
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;