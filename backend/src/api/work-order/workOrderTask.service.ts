import { TaskCompletionStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';

// Prisma client imported from singleton

export class WorkOrderTaskService {
  async getTasksByWorkOrder(workOrderId: number) {
    return prisma.workOrderTask.findMany({
      where: { workOrderId },
      include: {
        pmTask: true,
        completedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        signedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { orderIndex: 'asc' }
    });
  }

  async createWorkOrderTask(data: {
    workOrderId: number;
    title: string;
    description?: string;
    procedure?: string;
    orderIndex: number;
    pmTaskId?: number;
    estimatedMinutes?: number;
    safetyRequirements?: string;
    toolsRequired?: string;
    partsRequired?: string;
  }) {
    return prisma.workOrderTask.create({
      data: {
        ...data,
        status: 'NOT_STARTED'
      }
    });
  }

  async createTasksFromPMSchedule(workOrderId: number, pmScheduleId: number) {
    // Get all tasks linked to the PM schedule
    const pmScheduleTasks = await prisma.pMScheduleTask.findMany({
      where: { pmScheduleId },
      include: { pmTask: true },
      orderBy: { orderIndex: 'asc' }
    });

    // Create work order tasks based on PM tasks
    const workOrderTasks = await prisma.$transaction(
      pmScheduleTasks.map((scheduleTask, index) =>
        prisma.workOrderTask.create({
          data: {
            workOrderId,
            pmTaskId: scheduleTask.pmTaskId,
            title: scheduleTask.pmTask.title,
            description: scheduleTask.pmTask.description,
            procedure: scheduleTask.pmTask.procedure,
            orderIndex: scheduleTask.orderIndex,
            // estimatedMinutes: scheduleTask.pmTask.estimatedMinutes,
            // safetyRequirements: scheduleTask.pmTask.safetyRequirements,
            // toolsRequired: scheduleTask.pmTask.toolsRequired,
            // partsRequired: scheduleTask.pmTask.partsRequired,
            status: 'NOT_STARTED'
          }
        })
      )
    );

    return workOrderTasks;
  }

  async updateTaskStatus(
    taskId: number,
    userId: number,
    data: {
      status: TaskCompletionStatus;
      notes?: string;
      actualMinutes?: number;
    }
  ) {
    const updateData: any = {
      status: data.status,
      notes: data.notes,
      actualMinutes: data.actualMinutes
    };

    // Set completion data based on status
    if (data.status === 'COMPLETED') {
      updateData.completedById = userId;
      updateData.completedAt = new Date();
    } else if (data.status === 'IN_PROGRESS' && !updateData.completedById) {
      updateData.completedById = userId; // Track who started it
    }

    return prisma.workOrderTask.update({
      where: { id: taskId },
      data: updateData
    });
  }

  async signOffTask(taskId: number, supervisorId: number) {
    return prisma.workOrderTask.update({
      where: { id: taskId },
      data: {
        signedById: supervisorId,
        signedAt: new Date()
      }
    });
  }

  async deleteWorkOrderTask(taskId: number) {
    return prisma.workOrderTask.delete({
      where: { id: taskId }
    });
  }

  async reorderTasks(workOrderId: number, taskOrders: { taskId: number; orderIndex: number }[]) {
    const updates = taskOrders.map(({ taskId, orderIndex }) =>
      prisma.workOrderTask.update({
        where: { id: taskId },
        data: { orderIndex }
      })
    );

    return prisma.$transaction(updates);
  }

  async getTaskCompletionStats(workOrderId: number) {
    const tasks = await prisma.workOrderTask.findMany({
      where: { workOrderId }
    });

    const stats = {
      total: tasks.length,
      notStarted: tasks.filter(t => t.status === 'NOT_STARTED').length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      completed: tasks.filter(t => t.status === 'COMPLETED').length,
      skipped: tasks.filter(t => t.status === 'SKIPPED').length,
      failed: tasks.filter(t => t.status === 'FAILED').length,
      completionRate: 0,
      estimatedTotalMinutes: tasks.reduce((sum, t) => sum + (0), 0),
      actualTotalMinutes: tasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0)
    };

    if (stats.total > 0) {
      stats.completionRate = (stats.completed / stats.total) * 100;
    }

    return stats;
  }

  async bulkUpdateTaskStatus(
    workOrderId: number,
    userId: number,
    updates: Array<{
      taskId: number;
      status: TaskCompletionStatus;
      notes?: string;
      actualMinutes?: number;
    }>
  ) {
    const updatePromises = updates.map(update =>
      this.updateTaskStatus(update.taskId, userId, {
        status: update.status,
        notes: update.notes,
        actualMinutes: update.actualMinutes
      })
    );

    return Promise.all(updatePromises);
  }
}