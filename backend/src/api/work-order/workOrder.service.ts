import { PrismaClient, WorkOrderStatus } from '@prisma/client';
import { notificationTriggersService } from '../../services/notification-triggers.service';

const prisma = new PrismaClient();

// Helper function to calculate next PM due date based on frequency
const calculateNextDueDate = (frequency: string, fromDate?: Date): Date => {
  const now = fromDate || new Date();
  
  switch (frequency.toLowerCase()) {
    case 'daily':
      return new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000));
    case 'weekly':
      return new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    case 'monthly':
      const monthly = new Date(now);
      monthly.setMonth(monthly.getMonth() + 1);
      return monthly;
    case 'quarterly':
      const quarterly = new Date(now);
      quarterly.setMonth(quarterly.getMonth() + 3);
      return quarterly;
    case 'yearly':
      const yearly = new Date(now);
      yearly.setFullYear(yearly.getFullYear() + 1);
      return yearly;
    default:
      // Default to monthly if frequency is not recognized
      const defaultDate = new Date(now);
      defaultDate.setMonth(defaultDate.getMonth() + 1);
      return defaultDate;
  }
};

// Function to reschedule PM schedule after work order completion
const reschedulePMSchedule = async (pmScheduleId: number, pmSchedule: any) => {
  console.log(`Rescheduling PM Schedule ${pmScheduleId} with frequency: ${pmSchedule.frequency}`);
  
  // Calculate the next due date based on frequency
  const nextDue = calculateNextDueDate(pmSchedule.frequency);
  
  // Update PM schedule next due date
  await prisma.pMSchedule.update({
    where: { id: pmScheduleId },
    data: { nextDue }
  });
  
  // Update associated triggers
  if (pmSchedule.triggers && pmSchedule.triggers.length > 0) {
    await Promise.all(
      pmSchedule.triggers.map((trigger: any) =>
        prisma.pMTrigger.update({
          where: { id: trigger.id },
          data: { nextDue }
        })
      )
    );
  }
  
  console.log(`PM Schedule ${pmScheduleId} rescheduled for ${nextDue.toISOString()}`);
  return { nextDue };
};

export const getAllWorkOrders = async (organizationId: number) => {
  return prisma.workOrder.findMany({
    where: {
      organizationId,
    },
    include: { asset: true, assignedTo: true },
  });
};

export const getWorkOrdersByAssetId = async (assetId: number, organizationId: number) => {
  return prisma.workOrder.findMany({
    where: {
      assetId,
      organizationId,
    },
    include: { asset: true, assignedTo: true },
    orderBy: { createdAt: 'desc' },
  });
};

export const getWorkOrderById = async (id: number, organizationId: number) => {
  return prisma.workOrder.findFirst({
    where: { 
      id,
      organizationId 
    },
    include: { asset: true, assignedTo: true },
    // Include all fields including attachments
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
  // Get current work order to check for status changes and PM association
  const currentWorkOrder = await prisma.workOrder.findUnique({
    where: { id },
    select: { 
      status: true, 
      assignedToId: true, 
      pmScheduleId: true,
      pmSchedule: {
        include: {
          triggers: true
        }
      }
    }
  });

  const updatedWorkOrder = await prisma.workOrder.update({
    where: { id, organizationId },
    data,
  });

  // Trigger notifications for status changes
  if (currentWorkOrder && data.status && currentWorkOrder.status !== data.status) {
    await notificationTriggersService.onWorkOrderStatusChanged(
      id,
      currentWorkOrder.status as WorkOrderStatus,
      data.status as WorkOrderStatus,
      updatedById
    );

    // If work order is completed and associated with a PM schedule, reschedule the next PM
    if (data.status === 'COMPLETED' && currentWorkOrder.pmScheduleId && currentWorkOrder.pmSchedule) {
      try {
        await reschedulePMSchedule(currentWorkOrder.pmScheduleId, currentWorkOrder.pmSchedule);
        console.log(`PM Schedule ${currentWorkOrder.pmScheduleId} rescheduled after work order completion`);
      } catch (error) {
        console.error(`Failed to reschedule PM Schedule ${currentWorkOrder.pmScheduleId}:`, error);
        // Don't fail the work order update if PM rescheduling fails
      }
    }
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
