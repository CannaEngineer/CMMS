import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { 
  prisma?: PrismaClient;
  tursoClient?: any;
};

// Create Turso client for direct queries when needed
if (process.env.LIBSQL_URL && !globalForPrisma.tursoClient) {
  globalForPrisma.tursoClient = createClient({
    url: process.env.LIBSQL_URL,
    authToken: process.env.LIBSQL_AUTH_TOKEN,
  });
}

// Export both Prisma client and Turso client
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'warn', 'error'] 
      : ['error'],
  });

// Direct Turso client for custom queries
export const tursoClient = globalForPrisma.tursoClient;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Ensure we close the connection when the application shuts down
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;