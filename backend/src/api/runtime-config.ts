// Force Node.js runtime for all API routes that use Prisma
// This prevents accidental Edge runtime usage which would cause db.prisma.io errors

export const runtime = 'nodejs';

// This file should be imported at the top of every API route file