const { PrismaClient } = require('@prisma/client');

// Simple cuid generator function
function generateCuid() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `c${timestamp}${randomPart}`;
}

const prisma = new PrismaClient();

async function migrateUniqueIds() {
  console.log('Starting migration to populate uniqueId fields...');

  try {
    // Update WorkOrder records
    console.log('Updating WorkOrder records...');
    const workOrders = await prisma.workOrder.findMany({
      where: {
        uniqueId: null
      }
    });

    console.log(`Found ${workOrders.length} WorkOrder records to update`);
    
    for (const wo of workOrders) {
      await prisma.workOrder.update({
        where: { id: wo.id },
        data: { uniqueId: generateCuid() }
      });
    }

    // Update PMSchedule records  
    console.log('Updating PMSchedule records...');
    const pmSchedules = await prisma.pMSchedule.findMany({
      where: {
        uniqueId: null
      }
    });

    console.log(`Found ${pmSchedules.length} PMSchedule records to update`);
    
    for (const pm of pmSchedules) {
      await prisma.pMSchedule.update({
        where: { id: pm.id },
        data: { uniqueId: generateCuid() }
      });
    }

    console.log('Migration completed successfully!');
    
    // Verify the migration
    const woCount = await prisma.workOrder.count({ where: { uniqueId: null } });
    const pmCount = await prisma.pMSchedule.count({ where: { uniqueId: null } });
    
    console.log(`Verification: ${woCount} WorkOrders and ${pmCount} PMSchedules still have null uniqueId`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateUniqueIds();