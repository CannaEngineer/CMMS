import { PMSchedulerService } from './pmScheduler.service';
import { PMReschedulerService } from './pmRescheduler.service';
import { NotificationService } from './notification.service';
import { prisma } from '../lib/prisma';

// Prisma client imported from singleton

export class PMSchedulerEnhancedService {
  private pmScheduler: PMSchedulerService;
  private pmRescheduler: PMReschedulerService;
  private notificationService: NotificationService;

  constructor() {
    this.pmScheduler = new PMSchedulerService();
    this.pmRescheduler = new PMReschedulerService();
    this.notificationService = new NotificationService();
  }

  /**
   * Comprehensive PM management process
   */
  async runComprehensivePMManagement() {
    console.log('Starting comprehensive PM management process...');
    
    const results = {
      timestamp: new Date(),
      normalGeneration: null as any,
      rescheduling: null as any,
      notifications: {
        created: 0,
        errors: 0
      },
      escalations: {
        overdueCount: 0,
        escalatedCount: 0
      }
    };

    try {
      // 1. Run normal PM generation
      console.log('Step 1: Running normal PM generation...');
      results.normalGeneration = await this.pmScheduler.runScheduledGeneration();

      // 2. Process failed/overdue work orders and reschedule
      console.log('Step 2: Processing failed work orders...');
      results.rescheduling = await this.pmRescheduler.runComprehensiveRescheduling();

      // 3. Send escalation notifications for critical overdue items
      console.log('Step 3: Processing escalations...');
      const escalationResults = await this.processEscalations();
      results.escalations = escalationResults;

      // 4. Clean up expired notifications
      console.log('Step 4: Cleaning up expired notifications...');
      await this.notificationService.archiveExpiredNotifications();

      console.log('Comprehensive PM management complete:', results);
      return results;

    } catch (error) {
      console.error('Error in comprehensive PM management:', error);
      throw error;
    }
  }

  /**
   * Process escalations for critical overdue items
   */
  private async processEscalations() {
    // Find critical assets with overdue PMs
    const criticalOverdueWorkOrders = await prisma.workOrder.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        pmScheduleId: { not: null },
        priority: { in: ['HIGH', 'URGENT'] },
        createdAt: {
          lt: new Date(Date.now() - 48 * 60 * 60 * 1000) // 48 hours overdue
        }
      },
      include: {
        asset: true,
        pmSchedule: true,
        assignedTo: true,
        organization: true
      }
    });

    let escalatedCount = 0;

    for (const workOrder of criticalOverdueWorkOrders) {
      try {
        // Find all managers and admins in the organization
        const managementUsers = await prisma.user.findMany({
          where: {
            organizationId: workOrder.organizationId,
            role: { in: ['MANAGER', 'ADMIN'] }
          }
        });

        // Calculate how overdue this is
        const hoursOverdue = Math.floor((Date.now() - new Date(workOrder.createdAt).getTime()) / (1000 * 60 * 60));
        
        // Create escalation notifications
        for (const manager of managementUsers) {
          await this.notificationService.createNotification({
            userId: manager.id,
            organizationId: workOrder.organizationId,
            title: `URGENT: Critical PM Overdue - ${workOrder.asset?.name || 'Asset'}`,
            message: `Work Order ${workOrder.uniqueId} for ${workOrder.asset?.name || 'Asset'} is ${hoursOverdue} hours overdue. Asset criticality: ${workOrder.asset?.criticality || 'Unknown'}. ${workOrder.assignedTo ? `Assigned to: ${workOrder.assignedTo.name}` : 'Not assigned'}.`,
            type: 'ALERT',
            priority: 'URGENT',
            category: 'MAINTENANCE',
            relatedEntityType: 'workOrder',
            relatedEntityId: workOrder.id,
            actionUrl: `/work-orders/${workOrder.id}`,
            actionLabel: 'View Work Order',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 24 hours
          });
        }

        escalatedCount++;

      } catch (error) {
        console.error(`Failed to escalate work order ${workOrder.id}:`, error);
      }
    }

    return {
      overdueCount: criticalOverdueWorkOrders.length,
      escalatedCount
    };
  }

  /**
   * Generate PM compliance report
   */
  async generateComplianceReport(organizationId: number, days: number = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all PM-related work orders in the period
    const pmWorkOrders = await prisma.workOrder.findMany({
      where: {
        organizationId,
        pmScheduleId: { not: null },
        createdAt: { gte: startDate, lte: endDate }
      },
      include: {
        pmSchedule: {
          include: {
            asset: true
          }
        },
        tasks: true
      }
    });

    // Calculate compliance metrics
    const totalPMs = pmWorkOrders.length;
    const completedPMs = pmWorkOrders.filter(wo => wo.status === 'COMPLETED').length;
    const overduePMs = pmWorkOrders.filter(wo => 
      wo.status === 'OPEN' && 
      (Date.now() - new Date(wo.createdAt).getTime()) > (7 * 24 * 60 * 60 * 1000)
    ).length;
    const canceledPMs = pmWorkOrders.filter(wo => wo.status === 'CANCELED').length;

    // Asset criticality breakdown
    const criticalityBreakdown = pmWorkOrders.reduce((acc, wo) => {
      const criticality = wo.pmSchedule?.asset.criticality || 'MEDIUM';
      acc[criticality] = (acc[criticality] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Task completion statistics
    const allTasks = pmWorkOrders.flatMap(wo => wo.tasks);
    const taskStats = allTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      period: `${days} days`,
      startDate,
      endDate,
      summary: {
        totalPMs,
        completedPMs,
        overduePMs,
        canceledPMs,
        complianceRate: totalPMs > 0 ? Math.round((completedPMs / totalPMs) * 100) : 0
      },
      criticalityBreakdown,
      taskStats,
      recommendations: this.generateRecommendations({
        totalPMs,
        completedPMs,
        overduePMs,
        canceledPMs,
        criticalityBreakdown
      })
    };
  }

  /**
   * Generate recommendations based on compliance data
   */
  private generateRecommendations(data: any): string[] {
    const recommendations = [];
    
    const complianceRate = data.totalPMs > 0 ? (data.completedPMs / data.totalPMs) * 100 : 0;
    
    if (complianceRate < 70) {
      recommendations.push('PM compliance rate is below 70%. Consider reviewing PM schedules and technician workload.');
    }
    
    if (data.overduePMs > data.totalPMs * 0.2) {
      recommendations.push('More than 20% of PMs are overdue. Consider implementing automatic escalation rules.');
    }
    
    if (data.canceledPMs > data.totalPMs * 0.15) {
      recommendations.push('High PM cancellation rate detected. Review PM scheduling accuracy and resource availability.');
    }
    
    if (data.criticalityBreakdown.HIGH || data.criticalityBreakdown.IMPORTANT) {
      const criticalOverdue = data.criticalityBreakdown.HIGH + (data.criticalityBreakdown.IMPORTANT || 0);
      if (criticalOverdue > 0) {
        recommendations.push('Critical asset PMs detected. Prioritize these for immediate completion.');
      }
    }
    
    if (recommendations.length === 0) {
      recommendations.push('PM compliance is good. Continue current maintenance practices.');
    }
    
    return recommendations;
  }

  /**
   * Start the enhanced PM scheduler with configurable intervals
   */
  startEnhancedScheduler(options: {
    normalInterval?: number; // minutes for normal PM generation
    rescheduleInterval?: number; // minutes for rescheduling process  
    escalationInterval?: number; // minutes for escalation checks
  } = {}) {
    const {
      normalInterval = 60, // 1 hour
      rescheduleInterval = 240, // 4 hours
      escalationInterval = 720 // 12 hours
    } = options;

    console.log(`Starting enhanced PM scheduler with intervals:
      - Normal PM generation: ${normalInterval} minutes
      - Rescheduling process: ${rescheduleInterval} minutes  
      - Escalation checks: ${escalationInterval} minutes`);

    // Run comprehensive management immediately
    this.runComprehensivePMManagement();

    // Set up normal PM generation interval
    setInterval(() => {
      this.pmScheduler.runScheduledGeneration();
    }, normalInterval * 60 * 1000);

    // Set up rescheduling process interval
    setInterval(() => {
      this.pmRescheduler.runComprehensiveRescheduling();
    }, rescheduleInterval * 60 * 1000);

    // Set up escalation process interval
    setInterval(() => {
      this.processEscalations();
    }, escalationInterval * 60 * 1000);
  }
}