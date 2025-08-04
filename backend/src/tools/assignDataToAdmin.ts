import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function assignDataToAdmin() {
  console.log(`Assigning data to admin user...`);

  const organizationName = "Compass Inc.";
  const adminEmail = "admin@compass.com";
  const adminPassword = "adminpassword"; // Ensure this matches the password used in seed script

  const organization = await prisma.organization.upsert({
    where: { name: organizationName },
    update: {},
    create: {
      name: organizationName,
      settings: {},
    },
  });

  // Create or find default Admin User
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      // Update existing user if needed, e.g., password or role
      password: hashedPassword, // Ensure password is up-to-date
      role: "ADMIN",
      organizationId: organization.id,
    },
    create: {
      email: adminEmail,
      name: "Admin User",
      password: hashedPassword,
      role: "ADMIN",
      organizationId: organization.id,
    },
  });

  console.log(`Admin user with id: ${adminUser.id} ensured.`);

  // Update all WorkOrder records to be assigned to the admin user
  const updatedWorkOrders = await prisma.workOrder.updateMany({
    where: { organizationId: organization.id },
    data: { assignedToId: adminUser.id },
  });

  console.log(`Assigned ${updatedWorkOrders.count} work orders to admin user.`);

  console.log(`Data assignment finished.`);
}

assignDataToAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });