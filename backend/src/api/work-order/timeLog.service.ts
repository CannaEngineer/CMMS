import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TimeLogService {
  async logTime(data: {
    workOrderId: number;
    userId: number;
    description: string;
    hours: number;
    category?: string;
    billable?: boolean;
    loggedAt?: Date;
  }) {
    // Create time log entry
    const timeLog = await prisma.workOrderTimeLog.create({
      data: {
        workOrderId: data.workOrderId,
        userId: data.userId,
        description: data.description,
        hours: data.hours,
        category: data.category || 'LABOR',
        billable: data.billable ?? true,
        loggedAt: data.loggedAt || new Date(),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    // Update work order total logged hours
    await this.updateWorkOrderTotalHours(data.workOrderId);
    
    console.log(`⏰ Time logged: ${data.hours}h for WO #${data.workOrderId} by user ${data.userId}`);
    
    return timeLog;
  }

  async getTimeLogsForWorkOrder(workOrderId: number) {
    return prisma.workOrderTimeLog.findMany({
      where: { workOrderId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { loggedAt: 'desc' }
    });
  }

  async updateTimeLog(timeLogId: number, userId: number, data: {
    description?: string;
    hours?: number;
    category?: string;
    billable?: boolean;
  }) {
    const timeLog = await prisma.workOrderTimeLog.update({
      where: { id: timeLogId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Recalculate total hours for the work order
    await this.updateWorkOrderTotalHours(timeLog.workOrderId);
    
    console.log(`⏰ Time log updated: ${timeLog.hours}h for WO #${timeLog.workOrderId}`);
    
    return timeLog;
  }

  async deleteTimeLog(timeLogId: number, userId: number) {
    const timeLog = await prisma.workOrderTimeLog.findUnique({
      where: { id: timeLogId }
    });

    if (!timeLog) {
      throw new Error('Time log not found');
    }

    // Check if user can delete this log (own logs or admin)
    // This would be enhanced with proper permission checking
    if (timeLog.userId !== userId) {
      throw new Error('Unauthorized to delete this time log');
    }

    await prisma.workOrderTimeLog.delete({
      where: { id: timeLogId }
    });

    // Recalculate total hours for the work order
    await this.updateWorkOrderTotalHours(timeLog.workOrderId);
    
    console.log(`🗑️ Time log deleted: ${timeLog.hours}h for WO #${timeLog.workOrderId}`);
    
    return { success: true };
  }

  async updateWorkOrderTotalHours(workOrderId: number) {
    const result = await prisma.workOrderTimeLog.aggregate({
      where: { workOrderId },
      _sum: { hours: true }
    });
    
    const totalHours = result._sum.hours || 0;

    await prisma.workOrder.update({
      where: { id: workOrderId },
      data: { 
        totalLoggedHours: totalHours,
        // Auto-update started/completed timestamps
        startedAt: totalHours > 0 ? await this.getFirstLogDate(workOrderId) : null,
        updatedAt: new Date()
      }
    });

    return totalHours;
  }

  private async getFirstLogDate(workOrderId: number): Promise<Date | null> {
    const firstLog = await prisma.workOrderTimeLog.findFirst({
      where: { workOrderId },
      orderBy: { loggedAt: 'asc' },
      select: { loggedAt: true }
    });

    return firstLog?.loggedAt || null;
  }

  async getTimeReports(filters: {
    workOrderId?: number;
    userId?: number;
    startDate?: Date;
    endDate?: Date;
    organizationId?: number;
  }) {
    const where: any = {};

    if (filters.workOrderId) where.workOrderId = filters.workOrderId;
    if (filters.userId) where.userId = filters.userId;
    
    if (filters.startDate || filters.endDate) {
      where.loggedAt = {};
      if (filters.startDate) where.loggedAt.gte = filters.startDate;
      if (filters.endDate) where.loggedAt.lte = filters.endDate;
    }

    // If organization filter is provided, join through work order
    if (filters.organizationId) {
      where.workOrder = { organizationId: filters.organizationId };
    }

    const timeLogs = await prisma.workOrderTimeLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        workOrder: { select: { id: true, title: true, status: true } }
      },
      orderBy: { loggedAt: 'desc' }
    });

    // Calculate summary statistics
    const totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);
    const billableHours = timeLogs.filter(log => log.billable).reduce((sum, log) => sum + log.hours, 0);
    const uniqueUsers = new Set(timeLogs.map(log => log.userId)).size;
    const uniqueWorkOrders = new Set(timeLogs.map(log => log.workOrderId)).size;

    return {
      timeLogs,
      summary: {
        totalHours,
        billableHours,
        nonBillableHours: totalHours - billableHours,
        uniqueUsers,
        uniqueWorkOrders,
        averageHoursPerLog: timeLogs.length > 0 ? totalHours / timeLogs.length : 0
      }
    };
  }

  async getWorkOrderTimeStats(workOrderId: number) {
    const timeLogs = await this.getTimeLogsForWorkOrder(workOrderId);
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: { 
        estimatedHours: true, 
        totalLoggedHours: true,
        startedAt: true,
        completedAt: true 
      }
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    const totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);
    const billableHours = timeLogs.filter(log => log.billable).reduce((sum, log) => sum + log.hours, 0);
    
    // Calculate time by category
    const timeByCategory = timeLogs.reduce((acc, log) => {
      const category = log.category || 'OTHER';
      acc[category] = (acc[category] || 0) + log.hours;
      return acc;
    }, {} as Record<string, number>);

    // Calculate variance if estimated hours exist
    const variance = workOrder.estimatedHours ? 
      ((totalHours - workOrder.estimatedHours) / workOrder.estimatedHours) * 100 : null;

    return {
      totalHours,
      billableHours,
      nonBillableHours: totalHours - billableHours,
      estimatedHours: workOrder.estimatedHours,
      variance,
      timeByCategory,
      logCount: timeLogs.length,
      uniqueUsers: new Set(timeLogs.map(log => log.userId)).size,
      firstLoggedAt: workOrder.startedAt,
      lastLoggedAt: timeLogs[0]?.loggedAt || null
    };
  }
}