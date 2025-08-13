const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createHudsonCannabisAdmin() {
  try {
    console.log('Creating Hudson Cannabis organization and admin user...');

    // Check if organization already exists
    let organization = await prisma.organization.findFirst({
      where: { name: 'Hudson Cannabis' }
    });

    if (!organization) {
      // Create Hudson Cannabis organization
      organization = await prisma.organization.create({
        data: {
          name: 'Hudson Cannabis',
          settings: {
            contactEmail: 'info@hudsoncannabis.com',
            address: '67 Pinewood Rd Hudson NY 12534',
            phone: '518-828-4718',
            website: 'https://hudsoncannabis.com',
            timezone: 'America/New_York'
          }
        }
      });
      console.log('✓ Created Hudson Cannabis organization:', organization);
    } else {
      console.log('✓ Hudson Cannabis organization already exists:', organization);
    }

    // Check if admin user already exists
    let adminUser = await prisma.user.findFirst({
      where: { 
        email: 'dan@hudsonhemp.com',
        organizationId: organization.id
      }
    });

    if (!adminUser) {
      // Hash password
      const hashedPassword = await bcrypt.hash('Hudson2024!', 10);

      // Create admin user
      adminUser = await prisma.user.create({
        data: {
          name: 'Dan Crawford',
          email: 'dan@hudsonhemp.com',
          password: hashedPassword,
          role: 'ADMIN',
          organizationId: organization.id
        }
      });
      console.log('✓ Created admin user:', {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        organizationId: adminUser.organizationId
      });
    } else {
      console.log('✓ Admin user already exists:', {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        organizationId: adminUser.organizationId
      });
    }

    // Create a default "General" location for the organization if it doesn't exist
    let generalLocation = await prisma.location.findFirst({
      where: {
        name: 'General',
        organizationId: organization.id
      }
    });

    if (!generalLocation) {
      generalLocation = await prisma.location.create({
        data: {
          name: 'General',
          description: 'Default location for Hudson Cannabis assets',
          organizationId: organization.id,
          address: '67 Pinewood Rd Hudson NY 12534'
        }
      });
      console.log('✓ Created General location:', generalLocation);
    } else {
      console.log('✓ General location already exists');
    }

    console.log('\n🎉 Setup complete!');
    console.log('Organization ID:', organization.id);
    console.log('Admin User ID:', adminUser.id);
    console.log('Login credentials:');
    console.log('  Email: dan@hudsonhemp.com');
    console.log('  Password: Hudson2024!');
    console.log('  Role: ADMIN');

  } catch (error) {
    console.error('Error creating Hudson Cannabis admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createHudsonCannabisAdmin();