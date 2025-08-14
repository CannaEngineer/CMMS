const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testData() {
  try {
    // Count work orders
    const workOrderCount = await prisma.workOrder.count({
      where: { organizationId: 1 }
    });
    console.log('Work Orders in DB:', workOrderCount);
    
    // List all work orders with details
    const workOrders = await prisma.workOrder.findMany({
      where: { organizationId: 1 },
      select: { id: true, title: true, status: true, createdAt: true }
    });
    console.log('Work Orders:', workOrders);
    
    // Count assets
    const assetCount = await prisma.asset.count({
      where: { organizationId: 1 }
    });
    console.log('Assets in DB:', assetCount);
    
    // List all assets
    const assets = await prisma.asset.findMany({
      where: { organizationId: 1 },
      select: { id: true, name: true, status: true }
    });
    console.log('Assets:', assets);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testData();