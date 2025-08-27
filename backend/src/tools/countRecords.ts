import { prisma } from '../../lib/prisma';

// Prisma client imported from singleton

async function countRecords() {
  try {
    const locations = await prisma.location.count();
    const assets = await prisma.asset.count();
    const suppliers = await prisma.supplier.count();
    const parts = await prisma.part.count();
    const workOrders = await prisma.workOrder.count();

    console.log(`Locations: ${locations}`);
    console.log(`Assets: ${assets}`);
    console.log(`Suppliers: ${suppliers}`);
    console.log(`Parts: ${parts}`);
    console.log(`WorkOrders: ${workOrders}`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

countRecords();