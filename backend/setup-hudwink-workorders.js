const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupHudwinkWorkOrders() {
  console.log('📋 Setting up Hudwink Manufacturing Work Orders & PM Data...\n');
  
  try {
    // Get the organization and users
    const org = await prisma.organization.findFirst({
      where: { name: 'Hudwink Manufacturing' }
    });
    
    if (!org) {
      throw new Error('Hudwink Manufacturing organization not found. Run setup-hudwink-demo.js first.');
    }
    
    const users = await prisma.user.findMany({
      where: { organizationId: org.id }
    });
    
    const assets = await prisma.asset.findMany({
      where: { organizationId: org.id }
    });
    
    const [admin, manager, tech1, tech2, facilities] = users;
    
    // Create PM Tasks
    console.log('🔧 Creating PM task templates...');
    const pmTasks = await Promise.all([
      prisma.pMTask.create({
        data: {
          title: 'Weekly Production Line Inspection',
          description: 'Comprehensive visual and operational inspection of assembly line components',
          type: 'INSPECTION',
          procedure: 'Check all conveyor belts, electrical connections, safety systems, and lubrication points',
          safetyRequirements: 'LOTO required, PPE: Safety glasses, steel-toed boots',
          toolsRequired: 'Multimeter, torque wrench, inspection checklist',
          partsRequired: 'None typically required',
          estimatedMinutes: 45,
          organizationId: org.id,
          isActive: true
        }
      }),
      prisma.pMTask.create({
        data: {
          title: 'Monthly Belt Replacement Check',
          description: 'Inspect and replace worn drive belts as needed',
          type: 'REPLACEMENT',
          procedure: 'Measure belt tension, check for cracking, replace if beyond tolerance',
          safetyRequirements: 'LOTO required, PPE: Safety glasses, gloves',
          toolsRequired: 'Belt tension gauge, replacement belts',
          partsRequired: 'V-Belt Drive Belt (VB-HD-001)',
          estimatedMinutes: 30,
          organizationId: org.id,
          isActive: true
        }
      }),
      prisma.pMTask.create({
        data: {
          title: 'Quarterly Hydraulic System Service',
          description: 'Complete hydraulic system maintenance including filter replacement',
          type: 'LUBRICATION',
          procedure: 'Change hydraulic fluid, replace filters, check pressure settings',
          safetyRequirements: 'LOTO required, PPE: Safety glasses, chemical-resistant gloves',
          toolsRequired: 'Hydraulic fluid, drain pan, pressure gauge',
          partsRequired: 'Hydraulic Filter (HF-HP-025)',
          estimatedMinutes: 120,
          organizationId: org.id,
          isActive: true
        }
      }),
      prisma.pMTask.create({
        data: {
          title: 'Monthly HVAC Filter Replacement',
          description: 'Replace air filters in HVAC systems',
          type: 'REPLACEMENT',
          procedure: 'Remove old filters, inspect ductwork, install new filters',
          safetyRequirements: 'PPE: Dust mask, safety glasses',
          toolsRequired: 'Screwdriver, flashlight',
          partsRequired: 'HVAC Air Filter (AF-HEPA-20x25)',
          estimatedMinutes: 20,
          organizationId: org.id,
          isActive: true
        }
      }),
      prisma.pMTask.create({
        data: {
          title: 'Annual Generator Load Test',
          description: 'Full load test of backup generator system',
          type: 'TESTING',
          procedure: 'Start generator, gradually apply load, monitor performance parameters',
          safetyRequirements: 'Authorized personnel only, hearing protection required',
          toolsRequired: 'Load bank, multimeter, logbook',
          partsRequired: 'None typically required',
          estimatedMinutes: 180,
          organizationId: org.id,
          isActive: true
        }
      })
    ]);
    
    // Create PM Schedules
    console.log('📅 Creating PM schedules...');
    const pmSchedules = await Promise.all([
      prisma.pMSchedule.create({
        data: {
          title: 'Assembly Line #1 - Weekly Maintenance',
          description: 'Weekly preventive maintenance for primary assembly line',
          frequency: 'WEEKLY',
          nextDue: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          assetId: assets.find(a => a.name === 'Assembly Line #1')?.id
        }
      }),
      prisma.pMSchedule.create({
        data: {
          title: 'CNC Machine - Monthly Service',
          description: 'Monthly precision maintenance for CNC machining center',
          frequency: 'MONTHLY',
          nextDue: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          assetId: assets.find(a => a.name === 'CNC Machining Center')?.id
        }
      }),
      prisma.pMSchedule.create({
        data: {
          title: 'HVAC System - Monthly Filter Change',
          description: 'Monthly air filter replacement program',
          frequency: 'MONTHLY',
          nextDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          assetId: assets.find(a => a.name === 'HVAC Unit - Production')?.id
        }
      }),
      prisma.pMSchedule.create({
        data: {
          title: 'Backup Generator - Quarterly Test',
          description: 'Quarterly load testing and maintenance',
          frequency: 'QUARTERLY',
          nextDue: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          assetId: assets.find(a => a.name === 'Backup Generator')?.id
        }
      })
    ]);
    
    // Create Work Orders
    console.log('📝 Creating work orders...');
    const workOrders = await Promise.all([
      // Emergency Work Order
      prisma.workOrder.create({
        data: {
          title: 'URGENT: Air Compressor Pressure Loss',
          description: 'Central air compressor system losing pressure. Production pneumatic tools not functioning properly. Safety concern due to inconsistent tool operation.',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          assetId: assets.find(a => a.name === 'Air Compressor System')?.id,
          assignedToId: tech1.id,
          organizationId: org.id,
          estimatedHours: 4,
          totalLoggedHours: 2.5,
          startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
        }
      }),
      // Scheduled Maintenance
      prisma.workOrder.create({
        data: {
          title: 'Assembly Line #2 - Weekly Inspection',
          description: 'Routine weekly inspection of assembly line components, lubrication points, and safety systems.',
          status: 'OPEN',
          priority: 'MEDIUM',
          assetId: assets.find(a => a.name === 'Assembly Line #2')?.id,
          assignedToId: tech2.id,
          organizationId: org.id,
          estimatedHours: 1,
          totalLoggedHours: 0,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
        }
      }),
      // Completed Work Order
      prisma.workOrder.create({
        data: {
          title: 'Forklift #1 - 500-Hour Service',
          description: 'Scheduled 500-hour maintenance service including oil change, filter replacement, and safety inspection.',
          status: 'COMPLETED',
          priority: 'MEDIUM',
          assetId: assets.find(a => a.name === 'Forklift #1')?.id,
          assignedToId: facilities.id,
          organizationId: org.id,
          estimatedHours: 2,
          totalLoggedHours: 2.25,
          startedAt: new Date(Date.now() - 72 * 60 * 60 * 1000), // 3 days ago
          completedAt: new Date(Date.now() - 70 * 60 * 60 * 1000), // 2 days 22 hours ago
          createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000) // 4 days ago
        }
      }),
      // Quality Control Issue
      prisma.workOrder.create({
        data: {
          title: 'X-Ray Machine Calibration Required',
          description: 'Quality control X-ray machine showing inconsistent readings. Requires calibration and possible component replacement.',
          status: 'OPEN',
          priority: 'HIGH',
          assetId: assets.find(a => a.name === 'Quality Control X-Ray Machine')?.id,
          assignedToId: tech1.id,
          organizationId: org.id,
          estimatedHours: 3,
          totalLoggedHours: 0,
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
        }
      }),
      // Preventive Maintenance
      prisma.workOrder.create({
        data: {
          title: 'CNC Machine - Precision Calibration',
          description: 'Monthly precision calibration and accuracy verification for CNC machining center.',
          status: 'OPEN',
          priority: 'MEDIUM',
          assetId: assets.find(a => a.name === 'CNC Machining Center')?.id,
          assignedToId: tech2.id,
          organizationId: org.id,
          estimatedHours: 2.5,
          totalLoggedHours: 0,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
        }
      }),
      // On Hold Work Order
      prisma.workOrder.create({
        data: {
          title: 'Hydraulic Press - Seal Replacement',
          description: 'Replace hydraulic seals on Press #1. Waiting for parts delivery from supplier.',
          status: 'ON_HOLD',
          priority: 'MEDIUM',
          assetId: assets.find(a => a.name === 'Hydraulic Press #1')?.id,
          assignedToId: tech1.id,
          organizationId: org.id,
          estimatedHours: 6,
          totalLoggedHours: 0,
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000) // 2 days ago
        }
      })
    ]);
    
    // Create Maintenance History Records
    console.log('📚 Creating maintenance history...');
    const maintenanceHistory = await Promise.all([
      prisma.maintenanceHistory.create({
        data: {
          assetId: assets.find(a => a.name === 'Assembly Line #1')?.id,
          workOrderId: workOrders.find(wo => wo.status === 'COMPLETED')?.id,
          type: 'PREVENTIVE',
          title: 'Completed 500-hour preventive maintenance service',
          description: 'Completed 500-hour preventive maintenance service',
          performedById: facilities.id,
          durationMinutes: 135, // 2.25 hours in minutes
          laborCost: 168.75, // 2.25 hours * $75/hour
          partsCost: 89.50,
          notes: 'All systems functioning normally. Replaced hydraulic filter as scheduled.',
          isCompleted: true,
          completedAt: new Date(Date.now() - 70 * 60 * 60 * 1000)
        }
      }),
      prisma.maintenanceHistory.create({
        data: {
          assetId: assets.find(a => a.name === 'HVAC Unit - Production')?.id,
          type: 'PREVENTIVE',
          title: 'Monthly HVAC filter replacement',
          description: 'Monthly HVAC filter replacement',
          performedById: facilities.id,
          durationMinutes: 25,
          laborCost: 31.25,
          partsCost: 34.95,
          notes: 'Replaced all air filters. System airflow improved significantly.',
          isCompleted: true,
          completedAt: new Date(Date.now() - 168 * 60 * 60 * 1000) // 7 days ago
        }
      }),
      prisma.maintenanceHistory.create({
        data: {
          assetId: assets.find(a => a.name === 'CNC Machining Center')?.id,
          type: 'CORRECTIVE',
          title: 'Replaced worn cutting tool and recalibrated axes',
          description: 'Replaced worn cutting tool and recalibrated axes',
          performedById: tech1.id,
          durationMinutes: 180,
          laborCost: 225.00,
          partsCost: 450.00,
          notes: 'Tool wear was within acceptable limits. Precision checks passed.',
          isCompleted: true,
          completedAt: new Date(Date.now() - 240 * 60 * 60 * 1000) // 10 days ago
        }
      })
    ]);
    
    // Create Meter Readings
    console.log('📊 Creating meter readings...');
    const meterReadings = [];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    // Generate daily meter readings for key equipment
    for (let i = 0; i < 30; i++) {
      const readingDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      
      // Assembly Line #1 - operating hours
      meterReadings.push(
        prisma.meterReading.create({
          data: {
            assetId: assets.find(a => a.name === 'Assembly Line #1')?.id,
            meterType: 'HOURS',
            value: 2450 + (i * 8.5), // 8.5 hours per day average
            unit: 'hours',
            recordedById: tech1.id,
            readingDate: readingDate
          }
        })
      );
      
      // CNC Machine - cycles count
      if (i % 3 === 0) { // Every 3 days
        meterReadings.push(
          prisma.meterReading.create({
            data: {
              assetId: assets.find(a => a.name === 'CNC Machining Center')?.id,
              meterType: 'CYCLES',
              value: 15000 + (i * 45), // About 45 cycles per reading period
              unit: 'cycles',
              recordedById: tech2.id,
              readingDate: readingDate
            }
          })
        );
      }
    }
    
    await Promise.all(meterReadings);
    
    console.log('✅ Hudwink Manufacturing work orders and PM data setup completed!');
    console.log('\\n📊 Summary:');
    console.log(`- PM Tasks created: ${pmTasks.length}`);
    console.log(`- PM Schedules: ${pmSchedules.length}`);
    console.log(`- Work Orders: ${workOrders.length}`);
    console.log(`- Maintenance History: ${maintenanceHistory.length}`);
    console.log(`- Meter Readings: ${meterReadings.length}`);
    
    return {
      pmTasks,
      pmSchedules,
      workOrders,
      maintenanceHistory,
      meterReadings: meterReadings.length
    };
    
  } catch (error) {
    console.error('❌ Work orders setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
if (require.main === module) {
  setupHudwinkWorkOrders().catch(console.error);
}

module.exports = { setupHudwinkWorkOrders };