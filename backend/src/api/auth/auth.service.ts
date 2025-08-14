
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const register = async (data: any) => {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });
    
    if (existingUser) {
      throw new Error('An account with this email already exists. Please try signing in instead.');
    }

    // Check if organization name is taken when creating new organization
    if (data.createOrganization && data.organizationName) {
      // Use the same approach as checkOrganizationExists for SQLite compatibility
      const organizations = await prisma.organization.findMany({
        select: { name: true }
      });
      
      const nameExists = organizations.some(org => 
        org.name.toLowerCase() === data.organizationName.toLowerCase()
      );
      
      if (nameExists) {
        throw new Error('An organization with this name already exists. Please choose a different name.');
      }
    }

    // Check if joining existing organization and validate organizationId
    if (!data.createOrganization && data.organizationId) {
      const organization = await prisma.organization.findUnique({
        where: { id: data.organizationId }
      });
      
      if (!organization) {
        throw new Error('The organization you\'re trying to join does not exist. Please check the organization details.');
      }
    }

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
  } catch (error) {
    // Re-throw the error with clean message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Registration failed. Please try again later.');
  }
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

// Check if email exists
export const checkEmailExists = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });
  return !!user;
};

// Check if organization exists
export const checkOrganizationExists = async (name: string) => {
  try {
    // Use a simple case-sensitive query for SQLite compatibility
    // We'll manually handle case-insensitive matching
    const organizations = await prisma.organization.findMany({
      select: { name: true }
    });
    
    // Check if any organization name matches case-insensitively
    const nameExists = organizations.some(org => 
      org.name.toLowerCase() === name.toLowerCase()
    );
    
    return nameExists;
  } catch (error) {
    console.error('Error checking organization existence:', error);
    // Return false on error (assume available) rather than throwing
    return false;
  }
};
