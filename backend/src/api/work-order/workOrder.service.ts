import { WorkOrderStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { notificationTriggersService } from '../../services/notification-triggers.service';
import { NotificationService } from '../notification/notification.service';
const notificationService = new NotificationService();

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
const reschedulePMSchedule = async (pmScheduleId: number, pmSchedule: any, completionDate: Date, updatedById?: number) => {
  console.log(`Rescheduling PM Schedule ${pmScheduleId} with frequency: ${pmSchedule.frequency}`);
  
  // Send notification that we're creating the next PM work order
  const managersAndAdmins = await prisma.user.findMany({
    where: {
      organizationId: pmSchedule.asset?.organizationId || 1,
      role: {
        in: ['MANAGER', 'ADMIN', 'TECHNICIAN']
      }
    }
  });

  // Send "creating" notifications
  for (const user of managersAndAdmins) {
    await notificationService.createNotification({
      userId: user.id,
      organizationId: pmSchedule.asset?.organizationId || 1,
      title: 'Creating PM Work Order',
      message: `Creating next work order for PM schedule "${pmSchedule.title}"...`,
      type: 'INFO',
      priority: 'LOW',
      category: 'MAINTENANCE',
      relatedEntityType: 'pmSchedule',
      relatedEntityId: pmScheduleId,
      channels: ['IN_APP'],
      createdById: updatedById
    });
  }
  
  // Calculate the next due date based on frequency FROM THE COMPLETION DATE
  const nextDue = calculateNextDueDate(pmSchedule.frequency, completionDate);
  
  // Update PM schedule next due date
  const updatedPM = await prisma.pMSchedule.update({
    where: { id: pmScheduleId },
    data: { nextDue },
    include: {
      asset: { select: { name: true, organizationId: true } }
    }
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
  
  // Create the next work order immediately
  const workOrderTitle = `${updatedPM.title} - ${updatedPM.asset?.name || 'Asset'}`;
  
  const nextWorkOrder = await prisma.workOrder.create({
    data: {
      title: workOrderTitle,
      description: updatedPM.description || `Preventive maintenance for ${updatedPM.asset?.name}`,
      status: 'OPEN',
      priority: 'MEDIUM', // Default priority, could be inherited from PM
      dueDate: nextDue,
      assetId: updatedPM.assetId,
      assignedToId: null, // Will need to be assigned later, or inherit from PM settings
      pmScheduleId: pmScheduleId,
      organizationId: updatedPM.asset?.organizationId || 1,
      estimatedHours: null, // Could be inherited from PM settings
    },
  });
  
  console.log(`PM Schedule ${pmScheduleId} rescheduled for ${nextDue.toISOString()}`);
  console.log(`Created next work order ${nextWorkOrder.id} for PM ${pmScheduleId}`);
  
  // Send notification with link to the new work order
  for (const user of managersAndAdmins) {
    await notificationService.createNotification({
      userId: user.id,
      organizationId: updatedPM.asset?.organizationId || 1,
      title: 'PM Work Order Created',
      message: `New work order "${nextWorkOrder.title}" created for PM schedule "${pmSchedule.title}". Due date: ${nextDue.toLocaleDateString()}`,
      type: 'SUCCESS',
      priority: 'MEDIUM',
      category: 'MAINTENANCE',
      relatedEntityType: 'workOrder',
      relatedEntityId: nextWorkOrder.id,
      actionUrl: `/work-orders/${nextWorkOrder.id}`,
      actionLabel: 'View Work Order',
      channels: ['IN_APP'],
      createdById: updatedById
    });
  }
  
  return { 
    nextDue, 
    nextWorkOrderId: nextWorkOrder.id,
    nextWorkOrderTitle: nextWorkOrder.title
  };
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
        // Use the completion date (now) as the basis for the next schedule
        const completionDate = new Date();
        await reschedulePMSchedule(currentWorkOrder.pmScheduleId, currentWorkOrder.pmSchedule, completionDate, updatedById);
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
