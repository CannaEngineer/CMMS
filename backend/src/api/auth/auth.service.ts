
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const register = async (data: any) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  // Check if this is the first user ever (superuser case)
  const userCount = await prisma.user.count();
  const isSuperUser = userCount === 0;
  
  let organizationId = data.organizationId;
  
  // If no organizationId provided or this is a new admin signup, create new organization
  if (!organizationId || data.createOrganization) {
    const organizationName = data.organizationName || `${data.name}'s Organization`;
    
    const organization = await prisma.organization.create({
      data: {
        name: organizationName,
        settings: {
          timezone: 'America/New_York',
          dateFormat: 'MM/DD/YYYY',
          currency: 'USD'
        }
      }
    });
    
    organizationId = organization.id;
  }
  
  // Determine user role based on context
  let userRole = data.role || 'TECHNICIAN'; // Default role
  
  // If creating new organization, user becomes ADMIN
  if (data.createOrganization || !data.organizationId) {
    userRole = 'ADMIN';
  }
  
  // Create the user
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: userRole,
      organizationId: organizationId,
    },
    include: {
      organization: true
    }
  });
  
  // Return user without password
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const login = async (data: any) => {
  console.log("Login attempt for email:", data.email);
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) {
    console.log("User not found for email:", data.email);
    throw new Error('User not found');
  }

  console.log("User found. Comparing passwords...");
  console.log("Provided password (DEBUG ONLY):", data.password);
  console.log("Stored hashed password (DEBUG ONLY):", user.password);

  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  console.log("Password comparison result:", isPasswordValid);

  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: '1h',
  });

  return { user, token };
};
