import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllWorkOrders = async () => {
  return prisma.workOrder.findMany({
    include: { asset: true, assignedTo: true },
  });
};

export const getWorkOrderById = async (id: number) => {
  return prisma.workOrder.findUnique({
    where: { id },
    include: { asset: true, assignedTo: true },
  });
};

export const createWorkOrder = async (data: any) => {
  return prisma.workOrder.create({ data });
};

export const updateWorkOrder = async (id: number, data: any) => {
  return prisma.workOrder.update({
    where: { id },
    data,
  });
};

export const deleteWorkOrder = async (id: number) => {
  return prisma.workOrder.delete({ where: { id } });
};
