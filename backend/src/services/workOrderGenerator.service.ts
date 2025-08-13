import { PrismaClient, WorkOrderPriority } from '@prisma/client';
import { WorkOrderTaskService } from '../api/work-order/workOrderTask.service';
import { PMTriggerService } from '../api/pm-trigger/pmTrigger.service';

const prisma = new PrismaClient();

export class WorkOrderGeneratorService {
  private workOrderTaskService: WorkOrderTaskService;
  private pmTriggerService: PMTriggerService;

  constructor() {
    this.workOrderTaskService = new WorkOrderTaskService();
    this.pmTriggerService = new PMTriggerService();
  }

  async generateWorkOrderFromPMSchedule(pmScheduleId: number, triggerId?: number) {
    const pmSchedule = await prisma.pMSchedule.findUnique({
      where: { id: pmScheduleId },
      include: {
        asset: true,
        pmScheduleTasks: {
          include: { pmTask: true },
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!pmSchedule) {
      throw new Error('PM Schedule not found');
    }

    // Determine priority based on asset criticality and PM type
    let priority: WorkOrderPriority = 'MEDIUM';
    if (pmSchedule.asset.criticality === 'IMPORTANT') {
      priority = 'HIGH';
    } else if (pmSchedule.asset.criticality === 'HIGH') {
      priority = 'HIGH';
    } else if (pmSchedule.asset.criticality === 'LOW') {
      priority = 'LOW';
    }

    // Create the work order
    const workOrder = await prisma.workOrder.create({
      data: {
        title: `PM: ${pmSchedule.title}`,
        description: `Preventive maintenance for ${pmSchedule.asset.name}\n\n${pmSchedule.description || ''}`,
        status: 'OPEN',
        priority,
        assetId: pmSchedule.assetId,
        pmScheduleId: pmScheduleId, // Link to PM schedule
        organizationId: pmSchedule.asset.organizationId,
        // Don't assign yet - let managers assign
      }
    });

    // Create tasks from PM schedule
    if (pmSchedule.pmScheduleTasks.length > 0) {
      await this.workOrderTaskService.createTasksFromPMSchedule(workOrder.id, pmScheduleId);
    }

    // Create maintenance history entry
    await prisma.maintenanceHistory.create({
      data: {
        assetId: pmSchedule.assetId,
        workOrderId: workOrder.id,
        pmScheduleId: pmScheduleId,
        type: 'PREVENTIVE',
        title: workOrder.title,
        description: 'PM work order generated automatically',
        performedById: null, // Will be set when work is performed
        isCompleted: false
      }
    });

    // Mark trigger as fired if provided
    if (triggerId) {
      await this.pmTriggerService.markTriggerFired(triggerId);
    }

    return workOrder;
  }

  async generateWorkOrdersForDuePMs() {
    const dueTriggers = await this.pmTriggerService.evaluateTriggers();
    const generatedWorkOrders = [];

    for (const trigger of dueTriggers) {
      try {
        // Check if there's already an open work order for this PM schedule
        const existingWO = await prisma.workOrder.findFirst({
          where: {
            pmScheduleId: trigger.pmScheduleId,
            status: { in: ['OPEN', 'IN_PROGRESS'] }
          }
        });

        if (!existingWO) {
          const workOrder = await this.generateWorkOrderFromPMSchedule(
            trigger.pmScheduleId,
            trigger.id
          );
          generatedWorkOrders.push(workOrder);
        }
      } catch (error) {
        console.error(`Failed to generate work order for PM schedule ${trigger.pmScheduleId}:`, error);
      }
    }

    return {
      count: generatedWorkOrders.length,
      workOrders: generatedWorkOrders
    };
  }

  async generateWorkOrderFromUsageTrigger(assetId: number, meterType: string) {
    const triggeredList = await this.pmTriggerService.evaluateUsageBasedTriggers(assetId);
    const generatedWorkOrders = [];

    for (const trigger of triggeredList) {
      if (trigger.meterType === meterType) {
        try {
          const workOrder = await this.generateWorkOrderFromPMSchedule(
            trigger.pmScheduleId,
            trigger.id
          );
          generatedWorkOrders.push(workOrder);
        } catch (error) {
          console.error(`Failed to generate work order for usage trigger ${trigger.id}:`, error);
        }
      }
    }

    return generatedWorkOrders;
  }

  async generateWorkOrderFromConditionTrigger(assetId: number, sensorData: any) {
    const triggeredList = await this.pmTriggerService.evaluateConditionBasedTriggers(assetId, sensorData);
    const generatedWorkOrders = [];

    for (const trigger of triggeredList) {
      try {
        const workOrder = await this.generateWorkOrderFromPMSchedule(
          trigger.pmScheduleId,
          trigger.id
        );
        generatedWorkOrders.push(workOrder);
      } catch (error) {
        console.error(`Failed to generate work order for condition trigger ${trigger.id}:`, error);
      }
    }

    return generatedWorkOrders;
  }

  async scheduleRecurringGeneration() {
    // This would typically be called by a cron job or scheduled task
    console.log('Checking for due PM schedules...');
    
    const result = await this.generateWorkOrdersForDuePMs();
    
    console.log(`Generated ${result.count} work orders from due PM schedules`);
    
    return result;
  }

  async getGenerationStats(organizationId: number, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await prisma.workOrder.groupBy({
      by: ['createdAt'],
      where: {
        organizationId,
        createdAt: {
          gte: startDate
        },
        pmScheduleId: {
          not: null
        }
      },
      _count: {
        id: true
      }
    });

    // Get total PM work orders
    const totalPMWorkOrders = await prisma.workOrder.count({
      where: {
        organizationId,
        pmScheduleId: {
          not: null
        }
      }
    });

    // Get completion rate
    const completedPMWorkOrders = await prisma.workOrder.count({
      where: {
        organizationId,
        pmScheduleId: {
          not: null
        },
        status: 'COMPLETED'
      }
    });

    return {
      period: `${days} days`,
      recentlyGenerated: stats.length,
      totalPMWorkOrders,
      completedPMWorkOrders,
      completionRate: totalPMWorkOrders > 0 ? (completedPMWorkOrders / totalPMWorkOrders) * 100 : 0
    };
  }
}