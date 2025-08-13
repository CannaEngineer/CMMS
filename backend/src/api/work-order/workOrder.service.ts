import { PrismaClient, WorkOrderStatus } from '@prisma/client';
import { notificationTriggersService } from '../../services/notification-triggers.service';

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

export const createWorkOrder = async (data: any, organizationId: number, createdById?: number) => {
  const workOrder = await prisma.workOrder.create({ 
    data: {
      ...data,
      organizationId
    }
  });

  // Trigger notification if assigned to someone
  if (workOrder.assignedToId) {
    await notificationTriggersService.onWorkOrderAssigned(
      workOrder.id, 
      workOrder.assignedToId, 
      createdById
    );
  }

  return workOrder;
};

export const updateWorkOrder = async (id: number, data: any, organizationId: number, updatedById?: number) => {
  // Get current work order to check for status changes
  const currentWorkOrder = await prisma.workOrder.findUnique({
    where: { id },
    select: { status: true, assignedToId: true }
  });

  const updatedWorkOrder = await prisma.workOrder.update({
    where: { id, organizationId },
    data,
  });

  // Trigger notifications for status changes
  if (currentWorkOrder && data.status && currentWorkOrder.status !== data.status) {
    await notificationTriggersService.onWorkOrderStatusChange(
      id,
      currentWorkOrder.status as WorkOrderStatus,
      data.status as WorkOrderStatus,
      updatedById
    );
  }

  // Trigger notification for new assignments
  if (currentWorkOrder && data.assignedToId && currentWorkOrder.assignedToId !== data.assignedToId) {
    await notificationTriggersService.onWorkOrderAssigned(
      id,
      data.assignedToId,
      updatedById
    );
  }

  return updatedWorkOrder;
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
