const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function updatePassword() {
  try {
    console.log('Updating Hudson Cannabis admin password...');

    // Find the admin user
    const adminUser = await prisma.user.findFirst({
      where: { 
        email: 'dan@hudsonhemp.com'
      }
    });

    if (!adminUser) {
      console.error('❌ Admin user not found');
      return;
    }

    console.log('✓ Found admin user:', {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role
    });

    // Hash new password
    const newPassword = 'Hudson2024!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { password: hashedPassword }
    });

    console.log('✅ Password updated successfully!');
    console.log('Login credentials:');
    console.log('  Email: dan@hudsonhemp.com');
    console.log('  Password: Hudson2024!');

  } catch (error) {
    console.error('Error updating password:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updatePassword();