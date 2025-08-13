import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const getOrganizationById = async (organizationId: number) => {
  return prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      _count: {
        select: {
          users: true,
          assets: true,
          locations: true,
          workOrders: true,
        }
      }
    }
  });
};

export const updateOrganization = async (organizationId: number, data: any) => {
  return prisma.organization.update({
    where: { id: organizationId },
    data: {
      name: data.name,
      settings: data.settings,
    }
  });
};

export const getOrganizationUsers = async (organizationId: number) => {
  return prisma.user.findMany({
    where: { organizationId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'asc' }
  });
};

export const getUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email }
  });
};

export const createUserInvitation = async (data: {
  email: string;
  name: string;
  role: string;
  organizationId: number;
  invitedById: number;
}) => {
  // For now, directly create the user with a temporary password
  // In production, you'd send an email invitation with a secure token
  const tempPassword = Math.random().toString(36).slice(-8) + 'Temp!';
  const hashedPassword = await bcrypt.hash(tempPassword, 10);
  
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: hashedPassword,
      role: data.role as any,
      organizationId: data.organizationId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    }
  });
  
  // Return user info with temporary password (in production, this would be sent via email)
  return {
    user,
    tempPassword,
    message: 'User created successfully. Please provide them with the temporary password to log in.'
  };
};

export const removeUserFromOrganization = async (userId: number, organizationId: number) => {
  // Verify user belongs to the organization
  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId }
  });
  
  if (!user) {
    throw new Error('User not found in this organization');
  }
  
  // In production, you might want to anonymize data instead of hard delete
  return prisma.user.delete({
    where: { id: userId }
  });
};

export const updateUserRole = async (userId: number, role: string, organizationId: number) => {
  // Verify user belongs to the organization
  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId }
  });
  
  if (!user) {
    throw new Error('User not found in this organization');
  }
  
  return prisma.user.update({
    where: { id: userId },
    data: { role: role as any },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      updatedAt: true,
    }
  });
};