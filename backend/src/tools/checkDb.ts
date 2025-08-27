import { prisma } from '../lib/prisma';

// Prisma client imported from singleton

async function checkDatabase() {
  try {
    console.log('Checking database contents...');
    
    // Check organizations
    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true }
    });
    console.log('Organizations:', organizations);
    
    // Check users
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, organizationId: true }
    });
    console.log('Users:', users);
    
    // Check if user ID 1 and organization ID 1 exist
    const user1 = await prisma.user.findUnique({
      where: { id: 1 }
    });
    console.log('User ID 1:', user1);
    
    const org1 = await prisma.organization.findUnique({
      where: { id: 1 }
    });
    console.log('Organization ID 1:', org1);
    
  } catch (error) {
    console.error('Database check error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();