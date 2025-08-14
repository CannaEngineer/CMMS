const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Create organization if it doesn't exist
    let organization = await prisma.organization.findFirst({
      where: { name: 'Test Organization' }
    });
    
    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          settings: {}
        }
      });
      console.log('Created test organization:', organization.id);
    }

    // Check if test user exists
    const existingUser = await prisma.user.findFirst({
      where: { email: 'admin@example.com' }
    });

    if (existingUser) {
      console.log('Test user already exists:', existingUser.email);
      return;
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Test Admin',
        password: hashedPassword,
        role: 'ADMIN',
        organizationId: organization.id
      }
    });

    console.log('Created test user:', user.email);

    // Create some test assets and locations for import testing
    const location = await prisma.location.create({
      data: {
        name: 'Test Location',
        description: 'Test location for importing',
        organizationId: organization.id
      }
    });

    await prisma.asset.create({
      data: {
        name: 'HVAC Unit 1',
        description: 'Test HVAC unit',
        locationId: location.id,
        organizationId: organization.id
      }
    });

    await prisma.asset.create({
      data: {
        name: 'Generator 1',
        description: 'Test generator',
        locationId: location.id,
        organizationId: organization.id
      }
    });

    await prisma.asset.create({
      data: {
        name: 'Warehouse A',
        description: 'Test warehouse',
        locationId: location.id,
        organizationId: organization.id
      }
    });

    console.log('Created test data successfully!');
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();