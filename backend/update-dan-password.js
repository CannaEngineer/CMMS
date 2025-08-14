const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function updateDanPassword() {
  try {
    // Find the user
    const user = await prisma.user.findFirst({
      where: { email: 'dan@hudsonhemp.com' }
    });

    if (!user) {
      console.log('User dan@hudsonhemp.com not found');
      return;
    }

    console.log('Found user:', user.email, 'ID:', user.id);

    // Hash the new password
    const hashedPassword = await bcrypt.hash('bigmount', 10);
    
    // Update the password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    console.log('Password updated successfully for dan@hudsonhemp.com');
    
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDanPassword();