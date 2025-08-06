import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('Creating test organization and user...');
    
    // Create organization
    const organization = await prisma.organization.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Test Organization',
        settings: undefined
      }
    });
    console.log('Created organization:', organization);
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        email: 'admin@test.com',
        name: 'Test Admin',
        password: hashedPassword,
        role: 'ADMIN',
        organizationId: 1
      }
    });
    console.log('Created user:', { id: user.id, email: user.email, name: user.name });
    
    // Create a test location for assets
    const location = await prisma.location.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Main Building',
        description: 'Main building location',
        organizationId: 1
      }
    });
    console.log('Created location:', location);
    
    console.log('Test data created successfully!');
    
  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();