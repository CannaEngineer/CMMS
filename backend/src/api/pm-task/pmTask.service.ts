import { TaskType } from '@prisma/client';
import { prisma } from '../../lib/prisma';

// Prisma client imported from singleton

export class PMTaskService {
  async getAllPMTasks(organizationId: number) {
    return prisma.pMTask.findMany({
      where: { 
        organizationId,
        isActive: true 
      },
      include: {
        pmScheduleTasks: {
          include: {
            pmSchedule: {
              select: {
                title: true,
                id: true
              }
            }
          }
        }
      },
      orderBy: { title: 'asc' }
    });
  }

  async getPMTaskById(id: number, organizationId: number) {
    return prisma.pMTask.findFirst({
      where: { 
        id,
        organizationId 
      },
      include: {
        pmScheduleTasks: {
          include: {
            pmSchedule: {
              select: {
                title: true,
                id: true,
                asset: {
                  select: {
                    name: true,
                    id: true
                  }
                }
              }
            }
          }
        },
        workOrderTasks: {
          select: {
            id: true,
            workOrderId: true,
            status: true
          }
        }
      }
    });
  }

  async createPMTask(data: {
    title: string;
    description?: string;
    type: TaskType;
    procedure?: string;
    safetyRequirements?: string;
    toolsRequired?: string;
    partsRequired?: string;
    estimatedMinutes: number;
    organizationId: number;
  }) {
    return prisma.pMTask.create({
      data: {
        ...data,
        isActive: true
      }
    });
  }

  async updatePMTask(id: number, organizationId: number, data: any) {
    // Verify ownership
    const task = await prisma.pMTask.findFirst({
      where: { id, organizationId }
    });
    
    if (!task) {
      throw new Error('PM Task not found');
    }

    return prisma.pMTask.update({
      where: { id },
      data
    });
  }

  async deletePMTask(id: number, organizationId: number) {
    // Verify ownership
    const task = await prisma.pMTask.findFirst({
      where: { id, organizationId }
    });
    
    if (!task) {
      throw new Error('PM Task not found');
    }

    // Soft delete by setting isActive to false
    return prisma.pMTask.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async getTasksByPMSchedule(pmScheduleId: number) {
    return prisma.pMScheduleTask.findMany({
      where: { pmScheduleId },
      include: {
        pmTask: true
      },
      orderBy: { orderIndex: 'asc' }
    });
  }

  async linkTaskToPMSchedule(data: {
    pmScheduleId: number;
    pmTaskId: number;
    orderIndex: number;
    isRequired?: boolean;
  }) {
    return prisma.pMScheduleTask.create({
      data: {
        ...data,
        isRequired: data.isRequired ?? true
      }
    });
  }

  async unlinkTaskFromPMSchedule(pmScheduleId: number, pmTaskId: number) {
    return prisma.pMScheduleTask.delete({
      where: {
        pmScheduleId_pmTaskId: {
          pmScheduleId,
          pmTaskId
        }
      }
    });
  }

  async reorderTasksInPMSchedule(pmScheduleId: number, taskOrders: { pmTaskId: number; orderIndex: number }[]) {
    const updates = taskOrders.map(({ pmTaskId, orderIndex }) =>
      prisma.pMScheduleTask.update({
        where: {
          pmScheduleId_pmTaskId: {
            pmScheduleId,
            pmTaskId
          }
        },
        data: { orderIndex }
      })
    );

    return prisma.$transaction(updates);
  }

  // Get task templates by type
  async getTaskTemplatesByType(type: TaskType, organizationId: number) {
    return prisma.pMTask.findMany({
      where: {
        type,
        organizationId,
        isActive: true
      },
      orderBy: { title: 'asc' }
    });
  }

  // Clone a task template
  async cloneTask(taskId: number, organizationId: number) {
    const originalTask = await prisma.pMTask.findFirst({
      where: { id: taskId, organizationId }
    });

    if (!originalTask) {
      throw new Error('Task not found');
    }

    const { id, createdAt, updatedAt, ...taskData } = originalTask;

    return prisma.pMTask.create({
      data: {
        ...taskData,
        title: `${taskData.title} (Copy)`
      }
    });
  }
}