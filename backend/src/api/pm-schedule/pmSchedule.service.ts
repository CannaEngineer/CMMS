import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreatePMScheduleData {
  title: string;
  description?: string;
  frequency: string;
  assetId: number;
  organizationId: number;
  taskIds?: number[]; // PM task IDs to associate
  assignedToId?: number; // User to assign work orders to
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedHours?: number;
}

export class PMScheduleService {
  async getAllPMSchedules(organizationId?: number) {
    const where = organizationId 
      ? {
          asset: {
            organizationId: organizationId
          }
        }
      : {};
      
    return prisma.pMSchedule.findMany({
      where,
      include: {
        asset: {
          select: {
            name: true,
            id: true,
            organizationId: true,
          },
        },
        tasks: {
          include: {
            pmTask: true
          }
        },
        triggers: true,
        workOrders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            uniqueId: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            workOrders: true,
            tasks: true
          }
        }
      },
    });
  }

  async getPMScheduleById(id: number) {
    return prisma.pMSchedule.findUnique({
      where: { id },
      include: {
        asset: {
          select: {
            name: true,
            id: true,
            organizationId: true,
          },
        },
        tasks: {
          include: {
            pmTask: true
          },
          orderBy: { orderIndex: 'asc' }
        },
        triggers: true,
        workOrders: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
    });
  }

  async createPMSchedule(data: CreatePMScheduleData) {
    console.log('Creating PM schedule with data:', data);
    
    try {
      // Calculate the first due date based on frequency
      const nextDue = this.calculateNextDueDate(data.frequency);
      
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create the PM schedule
        const pmSchedule = await tx.pMSchedule.create({
          data: {
            title: data.title,
            description: data.description,
            frequency: data.frequency,
            nextDue: nextDue,
            assetId: data.assetId,
          },
        });
        
        console.log('Created PM schedule:', pmSchedule.id);
        
        // 2. Associate PM tasks if provided
        if (data.taskIds && data.taskIds.length > 0) {
          console.log('Creating PM schedule tasks for:', data.taskIds);
          
          await Promise.all(
            data.taskIds.map((taskId, index) =>
              tx.pMScheduleTask.create({
                data: {
                  pmScheduleId: pmSchedule.id,
                  pmTaskId: taskId,
                  orderIndex: index,
                  isRequired: true,
                },
              })
            )
          );
        }
        
        // 3. Create time-based trigger
        const trigger = await tx.pMTrigger.create({
          data: {
            pmScheduleId: pmSchedule.id,
            type: 'TIME_BASED',
            isActive: true,
            ...this.getTriggerFieldsFromFrequency(data.frequency),
          },
        });
        
        console.log('Created PM trigger:', trigger.id);
        
        // 4. Create the first work order immediately
        const workOrder = await this.createWorkOrderFromPM(tx, pmSchedule, data);
        
        console.log('Created initial work order:', workOrder.id);
        
        // 5. Return the complete PM schedule
        return tx.pMSchedule.findUnique({
          where: { id: pmSchedule.id },
          include: {
            asset: true,
            tasks: {
              include: {
                pmTask: true
              }
            },
            triggers: true,
            workOrders: {
              include: {
                assignedTo: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          },
        });
      });
      
      console.log('PM schedule creation completed successfully');
      return result;
      
    } catch (error) {
      console.error('Error creating PM schedule:', error);
      throw new Error(`Failed to create PM schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createWorkOrderFromPM(tx: any, pmSchedule: any, data: CreatePMScheduleData) {
    // Get the asset to include in work order title
    const asset = await tx.asset.findUnique({
      where: { id: pmSchedule.assetId },
      select: { name: true, organizationId: true }
    });
    
    const workOrderTitle = `${pmSchedule.title} - ${asset?.name || 'Asset'}`;
    
    // Create the work order
    const workOrder = await tx.workOrder.create({
      data: {
        title: workOrderTitle,
        description: pmSchedule.description || `Preventive maintenance for ${asset?.name}`,
        status: 'OPEN',
        priority: data.priority || 'MEDIUM',
        dueDate: pmSchedule.nextDue,
        assetId: pmSchedule.assetId,
        assignedToId: data.assignedToId,
        pmScheduleId: pmSchedule.id,
        organizationId: data.organizationId,
        estimatedHours: data.estimatedHours,
      },
    });
    
    // If there are PM tasks associated, create work order tasks
    if (data.taskIds && data.taskIds.length > 0) {
      const pmTasks = await tx.pMTask.findMany({
        where: { id: { in: data.taskIds } }
      });
      
      await Promise.all(
        pmTasks.map((task, index) =>
          tx.workOrderTask.create({
            data: {
              workOrderId: workOrder.id,
              pmTaskId: task.id,
              title: task.title,
              description: task.description,
              procedure: task.procedure,
              orderIndex: index,
              status: 'NOT_STARTED',
            },
          })
        )
      );
    }
    
    return workOrder;
  }

  private calculateNextDueDate(frequency: string): Date {
    const now = new Date();
    
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
  }

  private getTriggerFieldsFromFrequency(frequency: string): any {
    switch (frequency.toLowerCase()) {
      case 'daily':
        return { intervalDays: 1 };
      case 'weekly':
        return { intervalWeeks: 1 };
      case 'monthly':
        return { intervalMonths: 1 };
      case 'quarterly':
        return { intervalMonths: 3 };
      case 'yearly':
        return { intervalMonths: 12 };
      default:
        // Default to monthly
        return { intervalMonths: 1 };
    }
  }

  async updatePMSchedule(id: number, data: any) {
    return prisma.pMSchedule.update({
      where: { id },
      data,
    });
  }

  async deletePMSchedule(id: number) {
    return prisma.pMSchedule.delete({
      where: { id },
    });
  }
}