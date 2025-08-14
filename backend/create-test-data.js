const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('Creating test data for calendar...');
    
    // Get the first organization
    const org = await prisma.organization.findFirst();
    if (!org) {
      console.error('No organization found');
      return;
    }
    console.log('Using organization:', org.name);

    // Create a test location if it doesn't exist
    let location = await prisma.location.findFirst({
      where: { organizationId: org.id }
    });
    
    if (!location) {
      location = await prisma.location.create({
        data: {
          name: 'Main Facility',
          description: 'Primary maintenance facility',
          organizationId: org.id,
        }
      });
      console.log('Created location:', location.name);
    } else {
      console.log('Using existing location:', location.name);
    }

    // Create test assets if they don't exist
    const assetCount = await prisma.asset.count({
      where: { organizationId: org.id }
    });
    
    if (assetCount === 0) {
      const assets = await Promise.all([
        prisma.asset.create({
          data: {
            name: 'HVAC Unit 1',
            description: 'Primary HVAC system',
            status: 'ONLINE',
            organizationId: org.id,
            locationId: location.id,
            criticality: 'HIGH',
          }
        }),
        prisma.asset.create({
          data: {
            name: 'Generator A',
            description: 'Backup power generator',
            status: 'ONLINE',
            organizationId: org.id,
            locationId: location.id,
            criticality: 'IMPORTANT',
          }
        }),
        prisma.asset.create({
          data: {
            name: 'Air Compressor',
            description: 'Main air compressor unit',
            status: 'ONLINE',
            organizationId: org.id,
            locationId: location.id,
            criticality: 'MEDIUM',
          }
        })
      ]);
      console.log('Created', assets.length, 'assets');
    }

    // Get all assets
    const assets = await prisma.asset.findMany({
      where: { organizationId: org.id }
    });
    console.log('Found', assets.length, 'assets');

    // Create PM schedules with different dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    console.log('Creating PM schedules...');
    
    // Delete existing PM schedules for clean test
    await prisma.pMSchedule.deleteMany({});
    
    const pmSchedules = await Promise.all([
      prisma.pMSchedule.create({
        data: {
          title: 'HVAC Monthly Inspection',
          description: 'Monthly inspection and filter replacement',
          frequency: 'MONTHLY',
          nextDue: today,
          assetId: assets[0].id,
        }
      }),
      prisma.pMSchedule.create({
        data: {
          title: 'Generator Weekly Check',
          description: 'Weekly generator test and inspection',
          frequency: 'WEEKLY',
          nextDue: tomorrow,
          assetId: assets[1]?.id || assets[0].id,
        }
      }),
      prisma.pMSchedule.create({
        data: {
          title: 'Compressor Maintenance',
          description: 'Quarterly compressor maintenance',
          frequency: 'QUARTERLY',
          nextDue: nextWeek,
          assetId: assets[2]?.id || assets[0].id,
        }
      }),
      prisma.pMSchedule.create({
        data: {
          title: 'OVERDUE: Safety Inspection',
          description: 'This inspection is overdue',
          frequency: 'MONTHLY',
          nextDue: yesterday,
          assetId: assets[0].id,
        }
      })
    ]);
    console.log('Created', pmSchedules.length, 'PM schedules');

    // Get an admin user for assignments
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    // Create work orders (if schema supports it)
    console.log('Creating work orders...');
    try {
      // Delete existing work orders for clean test
      await prisma.workOrder.deleteMany({});
      
      const workOrders = await Promise.all([
        prisma.workOrder.create({
          data: {
            title: 'Fix HVAC Noise Issue',
            description: 'Unusual noise coming from HVAC unit',
            status: 'OPEN',
            priority: 'HIGH',
            organizationId: org.id,
            assetId: assets[0].id,
            assignedToId: adminUser?.id,
            createdAt: today,
          }
        }),
        prisma.workOrder.create({
          data: {
            title: 'Replace Generator Battery',
            description: 'Battery needs replacement',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            organizationId: org.id,
            assetId: assets[1]?.id || assets[0].id,
            assignedToId: adminUser?.id,
            createdAt: new Date(today.getTime() - 24*60*60*1000),
          }
        }),
        prisma.workOrder.create({
          data: {
            title: 'Urgent: Compressor Leak',
            description: 'Air leak detected in main compressor',
            status: 'OPEN',
            priority: 'URGENT',
            organizationId: org.id,
            assetId: assets[2]?.id || assets[0].id,
            assignedToId: adminUser?.id,
            createdAt: today,
          }
        })
      ]);
      console.log('Created', workOrders.length, 'work orders');
    } catch (error) {
      console.log('Could not create work orders:', error.message);
    }

    console.log('\n✅ Test data created successfully!');
    
    // Verify PM schedules
    const pmCount = await prisma.pMSchedule.count();
    const woCount = await prisma.workOrder.count();
    console.log('📊 Total PM Schedules in database:', pmCount);
    console.log('📊 Total Work Orders in database:', woCount);
    
    // Show sample data
    const samplePM = await prisma.pMSchedule.findFirst({
      include: { asset: { include: { location: true } } }
    });
    console.log('\n📅 Sample PM Schedule:', {
      title: samplePM?.title,
      nextDue: samplePM?.nextDue,
      asset: samplePM?.asset?.name,
      location: samplePM?.asset?.location?.name
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error creating test data:', error);
    await prisma.$disconnect();
  }
}

createTestData();