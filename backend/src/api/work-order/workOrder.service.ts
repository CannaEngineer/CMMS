import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllWorkOrders = async (organizationId: number) => {
  return prisma.workOrder.findMany({
    where: {
      organizationId,
    },
    include: { asset: true, assignedTo: true },
  });
};

export const getWorkOrderById = async (id: number, organizationId: number) => {
  return prisma.workOrder.findFirst({
    where: { 
      id,
      organizationId 
    },
    include: { asset: true, assignedTo: true },
  });
};

export const createWorkOrder = async (data: any, organizationId: number) => {
  return prisma.workOrder.create({ 
    data: {
      ...data,
      organizationId
    }
  });
};

export const updateWorkOrder = async (id: number, data: any, organizationId: number) => {
  return prisma.workOrder.update({
    where: { id, organizationId },
    data,
  });
};

export const deleteWorkOrder = async (id: number, organizationId: number) => {
  return prisma.workOrder.delete({ 
    where: { id, organizationId } 
  });
};

export const getRecentWorkOrders = async (organizationId: number, limit: number = 10) => {
  return prisma.workOrder.findMany({
    where: { organizationId },
    include: {
      asset: {
        select: {
          name: true,
        },
      },
      assignedTo: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};
