const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createTechnicianUser() {
  try {
    const org = await prisma.organization.findFirst({
      where: { name: 'ACME Corp' }
    });

    if (!org) {
      console.log('Organization not found');
      return;
    }

    const hashedPassword = await bcrypt.hash('password123', 10);

    const user = await prisma.user.upsert({
      where: { email: 'tech@acme.com' },
      update: {},
      create: {
        email: 'tech@acme.com',
        name: 'Tech User',
        password: hashedPassword,
        role: 'TECHNICIAN',
        organizationId: org.id
      }
    });

    console.log('Created technician user:', user);
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTechnicianUser();