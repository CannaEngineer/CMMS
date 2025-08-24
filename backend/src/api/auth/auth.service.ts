
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
    
    // Send email verification
    try {
      await sendEmailVerification(user.id);
      console.log(`✅ Email verification sent to ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return { 
      ...userWithoutPassword, 
      requiresEmailVerification: !user.emailVerified 
    };
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

// Token utility functions
const generateSecureToken = (): string => {
  return require('crypto').randomBytes(32).toString('hex');
};

const getTokenExpiry = (hours: number = 24): Date => {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  return expiry;
};

// Email verification functions
export const sendEmailVerification = async (userId: number): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, emailVerified: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      throw new Error('Email is already verified');
    }

    // Generate verification token
    const verificationToken = generateSecureToken();
    const verificationExpires = getTokenExpiry(24); // 24 hours

    // Update user with verification token
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      },
    });

    // Send verification email
    const { emailService } = require('../../services/email.service');
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}`;

    const success = await emailService.sendEmailVerificationEmail(
      user.email,
      user.name,
      verificationUrl
    );

    return success;
  } catch (error) {
    console.error('Error sending email verification:', error);
    throw error;
  }
};

export const verifyEmail = async (token: string): Promise<{ user: any }> => {
  try {
    // Find user with valid verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date(),
        },
      },
      include: {
        organization: {
          select: { id: true, name: true }
        }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    // Mark email as verified and clear verification token
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
      include: {
        organization: {
          select: { id: true, name: true }
        }
      }
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;

    return { user: userWithoutPassword };
  } catch (error) {
    console.error('Error verifying email:', error);
    throw error;
  }
};

// Password reset functions
export const initiatePasswordReset = async (email: string): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return true;
    }

    // Generate reset token
    const resetToken = generateSecureToken();
    const resetExpires = getTokenExpiry(1); // 1 hour

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // Send reset email
    const { emailService } = require('../../services/email.service');
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    const success = await emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetUrl
    );

    return success;
  } catch (error) {
    console.error('Error initiating password reset:', error);
    // Don't throw error to prevent email enumeration
    return false;
  }
};

export const resetPassword = async (token: string, newPassword: string): Promise<{ user: any }> => {
  try {
    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
      include: {
        organization: {
          select: { id: true, name: true }
        }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
      include: {
        organization: {
          select: { id: true, name: true }
        }
      }
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;

    return { user: userWithoutPassword };
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};
