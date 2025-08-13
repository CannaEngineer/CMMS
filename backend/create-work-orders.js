const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createWorkOrders() {
  try {
    // Get the technician user
    const techUser = await prisma.user.findUnique({
      where: { email: 'tech@demo.com' }
    });
    
    if (!techUser) {
      console.error('Technician user not found');
      return;
    }

    // Get organization
    const org = await prisma.organization.findFirst();
    if (!org) {
      console.error('Organization not found');
      return;
    }

    // Get or create a location
    let location = await prisma.location.findFirst({
      where: { organizationId: org.id }
    });
    
    if (!location) {
      location = await prisma.location.create({
        data: {
          name: 'Main Facility',
          address: '100 Industrial Blvd',
          organizationId: org.id
        }
      });
    }

    // Get or create assets
    let assets = await prisma.asset.findMany({
      where: { organizationId: org.id },
      take: 3
    });

    if (assets.length === 0) {
      const createdAssets = await Promise.all([
        prisma.asset.create({
          data: {
            name: 'CNC Milling Machine A1',
            description: 'High-precision CNC milling machine',
            serialNumber: 'CNC-001-2023',
            manufacturer: 'Industrial Machines Inc',
            status: 'ONLINE',
            criticality: 'HIGH',
            locationId: location.id,
            organizationId: org.id
          }
        }),
        prisma.asset.create({
          data: {
            name: 'Industrial Conveyor Belt',
            description: 'Main production line conveyor system',
            serialNumber: 'CONV-001-2022',
            manufacturer: 'ConveyorTech',
            status: 'ONLINE',
            criticality: 'MEDIUM',
            locationId: location.id,
            organizationId: org.id
          }
        }),
        prisma.asset.create({
          data: {
            name: 'Motor Unit #3',
            description: 'Primary motor for production line',
            serialNumber: 'MOT-003-2021',
            manufacturer: 'PowerMotors',
            status: 'OFFLINE',
            criticality: 'HIGH',
            locationId: location.id,
            organizationId: org.id
          }
        })
      ]);
      assets = createdAssets;
    }

    // Create work orders assigned to technician
    const workOrders = await Promise.all([
      prisma.workOrder.create({
        data: {
          title: 'Hydraulic System Maintenance',
          description: 'Check hydraulic fluid levels and replace filters on CNC Machine A1',
          status: 'OPEN',
          priority: 'HIGH',
          assetId: assets[0].id,
          assignedToId: techUser.id,
          organizationId: org.id,
          estimatedHours: 4
        }
      }),
      prisma.workOrder.create({
        data: {
          title: 'Preventive Maintenance Check',
          description: 'Monthly safety inspection and lubrication of equipment',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          assetId: assets[1].id,
          assignedToId: techUser.id,
          organizationId: org.id,
          estimatedHours: 2,
          startedAt: new Date()
        }
      }),
      prisma.workOrder.create({
        data: {
          title: 'Replace Worn Bearings',
          description: 'Replace industrial bearings showing signs of wear',
          status: 'COMPLETED',
          priority: 'MEDIUM',
          assetId: assets[2].id,
          assignedToId: techUser.id,
          organizationId: org.id,
          estimatedHours: 3,
          completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // Completed yesterday
        }
      })
    ]);

    console.log('✅ Created work orders:');
    workOrders.forEach(wo => {
      console.log(`  - ${wo.title} (${wo.status}) - assigned to ${techUser.name}`);
    });

    console.log('\n📊 Summary:');
    console.log(`  Work Orders: ${workOrders.length}`);
    console.log(`  Assets: ${assets.length}`);
    console.log(`  Location: ${location.name}`);
    console.log(`  Assigned to: ${techUser.name} (${techUser.email})`);

  } catch (error) {
    console.error('Error creating work orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createWorkOrders();