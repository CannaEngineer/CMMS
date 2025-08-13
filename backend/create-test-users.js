const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    // Get or create organization
    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          settings: {}
        }
      });
    }
    
    const hashedPassword = await bcrypt.hash('Demo123!', 10);
    
    // Create admin user if not exists
    const adminExists = await prisma.user.findUnique({ where: { email: 'admin@demo.com' } });
    if (!adminExists) {
      await prisma.user.create({
        data: {
          email: 'admin@demo.com',
          password: hashedPassword,
          name: 'Admin User',
          role: 'ADMIN',
          organizationId: org.id
        }
      });
      console.log('Created admin user');
    } else {
      console.log('Admin user already exists');
    }
    
    // Create technician user if not exists
    const techExists = await prisma.user.findUnique({ where: { email: 'tech@demo.com' } });
    if (!techExists) {
      await prisma.user.create({
        data: {
          email: 'tech@demo.com',
          password: hashedPassword,
          name: 'John Technician',
          role: 'TECHNICIAN',
          organizationId: org.id
        }
      });
      console.log('Created technician user');
    } else {
      console.log('Technician user already exists');
    }
    
    // Create manager user if not exists
    const managerExists = await prisma.user.findUnique({ where: { email: 'manager@demo.com' } });
    if (!managerExists) {
      await prisma.user.create({
        data: {
          email: 'manager@demo.com',
          password: hashedPassword,
          name: 'Jane Manager',
          role: 'MANAGER',
          organizationId: org.id
        }
      });
      console.log('Created manager user');
    } else {
      console.log('Manager user already exists');
    }
    
    console.log('\nTest users ready:');
    console.log('admin@demo.com - ADMIN role');
    console.log('tech@demo.com - TECHNICIAN role');
    console.log('manager@demo.com - MANAGER role');
    console.log('Password for all: Demo123!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();