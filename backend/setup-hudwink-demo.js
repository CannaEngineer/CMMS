const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function setupHudwinkDemo() {
  console.log('🏭 Setting up Hudwink Manufacturing Demo...\n');
  
  try {
    // Clear existing data first (only clear tables that exist)
    console.log('🧹 Cleaning existing data...');
    
    // Check if organization already exists and skip cleanup if this is the first run
    const existingOrg = await prisma.organization.findFirst({
      where: { name: 'Hudwink Manufacturing' }
    });
    
    if (existingOrg) {
      console.log('Found existing Hudwink organization, cleaning up...');
      // Clear in proper order to respect foreign key constraints
      try {
        await prisma.maintenanceHistory.deleteMany({ where: { asset: { organizationId: existingOrg.id } } });
      } catch (e) { console.log('MaintenanceHistory table not found, skipping...'); }
      
      try {
        await prisma.meterReading.deleteMany({ where: { asset: { organizationId: existingOrg.id } } });
      } catch (e) { console.log('MeterReading table not found, skipping...'); }
      
      try {
        await prisma.pMScheduleTask.deleteMany({ where: { pMSchedule: { asset: { organizationId: existingOrg.id } } } });
      } catch (e) { console.log('PMScheduleTask table not found, skipping...'); }
      
      try {
        await prisma.pMSchedule.deleteMany({ where: { asset: { organizationId: existingOrg.id } } });
      } catch (e) { console.log('PMSchedule table not found, skipping...'); }
      
      try {
        await prisma.pMTask.deleteMany({ where: { organizationId: existingOrg.id } });
      } catch (e) { console.log('PMTask table not found, skipping...'); }
      
      try {
        await prisma.workOrder.deleteMany({ where: { organizationId: existingOrg.id } });
      } catch (e) { console.log('WorkOrder table not found, skipping...'); }
      
      try {
        await prisma.asset.deleteMany({ where: { organizationId: existingOrg.id } });
      } catch (e) { console.log('Asset table not found, skipping...'); }
      
      try {
        await prisma.part.deleteMany({ where: { organizationId: existingOrg.id } });
      } catch (e) { console.log('Part table not found, skipping...'); }
      
      try {
        await prisma.supplier.deleteMany({ where: { organizationId: existingOrg.id } });
      } catch (e) { console.log('Supplier table not found, skipping...'); }
      
      try {
        await prisma.location.deleteMany({ where: { organizationId: existingOrg.id } });
      } catch (e) { console.log('Location table not found, skipping...'); }
      
      try {
        await prisma.user.deleteMany({ where: { organizationId: existingOrg.id } });
      } catch (e) { console.log('User table not found, skipping...'); }
      
      try {
        await prisma.organization.deleteMany({ where: { id: existingOrg.id } });
      } catch (e) { console.log('Organization table not found, skipping...'); }
    } else {
      console.log('No existing Hudwink organization found, proceeding with fresh setup...');
    }
    
    // Create Hudwink Manufacturing Organization
    console.log('🏢 Creating Hudwink Manufacturing organization...');
    const org = await prisma.organization.create({
      data: {
        name: 'Hudwink Manufacturing',
        settings: {
          timezone: 'America/New_York',
          currency: 'USD',
          workingHours: {
            start: '07:00',
            end: '17:00',
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
          },
          maintenanceSettings: {
            defaultPriority: 'MEDIUM',
            autoAssignment: true,
            requireApproval: false
          }
        }
      }
    });
    
    const hashedPassword = await bcrypt.hash('Demo2024!', 10);
    
    // Create Demo Users
    console.log('👥 Creating demo users...');
    const users = await Promise.all([
      // Admin User
      prisma.user.create({
        data: {
          email: 'admin@hudwink.com',
          password: hashedPassword,
          name: 'Sarah Johnson',
          role: 'ADMIN',
          organizationId: org.id
        }
      }),
      // Maintenance Manager
      prisma.user.create({
        data: {
          email: 'manager@hudwink.com',
          password: hashedPassword,
          name: 'Mike Rodriguez',
          role: 'MANAGER',
          organizationId: org.id
        }
      }),
      // Senior Technician
      prisma.user.create({
        data: {
          email: 'tech1@hudwink.com',
          password: hashedPassword,
          name: 'Alex Thompson',
          role: 'TECHNICIAN',
          organizationId: org.id
        }
      }),
      // Junior Technician
      prisma.user.create({
        data: {
          email: 'tech2@hudwink.com',
          password: hashedPassword,
          name: 'Emily Chen',
          role: 'TECHNICIAN',
          organizationId: org.id
        }
      }),
      // Facilities Technician
      prisma.user.create({
        data: {
          email: 'facilities@hudwink.com',
          password: hashedPassword,
          name: 'Robert Davis',
          role: 'TECHNICIAN',
          organizationId: org.id
        }
      })
    ]);
    
    const [admin, manager, tech1, tech2, facilities] = users;
    
    // Create Locations
    console.log('📍 Creating facility locations...');
    const locations = await Promise.all([
      prisma.location.create({
        data: {
          name: 'Main Production Floor',
          description: 'Primary manufacturing floor with assembly lines',
          organizationId: org.id
        }
      }),
      prisma.location.create({
        data: {
          name: 'Quality Control Lab',
          description: 'Testing and quality assurance facility',
          organizationId: org.id
        }
      }),
      prisma.location.create({
        data: {
          name: 'Warehouse A',
          description: 'Raw materials and components storage',
          organizationId: org.id
        }
      }),
      prisma.location.create({
        data: {
          name: 'Warehouse B',
          description: 'Finished goods storage and shipping',
          organizationId: org.id
        }
      }),
      prisma.location.create({
        data: {
          name: 'Utilities & Mechanical',
          description: 'HVAC, electrical, and mechanical systems',
          organizationId: org.id
        }
      }),
      prisma.location.create({
        data: {
          name: 'Office Building',
          description: 'Administrative offices and conference rooms',
          organizationId: org.id
        }
      })
    ]);
    
    const [production, qcLab, warehouseA, warehouseB, utilities, office] = locations;
    
    // Create Suppliers
    console.log('🚛 Creating suppliers...');
    const suppliers = await Promise.all([
      prisma.supplier.create({
        data: {
          name: 'Industrial Supply Co.',
          contactInfo: 'John Smith - purchasing@industrialsupply.com - (555) 123-4567',
          address: '1234 Industrial Blvd, Manufacturing City, NY 12345',
          phone: '(555) 123-4567',
          email: 'purchasing@industrialsupply.com',
          organizationId: org.id
        }
      }),
      prisma.supplier.create({
        data: {
          name: 'MRO Solutions Inc.',
          contactInfo: 'Lisa Martinez - orders@mrosolutions.com - (555) 234-5678',
          address: '5678 Supply Lane, Industrial Park, NY 12346',
          phone: '(555) 234-5678',
          email: 'orders@mrosolutions.com',
          organizationId: org.id
        }
      }),
      prisma.supplier.create({
        data: {
          name: 'TechParts Direct',
          contactInfo: 'David Wong - sales@techpartsdirect.com - (555) 345-6789',
          address: '9012 Component Ave, Tech Valley, NY 12347',
          phone: '(555) 345-6789',
          email: 'sales@techpartsdirect.com',
          organizationId: org.id
        }
      }),
      prisma.supplier.create({
        data: {
          name: 'Fluid Systems Corp',
          contactInfo: 'Angela Brown - service@fluidsystems.com - (555) 456-7890',
          address: '3456 Hydraulic Way, Fluid City, NY 12348',
          phone: '(555) 456-7890',
          email: 'service@fluidsystems.com',
          organizationId: org.id
        }
      })
    ]);
    
    const [industrialSupply, mroSolutions, techParts, fluidSystems] = suppliers;
    
    console.log('📦 Creating inventory items...');
    // Create Parts/Inventory
    const parts = await Promise.all([
      // Production Line Parts
      prisma.part.create({
        data: {
          name: 'V-Belt Drive Belt',
          description: 'Heavy-duty V-belt for production line drives',
          sku: 'VB-HD-001',
          stockLevel: 15,
          reorderPoint: 5,
          unitCost: 45.99,
          location: 'Warehouse A - Section B2',
          organizationId: org.id,
          supplierId: industrialSupply.id
        }
      }),
      prisma.part.create({
        data: {
          name: 'Hydraulic Filter',
          description: 'High-pressure hydraulic system filter',
          sku: 'HF-HP-025',
          stockLevel: 8,
          reorderPoint: 10,
          unitCost: 89.50,
          location: 'Warehouse A - Section C1',
          organizationId: org.id,
          supplierId: fluidSystems.id
        }
      }),
      prisma.part.create({
        data: {
          name: 'Ball Bearing Set',
          description: 'Precision ball bearings for rotating equipment',
          sku: 'BB-PREC-50',
          stockLevel: 25,
          reorderPoint: 8,
          unitCost: 125.00,
          location: 'Warehouse A - Section A3',
          organizationId: org.id,
          supplierId: techParts.id
        }
      }),
      prisma.part.create({
        data: {
          name: 'Motor Oil SAE 30',
          description: 'Premium motor oil for industrial equipment',
          sku: 'OIL-SAE30-5L',
          stockLevel: 45,
          reorderPoint: 15,
          unitCost: 24.99,
          location: 'Warehouse A - Section D1',
          organizationId: org.id,
          supplierId: mroSolutions.id
        }
      }),
      prisma.part.create({
        data: {
          name: 'HVAC Air Filter',
          description: 'High-efficiency air filter for HVAC systems',
          sku: 'AF-HEPA-20x25',
          stockLevel: 32,
          reorderPoint: 12,
          unitCost: 34.95,
          location: 'Warehouse A - Section E2',
          organizationId: org.id,
          supplierId: industrialSupply.id
        }
      }),
      prisma.part.create({
        data: {
          name: 'Control Panel Fuse',
          description: '30A fuses for electrical control panels',
          sku: 'FUSE-30A-CTRL',
          stockLevel: 50,
          reorderPoint: 20,
          unitCost: 8.75,
          location: 'Warehouse A - Section F1',
          organizationId: org.id,
          supplierId: techParts.id
        }
      }),
      prisma.part.create({
        data: {
          name: 'Conveyor Chain Link',
          description: 'Heavy-duty chain links for conveyor systems',
          sku: 'CHAIN-HD-LINK',
          stockLevel: 75,
          reorderPoint: 25,
          unitCost: 12.50,
          location: 'Warehouse A - Section G3',
          organizationId: org.id,
          supplierId: industrialSupply.id
        }
      }),
      prisma.part.create({
        data: {
          name: 'Pneumatic Cylinder Seal',
          description: 'High-pressure seals for pneumatic cylinders',
          sku: 'SEAL-PNEU-HP',
          stockLevel: 18,
          reorderPoint: 6,
          unitCost: 67.25,
          location: 'Warehouse A - Section H2',
          organizationId: org.id,
          supplierId: fluidSystems.id
        }
      })
    ]);
    
    console.log('🏭 Creating manufacturing assets...');
    // Create Assets
    const assets = await Promise.all([
      // Production Equipment
      prisma.asset.create({
        data: {
          name: 'Assembly Line #1',
          description: 'Primary product assembly line with automated stations',
          serialNumber: 'AL-001-2023',
          modelNumber: 'AutoLine-5000',
          manufacturer: 'Production Systems Inc.',
          year: 2023,
          status: 'ONLINE',
          criticality: 'HIGH',
          locationId: production.id,
          organizationId: org.id
        }
      }),
      prisma.asset.create({
        data: {
          name: 'Assembly Line #2',
          description: 'Secondary assembly line for specialized products',
          serialNumber: 'AL-002-2022',
          modelNumber: 'AutoLine-3000',
          manufacturer: 'Production Systems Inc.',
          year: 2022,
          status: 'ONLINE',
          criticality: 'HIGH',
          locationId: production.id,
          organizationId: org.id
        }
      }),
      prisma.asset.create({
        data: {
          name: 'CNC Machining Center',
          description: '5-axis CNC machine for precision parts manufacturing',
          serialNumber: 'CNC-MC-001',
          modelNumber: 'PrecisionMax-500',
          manufacturer: 'Advanced Machining Corp',
          year: 2023,
          status: 'ONLINE',
          criticality: 'HIGH',
          locationId: production.id,
          organizationId: org.id
        }
      }),
      prisma.asset.create({
        data: {
          name: 'Hydraulic Press #1',
          description: '200-ton hydraulic press for metal forming',
          serialNumber: 'HP-200T-001',
          modelNumber: 'HydroForce-200',
          manufacturer: 'Heavy Industries LLC',
          year: 2021,
          status: 'ONLINE',
          criticality: 'MEDIUM',
          locationId: production.id,
          organizationId: org.id
        }
      }),
      prisma.asset.create({
        data: {
          name: 'Quality Control X-Ray Machine',
          description: 'Industrial X-ray inspection system',
          serialNumber: 'XR-QC-001',
          modelNumber: 'InspectPro-2000',
          manufacturer: 'QC Technologies',
          year: 2022,
          status: 'ONLINE',
          criticality: 'MEDIUM',
          locationId: qcLab.id,
          organizationId: org.id
        }
      }),
      prisma.asset.create({
        data: {
          name: 'Forklift #1',
          description: 'Electric forklift for warehouse operations',
          serialNumber: 'FL-E001-2023',
          modelNumber: 'LiftMaster-E300',
          manufacturer: 'Material Handling Co.',
          year: 2023,
          status: 'ONLINE',
          criticality: 'MEDIUM',
          locationId: warehouseA.id,
          organizationId: org.id
        }
      }),
      prisma.asset.create({
        data: {
          name: 'Forklift #2',
          description: 'Propane forklift for heavy-duty operations',
          serialNumber: 'FL-P002-2022',
          modelNumber: 'LiftMaster-P500',
          manufacturer: 'Material Handling Co.',
          year: 2022,
          status: 'ONLINE',
          criticality: 'MEDIUM',
          locationId: warehouseB.id,
          organizationId: org.id
        }
      }),
      prisma.asset.create({
        data: {
          name: 'HVAC Unit - Production',
          description: 'Industrial HVAC system for production floor climate control',
          serialNumber: 'HVAC-PROD-001',
          modelNumber: 'ClimateMax-5000',
          manufacturer: 'Air Systems Corp',
          year: 2022,
          status: 'ONLINE',
          criticality: 'HIGH',
          locationId: utilities.id,
          organizationId: org.id
        }
      }),
      prisma.asset.create({
        data: {
          name: 'Backup Generator',
          description: '500kW diesel backup generator',
          serialNumber: 'GEN-500-001',
          modelNumber: 'PowerMax-500D',
          manufacturer: 'Generator Systems Inc.',
          year: 2021,
          status: 'ONLINE',
          criticality: 'HIGH',
          locationId: utilities.id,
          organizationId: org.id
        }
      }),
      prisma.asset.create({
        data: {
          name: 'Air Compressor System',
          description: 'Central compressed air system for pneumatic tools',
          serialNumber: 'AC-CENT-001',
          modelNumber: 'AirMax-1000',
          manufacturer: 'Compressed Air Solutions',
          year: 2022,
          status: 'OFFLINE',
          criticality: 'HIGH',
          locationId: utilities.id,
          organizationId: org.id
        }
      })
    ]);
    
    console.log('✅ Hudwink Manufacturing demo setup completed!');
    console.log('\\n📊 Summary:');
    console.log(`- Organization: ${org.name}`);
    console.log(`- Users created: ${users.length}`);
    console.log(`- Locations: ${locations.length}`);
    console.log(`- Suppliers: ${suppliers.length}`);
    console.log(`- Parts: ${parts.length}`);
    console.log(`- Assets: ${assets.length}`);
    
    return {
      organization: org,
      users: users,
      locations: locations,
      suppliers: suppliers,
      parts: parts,
      assets: assets
    };
    
  } catch (error) {
    console.error('❌ Demo setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
if (require.main === module) {
  setupHudwinkDemo().catch(console.error);
}

module.exports = { setupHudwinkDemo };