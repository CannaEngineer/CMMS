import { PrismaClient, PMTriggerType, TaskCompletionStatus, WorkOrderStatus } from '@prisma/client';
import { PMTriggerService } from '../api/pm-trigger/pmTrigger.service';
import { WorkOrderGeneratorService } from './workOrderGenerator.service';
import { NotificationService } from './notification.service';

const prisma = new PrismaClient();

export interface RescheduleRule {
  triggerType: PMTriggerType;
  failureCount: number;
  rescheduleStrategy: 'IMMEDIATE' | 'DELAY' | 'ESCALATE' | 'MANUAL';
  delayDays?: number;
  escalateToRole?: string;
  notificationLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export class PMReschedulerService {
  private pmTriggerService: PMTriggerService;
  private workOrderGenerator: WorkOrderGeneratorService;
  private notificationService: NotificationService;

  // Default rescheduling rules based on industry best practices
  private defaultRescheduleRules: RescheduleRule[] = [
    {
      triggerType: 'TIME_BASED',
      failureCount: 1,
      rescheduleStrategy: 'DELAY',
      delayDays: 1,
      notificationLevel: 'LOW'
    },
    {
      triggerType: 'TIME_BASED', 
      failureCount: 2,
      rescheduleStrategy: 'DELAY',
      delayDays: 3,
      notificationLevel: 'MEDIUM'
    },
    {
      triggerType: 'TIME_BASED',
      failureCount: 3,
      rescheduleStrategy: 'ESCALATE',
      escalateToRole: 'MANAGER',
      notificationLevel: 'HIGH'
    },
    {
      triggerType: 'USAGE_BASED',
      failureCount: 1,
      rescheduleStrategy: 'IMMEDIATE',
      notificationLevel: 'MEDIUM'
    },
    {
      triggerType: 'USAGE_BASED',
      failureCount: 2,
      rescheduleStrategy: 'ESCALATE',
      escalateToRole: 'MANAGER',
      notificationLevel: 'HIGH'
    },
    {
      triggerType: 'CONDITION_BASED',
      failureCount: 1,
      rescheduleStrategy: 'IMMEDIATE',
      notificationLevel: 'HIGH'
    },
    {
      triggerType: 'CONDITION_BASED',
      failureCount: 2,
      rescheduleStrategy: 'ESCALATE',
      escalateToRole: 'MANAGER',
      notificationLevel: 'URGENT'
    }
  ];

  constructor() {
    this.pmTriggerService = new PMTriggerService();
    this.workOrderGenerator = new WorkOrderGeneratorService();
    this.notificationService = new NotificationService();
  }

  /**
   * Process failed work orders and reschedule associated PM schedules
   */
  async processFailedWorkOrders() {
    console.log('Processing failed work orders for rescheduling...');

    // Find work orders that have failed tasks or are overdue
    const failedWorkOrders = await prisma.workOrder.findMany({
      where: {
        OR: [
          // Work orders with failed tasks
          {
            tasks: {
              some: {
                status: 'FAILED'
              }
            }
          },
          // Overdue work orders (open for more than 7 days)
          {
            status: 'OPEN',
            createdAt: {
              lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          },
          // Work orders on hold for more than 3 days
          {
            status: 'ON_HOLD',
            updatedAt: {
              lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            }
          }
        ],
        pmScheduleId: {
          not: null // Only PM-generated work orders
        }
      },
      include: {
        pmSchedule: {
          include: {
            triggers: true,
            asset: true
          }
        },
        tasks: true,
        asset: true
      }
    });

    const rescheduledCount = {
      immediate: 0,
      delayed: 0,
      escalated: 0,
      manual: 0
    };

    for (const workOrder of failedWorkOrders) {
      try {
        await this.rescheduleFailedWorkOrder(workOrder as any);
        
        // Update counters based on strategy used
        const failureCount = await this.getFailureCount(workOrder.pmScheduleId!);
        const rule = this.getRescheduleRule(workOrder.pmSchedule!.triggers[0]?.type, failureCount);
        
        switch (rule.rescheduleStrategy) {
          case 'IMMEDIATE':
            rescheduledCount.immediate++;
            break;
          case 'DELAY':
            rescheduledCount.delayed++;
            break;
          case 'ESCALATE':
            rescheduledCount.escalated++;
            break;
          case 'MANUAL':
            rescheduledCount.manual++;
            break;
        }
      } catch (error) {
        console.error(`Failed to reschedule work order ${workOrder.id}:`, error);
      }
    }

    console.log(`Rescheduling complete:`, rescheduledCount);
    return rescheduledCount;
  }

  /**
   * Reschedule a specific failed work order
   */
  async rescheduleFailedWorkOrder(workOrder: any) {
    if (!workOrder.pmScheduleId) {
      throw new Error('Cannot reschedule non-PM work order');
    }

    // Get failure count for this PM schedule
    const failureCount = await this.getFailureCount(workOrder.pmScheduleId);
    
    // Get the primary trigger type
    const primaryTrigger = workOrder.pmSchedule.triggers[0];
    if (!primaryTrigger) {
      throw new Error('No triggers found for PM schedule');
    }

    // Get rescheduling rule
    const rule = this.getRescheduleRule(primaryTrigger.type, failureCount);

    // Record the failure
    await this.recordPMFailure(workOrder.pmScheduleId, workOrder.id, failureCount + 1);

    // Execute rescheduling strategy
    switch (rule.rescheduleStrategy) {
      case 'IMMEDIATE':
        await this.rescheduleImmediate(workOrder.pmScheduleId, primaryTrigger);
        break;
        
      case 'DELAY':
        await this.rescheduleWithDelay(workOrder.pmScheduleId, primaryTrigger, rule.delayDays!);
        break;
        
      case 'ESCALATE':
        await this.escalateToManagement(workOrder, rule);
        break;
        
      case 'MANUAL':
        await this.markForManualReschedule(workOrder, rule);
        break;
    }

    // Send notifications
    await this.sendRescheduleNotification(workOrder, rule, failureCount + 1);

    // Cancel the failed work order
    await prisma.workOrder.update({
      where: { id: workOrder.id },
      data: { 
        status: 'CANCELED',
        description: `${workOrder.description}\n\n[SYSTEM] Canceled and rescheduled due to failure/timeout.`
      }
    });
  }

  /**
   * Reschedule immediately (create new work order right away)
   */
  private async rescheduleImmediate(pmScheduleId: number, trigger: any) {
    console.log(`Rescheduling PM ${pmScheduleId} immediately`);
    
    // Update trigger to fire now
    await prisma.pMTrigger.update({
      where: { id: trigger.id },
      data: { nextDue: new Date() }
    });

    // Generate new work order
    return this.workOrderGenerator.generateWorkOrderFromPMSchedule(pmScheduleId, trigger.id);
  }

  /**
   * Reschedule with delay
   */
  private async rescheduleWithDelay(pmScheduleId: number, trigger: any, delayDays: number) {
    console.log(`Rescheduling PM ${pmScheduleId} with ${delayDays} day delay`);
    
    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + delayDays);

    await prisma.pMTrigger.update({
      where: { id: trigger.id },
      data: { nextDue: newDueDate }
    });

    return { rescheduled: true, nextDue: newDueDate };
  }

  /**
   * Escalate to management
   */
  private async escalateToManagement(workOrder: any, rule: RescheduleRule) {
    console.log(`Escalating PM ${workOrder.pmScheduleId} to management`);

    // Find managers in the organization
    const managers = await prisma.user.findMany({
      where: {
        organizationId: workOrder.organizationId,
        role: 'MANAGER'
      }
    });

    // Create escalation notifications for all managers
    for (const manager of managers) {
      await this.notificationService.createNotification({
        userId: manager.id,
        organizationId: workOrder.organizationId,
        title: `PM Escalation Required: ${workOrder.pmSchedule.title}`,
        message: `Work Order ${workOrder.uniqueId} for asset ${workOrder.asset.name} has failed ${await this.getFailureCount(workOrder.pmScheduleId)} times and requires management intervention.`,
        type: 'ALERT',
        priority: rule.notificationLevel as any,
        category: 'MAINTENANCE',
        relatedEntityType: 'pmSchedule',
        relatedEntityId: workOrder.pmScheduleId,
        actionUrl: `/pm-schedules/${workOrder.pmScheduleId}`,
        actionLabel: 'Review PM Schedule'
      });
    }

    // Mark PM schedule as requiring manual attention
    await prisma.pMSchedule.update({
      where: { id: workOrder.pmScheduleId },
      data: {
        description: `${workOrder.pmSchedule.description || ''}\n\n[ESCALATED] Requires management attention - multiple failures detected.`
      }
    });
  }

  /**
   * Mark for manual rescheduling
   */
  private async markForManualReschedule(workOrder: any, rule: RescheduleRule) {
    console.log(`Marking PM ${workOrder.pmScheduleId} for manual rescheduling`);

    // Disable automatic triggers temporarily
    await prisma.pMTrigger.updateMany({
      where: { pmScheduleId: workOrder.pmScheduleId },
      data: { isActive: false }
    });

    // Create notification for maintenance managers
    const managers = await prisma.user.findMany({
      where: {
        organizationId: workOrder.organizationId,
        role: { in: ['MANAGER', 'ADMIN'] }
      }
    });

    for (const manager of managers) {
      await this.notificationService.createNotification({
        userId: manager.id,
        organizationId: workOrder.organizationId,
        title: `Manual PM Reschedule Required: ${workOrder.pmSchedule.title}`,
        message: `PM schedule for asset ${workOrder.asset.name} has been disabled and requires manual rescheduling due to repeated failures.`,
        type: 'WARNING',
        priority: 'HIGH',
        category: 'MAINTENANCE',
        relatedEntityType: 'pmSchedule',
        relatedEntityId: workOrder.pmScheduleId,
        actionUrl: `/pm-schedules/${workOrder.pmScheduleId}`,
        actionLabel: 'Reschedule PM'
      });
    }
  }

  /**
   * Get failure count for a PM schedule
   */
  private async getFailureCount(pmScheduleId: number): Promise<number> {
    const failures = await prisma.maintenanceHistory.count({
      where: {
        pmScheduleId,
        type: 'PREVENTIVE',
        isCompleted: false,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    return failures;
  }

  /**
   * Record a PM failure for tracking
   */
  private async recordPMFailure(pmScheduleId: number, workOrderId: number, failureCount: number) {
    await prisma.maintenanceHistory.create({
      data: {
        assetId: (await prisma.pMSchedule.findUnique({
          where: { id: pmScheduleId },
          select: { assetId: true }
        }))!.assetId,
        pmScheduleId,
        workOrderId,
        type: 'PREVENTIVE',
        title: 'PM Failure Recorded',
        description: `Failure #${failureCount} recorded for automatic rescheduling`,
        isCompleted: false,
        notes: `System recorded failure for rescheduling logic`
      }
    });
  }

  /**
   * Get appropriate reschedule rule based on trigger type and failure count
   */
  private getRescheduleRule(triggerType: PMTriggerType, failureCount: number): RescheduleRule {
    // Find the most specific rule for this trigger type and failure count
    const applicableRules = this.defaultRescheduleRules
      .filter(rule => rule.triggerType === triggerType && rule.failureCount <= failureCount)
      .sort((a, b) => b.failureCount - a.failureCount);

    return applicableRules[0] || {
      triggerType,
      failureCount: 999,
      rescheduleStrategy: 'MANUAL',
      notificationLevel: 'URGENT'
    };
  }

  /**
   * Send rescheduling notification
   */
  private async sendRescheduleNotification(workOrder: any, rule: RescheduleRule, failureCount: number) {
    // Find relevant users to notify
    const usersToNotify = await prisma.user.findMany({
      where: {
        organizationId: workOrder.organizationId,
        OR: [
          { id: workOrder.assignedToId }, // Assigned technician
          { role: (rule.escalateToRole || 'MANAGER') as any } // Escalation role
        ]
      }
    });

    const notificationTitle = `PM Rescheduled: ${workOrder.pmSchedule.title}`;
    const notificationMessage = `Work order ${workOrder.uniqueId} has been rescheduled after ${failureCount} failure(s). Strategy: ${rule.rescheduleStrategy}`;

    for (const user of usersToNotify) {
      await this.notificationService.createNotification({
        userId: user.id,
        organizationId: workOrder.organizationId,
        title: notificationTitle,
        message: notificationMessage,
        type: rule.notificationLevel === 'URGENT' ? 'ALERT' : 'WARNING',
        priority: rule.notificationLevel as any,
        category: 'MAINTENANCE',
        relatedEntityType: 'pmSchedule',
        relatedEntityId: workOrder.pmScheduleId,
        actionUrl: `/pm-schedules/${workOrder.pmScheduleId}`,
        actionLabel: 'View PM Schedule'
      });
    }
  }

  /**
   * Process incomplete PMs that have passed their due date
   */
  async processOverduePMs() {
    console.log('Processing overdue PMs...');

    const overdueTriggers = await prisma.pMTrigger.findMany({
      where: {
        isActive: true,
        nextDue: {
          lt: new Date() // Past due
        }
      },
      include: {
        pmSchedule: {
          include: {
            asset: true,
            workOrders: {
              where: {
                status: { in: ['OPEN', 'IN_PROGRESS'] }
              }
            }
          }
        }
      }
    });

    const processedCount = {
      generated: 0,
      rescheduled: 0,
      escalated: 0
    };

    for (const trigger of overdueTriggers) {
      try {
        // Check if there's already an active work order for this PM
        if (trigger.pmSchedule.workOrders.length === 0) {
          // No active work order, generate one
          await this.workOrderGenerator.generateWorkOrderFromPMSchedule(
            trigger.pmScheduleId,
            trigger.id
          );
          processedCount.generated++;
        } else {
          // There's an active work order that's overdue, process for rescheduling
          const activeWorkOrder = trigger.pmSchedule.workOrders[0];
          const daysPastDue = Math.floor((Date.now() - new Date(activeWorkOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysPastDue > 3) {
            await this.rescheduleFailedWorkOrder({
              ...activeWorkOrder,
              pmSchedule: trigger.pmSchedule
            });
            processedCount.rescheduled++;
          }
        }
      } catch (error) {
        console.error(`Failed to process overdue PM ${trigger.pmScheduleId}:`, error);
      }
    }

    console.log(`Overdue PM processing complete:`, processedCount);
    return processedCount;
  }

  /**
   * Run the complete rescheduling process
   */
  async runComprehensiveRescheduling() {
    console.log('Starting comprehensive PM rescheduling process...');

    const results = {
      failedWorkOrders: await this.processFailedWorkOrders(),
      overduePMs: await this.processOverduePMs(),
      timestamp: new Date()
    };

    console.log('Comprehensive rescheduling complete:', results);
    return results;
  }
}