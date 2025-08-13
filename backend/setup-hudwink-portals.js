const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupHudwinkPortals() {
  console.log('🌐 Setting up Hudwink Manufacturing Portals...\n');
  
  try {
    // Get the organization
    const org = await prisma.organization.findFirst({
      where: { name: 'Hudwink Manufacturing' }
    });
    
    if (!org) {
      throw new Error('Hudwink Manufacturing organization not found. Run setup-hudwink-demo.js first.');
    }
    
    // Create Maintenance Request Portal
    console.log('📋 Creating maintenance request portal...');
    const maintenancePortal = await prisma.portal.create({
      data: {
        name: 'Hudwink Maintenance Request Portal',
        description: 'Submit maintenance requests and report equipment issues',
        type: 'MAINTENANCE_REQUEST',
        status: 'ACTIVE',
        slug: 'hudwink-maintenance',
        organizationId: org.id,
        isActive: true,
        allowAnonymous: false,
        requiresApproval: false,
        autoCreateWorkOrders: true,
        maxSubmissionsPerDay: 50,
        publicUrl: 'http://localhost:5173/portal/hudwink-maintenance',
        qrEnabled: true,
        primaryColor: '#1976d2',
        secondaryColor: '#ffffff',
        accentColor: '#ff4081',
        notificationEmails: JSON.stringify(['manager@hudwink.com', 'admin@hudwink.com']),
        autoResponderEnabled: true,
        autoResponderMessage: 'Thank you for submitting a maintenance request. Our team will review and respond within 2 business hours.',
        rateLimitEnabled: true,
        rateLimitRequests: 20,
        rateLimitWindow: 3600
      }
    });
    
    // Create portal fields for maintenance request
    const maintenanceFields = await Promise.all([
      prisma.portalField.create({
        data: {
          portalId: maintenancePortal.id,
          name: 'requestor_name',
          label: 'Your Name',
          type: 'TEXT',
          orderIndex: 0,
          isRequired: true,
          placeholder: 'Enter your full name',
          helpText: 'This helps us contact you about the request'
        }
      }),
      prisma.portalField.create({
        data: {
          portalId: maintenancePortal.id,
          name: 'requestor_email',
          label: 'Email Address',
          type: 'EMAIL',
          orderIndex: 1,
          isRequired: true,
          placeholder: 'your.email@hudwink.com'
        }
      }),
      prisma.portalField.create({
        data: {
          portalId: maintenancePortal.id,
          name: 'issue_title',
          label: 'Issue Title',
          type: 'TEXT',
          orderIndex: 2,
          isRequired: true,
          placeholder: 'Brief description of the problem',
          helpText: 'Keep it concise but descriptive'
        }
      }),
      prisma.portalField.create({
        data: {
          portalId: maintenancePortal.id,
          name: 'issue_description',
          label: 'Detailed Description',
          type: 'TEXTAREA',
          orderIndex: 3,
          isRequired: true,
          placeholder: 'Provide detailed information about the issue, including what you observed, when it started, and any error messages',
          helpText: 'The more detail you provide, the faster we can resolve the issue'
        }
      }),
      prisma.portalField.create({
        data: {
          portalId: maintenancePortal.id,
          name: 'location',
          label: 'Location',
          type: 'LOCATION',
          orderIndex: 4,
          isRequired: true,
          helpText: 'Where is the equipment or issue located?'
        }
      }),
      prisma.portalField.create({
        data: {
          portalId: maintenancePortal.id,
          name: 'priority',
          label: 'Priority Level',
          type: 'PRIORITY',
          orderIndex: 5,
          isRequired: true,
          helpText: 'How urgent is this issue?'
        }
      }),
      prisma.portalField.create({
        data: {
          portalId: maintenancePortal.id,
          name: 'equipment_affected',
          label: 'Equipment Affected',
          type: 'TEXT',
          orderIndex: 6,
          isRequired: false,
          placeholder: 'e.g., Assembly Line #1, CNC Machine, Forklift #2',
          helpText: 'If known, specify which equipment is affected'
        }
      }),
      prisma.portalField.create({
        data: {
          portalId: maintenancePortal.id,
          name: 'safety_concern',
          label: 'Safety Concern?',
          type: 'CHECKBOX',
          orderIndex: 7,
          isRequired: false,
          helpText: 'Check this box if the issue poses a safety risk'
        }
      }),
      prisma.portalField.create({
        data: {
          portalId: maintenancePortal.id,
          name: 'photos',
          label: 'Photos',
          type: 'IMAGE',
          orderIndex: 8,
          isRequired: false,
          helpText: 'Upload photos of the issue if helpful'
        }
      })
    ]);
    
    // Create Equipment Registration Portal
    console.log('🏭 Creating equipment registration portal...');
    const equipmentPortal = await prisma.portal.create({
      data: {
        name: 'Hudwink Equipment Registration',
        description: 'Register new equipment and assets for maintenance tracking',
        type: 'ASSET_REGISTRATION',
        status: 'ACTIVE',
        slug: 'hudwink-equipment',
        organizationId: org.id,
        isActive: true,
        allowAnonymous: false,
        requiresApproval: true,
        autoCreateWorkOrders: false,
        maxSubmissionsPerDay: 10,
        publicUrl: 'http://localhost:5173/portal/hudwink-equipment',
        qrEnabled: true,
        primaryColor: '#4caf50',
        secondaryColor: '#ffffff',
        accentColor: '#ff9800',
        notificationEmails: JSON.stringify(['admin@hudwink.com']),
        autoResponderEnabled: true,
        autoResponderMessage: 'Equipment registration received. Our team will review and add the equipment to our maintenance system.',
        rateLimitEnabled: true,
        rateLimitRequests: 10,
        rateLimitWindow: 3600
      }
    });
    
    // Create portal fields for equipment registration
    const equipmentFields = await Promise.all([
      prisma.portalField.create({
        data: {
          portalId: equipmentPortal.id,
          name: 'equipment_name',
          label: 'Equipment Name',
          type: 'TEXT',
          orderIndex: 0,
          isRequired: true,
          placeholder: 'e.g., Assembly Line #3, Packaging Machine'
        }
      }),
      prisma.portalField.create({
        data: {
          portalId: equipmentPortal.id,
          name: 'manufacturer',
          label: 'Manufacturer',
          type: 'TEXT',
          orderIndex: 1,
          isRequired: true,
          placeholder: 'Equipment manufacturer name'
        }
      }),
      prisma.portalField.create({
        data: {
          portalId: equipmentPortal.id,
          name: 'model_number',
          label: 'Model Number',
          type: 'TEXT',
          orderIndex: 2,
          isRequired: true,
          placeholder: 'Model/part number from nameplate'
        }
      }),
      prisma.portalField.create({
        data: {
          portalId: equipmentPortal.id,
          name: 'serial_number',
          label: 'Serial Number',
          type: 'TEXT',
          orderIndex: 3,
          isRequired: false,
          placeholder: 'Serial number if available'
        }
      }),
      prisma.portalField.create({
        data: {
          portalId: equipmentPortal.id,
          name: 'installation_location',
          label: 'Installation Location',
          type: 'LOCATION',
          orderIndex: 4,
          isRequired: true,
          helpText: 'Where will this equipment be installed?'
        }
      }),
      prisma.portalField.create({
        data: {
          portalId: equipmentPortal.id,
          name: 'purchase_date',
          label: 'Purchase Date',
          type: 'DATE',
          orderIndex: 5,
          isRequired: false,
          helpText: 'When was this equipment purchased?'
        }
      }),
      prisma.portalField.create({
        data: {
          portalId: equipmentPortal.id,
          name: 'criticality',
          label: 'Equipment Criticality',
          type: 'SELECT',
          orderIndex: 6,
          isRequired: true,
          options: ['HIGH', 'MEDIUM', 'LOW'],
          helpText: 'How critical is this equipment to operations?'
        }
      }),
      prisma.portalField.create({
        data: {
          portalId: equipmentPortal.id,
          name: 'description',
          label: 'Equipment Description',
          type: 'TEXTAREA',
          orderIndex: 7,
          isRequired: true,
          placeholder: 'Detailed description of the equipment and its function',
          helpText: 'Include purpose, capacity, and any special requirements'
        }
      })
    ]);
    
    console.log('✅ Hudwink Manufacturing portals setup completed!');
    console.log('\\n📊 Summary:');
    console.log(`- Portals created: 2`);
    console.log(`- Maintenance Portal Fields: ${maintenanceFields.length}`);
    console.log(`- Equipment Portal Fields: ${equipmentFields.length}`);
    console.log(`\\nPortal URLs:`);
    console.log(`- Maintenance: ${maintenancePortal.publicUrl}`);
    console.log(`- Equipment: ${equipmentPortal.publicUrl}`);
    
    return {
      maintenancePortal,
      equipmentPortal,
      maintenanceFields,
      equipmentFields
    };
    
  } catch (error) {
    console.error('❌ Portals setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
if (require.main === module) {
  setupHudwinkPortals().catch(console.error);
}

module.exports = { setupHudwinkPortals };