import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean database
  console.log('🧹 Cleaning database...');
  await prisma.workOrderShare.deleteMany();
  await prisma.workOrderTimeLog.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.portalSubmission.deleteMany();
  await prisma.portalField.deleteMany();
  await prisma.portal.deleteMany();
  await prisma.pMTrigger.deleteMany();
  await prisma.pMSchedule.deleteMany();
  await prisma.pMTask.deleteMany();
  await prisma.part.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // Create Organization
  console.log('🏢 Creating organization...');
  const organization = await prisma.organization.create({
    data: {
      name: 'Demo Company Inc.',
      settings: {
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD'
      }
    }
  });

  // Create Users
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('Demo123!', 10);
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      organizationId: organization.id
    }
  });

  const techUser = await prisma.user.create({
    data: {
      email: 'tech@demo.com',
      password: hashedPassword,
      name: 'John Technician',
      role: 'TECHNICIAN',
      organizationId: organization.id
    }
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@demo.com',
      password: hashedPassword,
      name: 'Jane Manager',
      role: 'TECHNICIAN',
      organizationId: organization.id
    }
  });

  // Create Locations (sequential to handle parent relationships)
  console.log('📍 Creating locations...');
  const mainBuilding = await prisma.location.create({
    data: {
      name: 'Main Building',
      address: '100 Main Street',
      organizationId: organization.id
    }
  });
  
  const warehouseA = await prisma.location.create({
    data: {
      name: 'Warehouse A',
      address: '200 Industrial Drive',
      organizationId: organization.id
    }
  });
  
  const productionFloor = await prisma.location.create({
    data: {
      name: 'Production Floor',
      address: '100 Main Street',
      parentId: mainBuilding.id,
      organizationId: organization.id
    }
  });
  
  const officeArea = await prisma.location.create({
    data: {
      name: 'Office Area',
      address: '100 Main Street',
      parentId: mainBuilding.id,
      organizationId: organization.id
    }
  });
  
  const locations = [mainBuilding, warehouseA, productionFloor, officeArea];

  // Create Suppliers
  console.log('🚚 Creating suppliers...');
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'Industrial Supply Co',
        contactInfo: 'John Smith - orders@industrialsupply.com - 555-0100',
        email: 'orders@industrialsupply.com',
        phone: '555-0100',
        address: '50 Supply Lane',
        organizationId: organization.id
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Tech Parts Direct',
        contactInfo: 'Sarah Johnson - sales@techpartsdirect.com - 555-0200',
        email: 'sales@techpartsdirect.com',
        phone: '555-0200',
        address: '75 Technology Blvd',
        organizationId: organization.id
      }
    })
  ]);

  // Create Assets
  console.log('⚙️ Creating assets...');
  const assets = await Promise.all([
    prisma.asset.create({
      data: {
        name: 'HVAC Unit 1',
        status: 'ONLINE',
        manufacturer: 'Carrier',
        modelNumber: 'AC-5000',
        serialNumber: 'HVAC-001-2023',
        description: 'HVAC air conditioning unit',
        locationId: locations[0].id,
        organizationId: organization.id
      }
    }),
    prisma.asset.create({
      data: {
        name: 'Production Line 1',
        status: 'ONLINE',
        manufacturer: 'Industrial Machines Inc',
        modelNumber: 'PL-200',
        serialNumber: 'PL-001-2022',
        description: 'Manufacturing production line',
        year: 2022,
        locationId: locations[2].id,
        organizationId: organization.id
      }
    }),
    prisma.asset.create({
      data: {
        name: 'Generator Unit',
        status: 'ONLINE',
        manufacturer: 'PowerGen',
        modelNumber: 'GEN-1000',
        serialNumber: 'GEN-001-2023',
        description: 'Emergency backup generator',
        locationId: locations[1].id,
        organizationId: organization.id
      }
    }),
    prisma.asset.create({
      data: {
        name: 'Air Compressor',
        status: 'OFFLINE',
        manufacturer: 'CompressAir',
        modelNumber: 'CA-500',
        serialNumber: 'CA-001-2021',
        description: 'Pneumatic air compressor',
        locationId: locations[2].id,
        organizationId: organization.id
      }
    })
  ]);

  // Create Parts
  console.log('🔧 Creating parts inventory...');
  const parts = await Promise.all([
    prisma.part.create({
      data: {
        name: 'Air Filter',
        description: 'HVAC Air Filter 20x25x1',
        sku: 'AF-20251',
        stockLevel: 25,
        reorderPoint: 10,
        unitCost: 15.99,
        location: 'Warehouse A - Shelf B2',
        supplierId: suppliers[0].id,
        organizationId: organization.id
      }
    }),
    prisma.part.create({
      data: {
        name: 'Belt Drive',
        description: 'V-Belt for Production Line',
        sku: 'BD-V100',
        stockLevel: 8,
        reorderPoint: 5,
        unitCost: 45.00,
        location: 'Warehouse A - Shelf C1',
        supplierId: suppliers[0].id,
        organizationId: organization.id
      }
    }),
    prisma.part.create({
      data: {
        name: 'Circuit Breaker',
        description: '20A Circuit Breaker',
        sku: 'CB-20A',
        stockLevel: 15,
        reorderPoint: 8,
        unitCost: 25.50,
        location: 'Warehouse A - Shelf D3',
        supplierId: suppliers[1].id,
        organizationId: organization.id
      }
    }),
    prisma.part.create({
      data: {
        name: 'Lubricant Oil',
        description: 'Industrial Lubricant 5W-30',
        sku: 'LUB-5W30',
        stockLevel: 30,
        reorderPoint: 15,
        unitCost: 12.99,
        location: 'Warehouse A - Shelf A1',
        supplierId: suppliers[0].id,
        organizationId: organization.id
      }
    }),
    prisma.part.create({
      data: {
        name: 'LED Light Bulb',
        description: 'LED Bulb 60W Equivalent',
        sku: 'LED-60W',
        stockLevel: 50,
        reorderPoint: 20,
        unitCost: 8.99,
        location: 'Warehouse A - Shelf E2',
        supplierId: suppliers[1].id,
        organizationId: organization.id
      }
    })
  ]);

  // Create Work Orders
  console.log('📋 Creating work orders...');
  const workOrders = await Promise.all([
    prisma.workOrder.create({
      data: {
        title: 'HVAC Filter Replacement',
        description: 'Monthly filter replacement for HVAC Unit 1',
        status: 'OPEN',
        priority: 'MEDIUM',
        assetId: assets[0].id,
        assignedToId: techUser.id,
        organizationId: organization.id,
        estimatedHours: 1
      }
    }),
    prisma.workOrder.create({
      data: {
        title: 'Repair Air Compressor',
        description: 'Air compressor not building pressure. Needs diagnostic and repair.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assetId: assets[3].id,
        assignedToId: techUser.id,
        organizationId: organization.id,
        estimatedHours: 4,
        totalLoggedHours: 2
      }
    }),
    prisma.workOrder.create({
      data: {
        title: 'Production Line Maintenance',
        description: 'Quarterly maintenance for Production Line 1',
        status: 'OPEN',
        priority: 'LOW',
        assetId: assets[1].id,
        assignedToId: techUser.id,
        organizationId: organization.id,
        estimatedHours: 6
      }
    }),
    prisma.workOrder.create({
      data: {
        title: 'Emergency Generator Test',
        description: 'Monthly test run of emergency generator',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        assetId: assets[2].id,
        assignedToId: techUser.id,
        organizationId: organization.id,
        estimatedHours: 2,
        totalLoggedHours: 1.5
      }
    }),
    prisma.workOrder.create({
      data: {
        title: 'Office Light Replacement',
        description: 'Replace burnt out lights in office area',
        status: 'ON_HOLD',
        priority: 'LOW',
        organizationId: organization.id,
        estimatedHours: 2
      }
    })
  ]);

  // Create PM Tasks
  console.log('🔄 Creating PM tasks...');
  const pmTasks = await Promise.all([
    prisma.pMTask.create({
      data: {
        title: 'HVAC Filter Change',
        description: 'Replace all HVAC filters',
        type: 'REPLACEMENT',
        organizationId: organization.id
      }
    }),
    prisma.pMTask.create({
      data: {
        title: 'Generator Test Run',
        description: 'Test emergency generator for 30 minutes',
        type: 'TESTING',
        organizationId: organization.id
      }
    }),
    prisma.pMTask.create({
      data: {
        title: 'Production Line Lubrication',
        description: 'Lubricate all moving parts on production line',
        type: 'LUBRICATION',
        organizationId: organization.id
      }
    })
  ]);

  // Create PM Schedules
  console.log('📅 Creating PM schedules...');
  await Promise.all([
    prisma.pMSchedule.create({
      data: {
        title: 'Monthly HVAC Maintenance',
        frequency: 'MONTHLY',
        nextDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        assetId: assets[0].id
      }
    }),
    prisma.pMSchedule.create({
      data: {
        title: 'Monthly Generator Test',
        frequency: 'MONTHLY',
        nextDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        assetId: assets[2].id
      }
    }),
    prisma.pMSchedule.create({
      data: {
        title: 'Quarterly Production Line Service',
        frequency: 'QUARTERLY',
        nextDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        assetId: assets[1].id
      }
    })
  ]);

  // Create Portals
  console.log('🚪 Creating portals...');
  const portals = await Promise.all([
    prisma.portal.create({
      data: {
        name: 'Maintenance Request Portal',
        description: 'Submit maintenance requests',
        type: 'MAINTENANCE_REQUEST',
        status: 'ACTIVE',
        slug: 'maintenance-request',
        isActive: true,
        allowAnonymous: true,
        requiresApproval: false,
        autoCreateWorkOrders: true,
        primaryColor: '#1976d2',
        secondaryColor: '#ffffff',
        accentColor: '#ff4081',
        qrEnabled: true,
        publicUrl: 'http://localhost:5173/portal/maintenance-request',
        organizationId: organization.id,
        fields: {
          create: [
            {
              name: 'title',
              label: 'Issue Title',
              type: 'TEXT',
              isRequired: true,
              orderIndex: 0,
              placeholder: 'Brief description of the issue'
            },
            {
              name: 'description',
              label: 'Description',
              type: 'TEXTAREA',
              isRequired: true,
              orderIndex: 1,
              placeholder: 'Detailed description of the problem'
            },
            {
              name: 'priority',
              label: 'Priority',
              type: 'PRIORITY',
              isRequired: true,
              orderIndex: 2
            },
            {
              name: 'location',
              label: 'Location',
              type: 'LOCATION',
              isRequired: true,
              orderIndex: 3,
              placeholder: 'Where is the issue?'
            },
            {
              name: 'photos',
              label: 'Photos',
              type: 'IMAGE',
              isRequired: false,
              orderIndex: 4,
              helpText: 'Upload photos of the issue'
            }
          ]
        }
      }
    }),
    prisma.portal.create({
      data: {
        name: 'Equipment Registration',
        description: 'Register new equipment',
        type: 'ASSET_REGISTRATION',
        status: 'ACTIVE',
        slug: 'equipment-registration',
        isActive: true,
        allowAnonymous: false,
        requiresApproval: true,
        autoCreateWorkOrders: false,
        primaryColor: '#4caf50',
        secondaryColor: '#ffffff',
        accentColor: '#ff9800',
        qrEnabled: true,
        publicUrl: 'http://localhost:5173/portal/equipment-registration',
        organizationId: organization.id,
        fields: {
          create: [
            {
              name: 'assetName',
              label: 'Equipment Name',
              type: 'TEXT',
              isRequired: true,
              orderIndex: 0
            },
            {
              name: 'manufacturer',
              label: 'Manufacturer',
              type: 'TEXT',
              isRequired: true,
              orderIndex: 1
            },
            {
              name: 'model',
              label: 'Model Number',
              type: 'TEXT',
              isRequired: true,
              orderIndex: 2
            },
            {
              name: 'serialNumber',
              label: 'Serial Number',
              type: 'TEXT',
              isRequired: false,
              orderIndex: 3
            },
            {
              name: 'location',
              label: 'Installation Location',
              type: 'LOCATION',
              isRequired: true,
              orderIndex: 4
            }
          ]
        }
      }
    })
  ]);

  console.log('✅ Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`  Organization: ${organization.name}`);
  console.log(`  Users: 3 (admin@demo.com, tech@demo.com, manager@demo.com)`);
  console.log(`  Password for all users: Demo123!`);
  console.log(`  Locations: ${locations.length}`);
  console.log(`  Assets: ${assets.length}`);
  console.log(`  Parts: ${parts.length}`);
  console.log(`  Work Orders: ${workOrders.length}`);
  console.log(`  PM Tasks: ${pmTasks.length}`);
  console.log(`  Portals: ${portals.length}`);
  console.log('\n🚀 You can now login with:');
  console.log('   Email: admin@demo.com');
  console.log('   Password: Demo123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });