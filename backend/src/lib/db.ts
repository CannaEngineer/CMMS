// Re-export from prisma.ts for backward compatibility
export { prisma, prisma as default } from './prisma';

// Helper to ensure we're using the correct runtime
export const runtime = 'nodejs';