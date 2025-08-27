import { WorkOrderStatus, AssetStatus, NotificationType, NotificationPriority, NotificationCategory } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotificationService } from '../api/notification/notification.service';

// Prisma client imported from singleton

class NotificationTriggersService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  // Main periodic check method - runs every 5 minutes
  async runPeriodicChecks() {
    try {
      console.log('Running periodic notification checks...');
      
      await Promise.all([
        this.checkOverdueWorkOrders(),
        this.checkOfflineAssets(),
        this.checkLowInventory(),
        this.checkOverdueMaintenanceTasks(),
        this.checkPortalSubmissions()
      ]);
      
      console.log('Periodic notification checks completed');
    } catch (error) {
      console.error('Error running periodic notification checks:', error);
    }
  }

  // Check for overdue work orders
  async checkOverdueWorkOrders() {
    try {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const overdueWorkOrders = await prisma.workOrder.findMany({
        where: {
          status: {
            in: [WorkOrderStatus.OPEN, WorkOrderStatus.IN_PROGRESS]
          },
          createdAt: {
            lt: twoDaysAgo
          }
        },
        include: {
          assignedTo: true,
          asset: true,
          organization: {
            select: { id: true }
          }
        }
      });

      for (const workOrder of overdueWorkOrders) {
        // Check if we already sent a notification for this work order recently
        const recentNotification = await prisma.notification.findFirst({
          where: {
            relatedEntityType: 'workOrder',
            relatedEntityId: workOrder.id,
            category: NotificationCategory.WORK_ORDER,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
            }
          }
        });

        if (recentNotification) {
          continue; // Skip if already notified recently
        }

        // Send notification to assigned user if exists
        if (workOrder.assignedTo) {
          await this.notificationService.createNotification({
            userId: workOrder.assignedTo.id,
            organizationId: workOrder.organization.id,
            title: 'Overdue Work Order',
            message: `Work order "${workOrder.title}" has been pending for more than 2 days and requires attention.`,
            type: NotificationType.WARNING,
            priority: NotificationPriority.HIGH,
            category: NotificationCategory.WORK_ORDER,
            relatedEntityType: 'workOrder',
            relatedEntityId: workOrder.id,
            actionUrl: `/work-orders/${workOrder.id}`,
            actionLabel: 'View Work Order',
            channels: ['IN_APP']
          });
        }

        // Also notify managers and admins
        const managersAndAdmins = await prisma.user.findMany({
          where: {
            organizationId: workOrder.organization.id,
            role: {
              in: ['MANAGER', 'ADMIN']
            }
          }
        });

        for (const user of managersAndAdmins) {
          await this.notificationService.createNotification({
            userId: user.id,
            organizationId: workOrder.organization.id,
            title: 'Overdue Work Order Requires Attention',
            message: `Work order "${workOrder.title}" ${workOrder.assignedTo ? `assigned to ${workOrder.assignedTo.name}` : '(unassigned)'} is overdue.`,
            type: NotificationType.WARNING,
            priority: NotificationPriority.MEDIUM,
            category: NotificationCategory.WORK_ORDER,
            relatedEntityType: 'workOrder',
            relatedEntityId: workOrder.id,
            actionUrl: `/work-orders/${workOrder.id}`,
            actionLabel: 'Review Work Order',
            channels: ['IN_APP']
          });
        }
      }

      console.log(`Checked ${overdueWorkOrders.length} overdue work orders`);
    } catch (error) {
      console.error('Error checking overdue work orders:', error);
    }
  }

  // Check for offline assets
  async checkOfflineAssets() {
    try {
      const offlineAssets = await prisma.asset.findMany({
        where: {
          status: AssetStatus.OFFLINE,
          criticality: {
            in: ['HIGH', 'IMPORTANT']
          }
        },
        include: {
          organization: {
            select: { id: true }
          }
        }
      });

      for (const asset of offlineAssets) {
        // Check if we already sent a notification for this asset recently
        const recentNotification = await prisma.notification.findFirst({
          where: {
            relatedEntityType: 'asset',
            relatedEntityId: asset.id,
            category: NotificationCategory.ASSET,
            type: NotificationType.ALERT,
            createdAt: {
              gte: new Date(Date.now() - 4 * 60 * 60 * 1000) // Within last 4 hours
            }
          }
        });

        if (recentNotification) {
          continue; // Skip if already notified recently
        }

        // Get all maintenance personnel who should be notified
        const maintenancePersonnel = await prisma.user.findMany({
          where: {
            organizationId: asset.organization.id,
            role: {
              in: ['TECHNICIAN', 'MANAGER', 'ADMIN']
            }
          }
        });

        for (const user of maintenancePersonnel) {
          await this.notificationService.createNotification({
            userId: user.id,
            organizationId: asset.organization.id,
            title: 'Critical Asset Offline',
            message: `High-priority asset "${asset.name}" is currently offline and requires immediate attention.`,
            type: NotificationType.ALERT,
            priority: asset.criticality === 'IMPORTANT' ? NotificationPriority.URGENT : NotificationPriority.HIGH,
            category: NotificationCategory.ASSET,
            relatedEntityType: 'asset',
            relatedEntityId: asset.id,
            actionUrl: `/assets/${asset.id}`,
            actionLabel: 'View Asset',
            channels: ['IN_APP']
          });
        }
      }

      console.log(`Checked ${offlineAssets.length} critical offline assets`);
    } catch (error) {
      console.error('Error checking offline assets:', error);
    }
  }

  // Check for low inventory
  async checkLowInventory() {
    try {
      // First get all parts with reorder points set, then filter in application
      const partsWithReorderPoints = await prisma.part.findMany({
        where: {
          reorderPoint: {
            gt: 0 // Only check parts that have a reorder point set
          }
        },
        include: {
          organization: {
            select: { id: true }
          }
        }
      });

      // Filter to only low stock parts
      const lowStockParts = partsWithReorderPoints.filter(part => part.stockLevel <= part.reorderPoint);

      for (const part of lowStockParts) {
        // Check if we already sent a notification for this part recently
        const recentNotification = await prisma.notification.findFirst({
          where: {
            relatedEntityType: 'part',
            relatedEntityId: part.id,
            category: NotificationCategory.INVENTORY,
            createdAt: {
              gte: new Date(Date.now() - 48 * 60 * 60 * 1000) // Within last 48 hours
            }
          }
        });

        if (recentNotification) {
          continue; // Skip if already notified recently
        }

        // Get inventory managers and admins
        const inventoryManagers = await prisma.user.findMany({
          where: {
            organizationId: part.organization.id,
            role: {
              in: ['MANAGER', 'ADMIN']
            }
          }
        });

        for (const user of inventoryManagers) {
          const priority = part.stockLevel === 0 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM;
          const type = part.stockLevel === 0 ? NotificationType.ALERT : NotificationType.WARNING;

          await this.notificationService.createNotification({
            userId: user.id,
            organizationId: part.organization.id,
            title: part.stockLevel === 0 ? 'Part Out of Stock' : 'Low Inventory Alert',
            message: `Part "${part.name}" is ${part.stockLevel === 0 ? 'out of stock' : `running low (${part.stockLevel} remaining, reorder at ${part.reorderPoint})`}.`,
            type,
            priority,
            category: NotificationCategory.INVENTORY,
            relatedEntityType: 'part',
            relatedEntityId: part.id,
            actionUrl: `/inventory/parts/${part.id}`,
            actionLabel: 'View Part',
            channels: ['IN_APP']
          });
        }
      }

      console.log(`Checked ${lowStockParts.length} low stock parts`);
    } catch (error) {
      console.error('Error checking low inventory:', error);
    }
  }

  // Check for overdue maintenance tasks
  async checkOverdueMaintenanceTasks() {
    try {
      const now = new Date();
      
      const overdueSchedules = await prisma.pMSchedule.findMany({
        where: {
          nextDue: {
            lt: now
          }
        },
        include: {
          asset: {
            include: {
              organization: {
                select: { id: true }
              }
            }
          }
        }
      });

      for (const schedule of overdueSchedules) {
        // Check if we already sent a notification for this schedule recently
        const recentNotification = await prisma.notification.findFirst({
          where: {
            relatedEntityType: 'pmSchedule',
            relatedEntityId: schedule.id,
            category: NotificationCategory.MAINTENANCE,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
            }
          }
        });

        if (recentNotification) {
          continue; // Skip if already notified recently
        }

        // Calculate how overdue the task is
        const daysOverdue = Math.floor((now.getTime() - schedule.nextDue.getTime()) / (24 * 60 * 60 * 1000));
        const priority = daysOverdue > 7 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM;

        // Get maintenance personnel
        const maintenancePersonnel = await prisma.user.findMany({
          where: {
            organizationId: schedule.asset.organization.id,
            role: {
              in: ['TECHNICIAN', 'MANAGER', 'ADMIN']
            }
          }
        });

        for (const user of maintenancePersonnel) {
          await this.notificationService.createNotification({
            userId: user.id,
            organizationId: schedule.asset.organization.id,
            title: 'Overdue Maintenance Task',
            message: `Preventive maintenance "${schedule.title}" for asset "${schedule.asset.name}" is ${daysOverdue} day(s) overdue.`,
            type: NotificationType.WARNING,
            priority,
            category: NotificationCategory.MAINTENANCE,
            relatedEntityType: 'pmSchedule',
            relatedEntityId: schedule.id,
            actionUrl: `/maintenance/schedules/${schedule.id}`,
            actionLabel: 'View Schedule',
            channels: ['IN_APP']
          });
        }
      }

      console.log(`Checked ${overdueSchedules.length} overdue maintenance schedules`);
    } catch (error) {
      console.error('Error checking overdue maintenance tasks:', error);
    }
  }

  // Check for new portal submissions
  async checkPortalSubmissions() {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const newSubmissions = await prisma.portalSubmission.findMany({
        where: {
          status: 'SUBMITTED',
          createdAt: {
            gte: oneHourAgo
          }
        },
        include: {
          portal: true,
          assignedTo: true
        }
      });

      for (const submission of newSubmissions) {
        // Check if we already sent a notification for this submission
        const existingNotification = await prisma.notification.findFirst({
          where: {
            relatedEntityType: 'portalSubmission',
            relatedEntityId: submission.id,
            category: NotificationCategory.PORTAL
          }
        });

        if (existingNotification) {
          continue; // Skip if already notified
        }

        // Determine who should be notified
        const targetUsers: number[] = [];
        
        if (submission.assignedTo) {
          targetUsers.push(submission.assignedTo.id);
        } else {
          // Get portal managers and admins if no specific assignment
          const portalManagers = await prisma.user.findMany({
            where: {
              organizationId: submission.portal.organizationId,
              role: {
                in: ['MANAGER', 'ADMIN']
              }
            },
            select: { id: true }
          });
          targetUsers.push(...portalManagers.map(u => u.id));
        }

        for (const userId of targetUsers) {
          await this.notificationService.createNotification({
            userId,
            organizationId: submission.portal.organizationId,
            title: 'New Portal Submission',
            message: `New ${submission.portal.type.toLowerCase().replace('_', ' ')} submission received through portal "${submission.portal.name}".`,
            type: NotificationType.INFO,
            priority: submission.priority === 'URGENT' ? NotificationPriority.HIGH : 
                     submission.priority === 'HIGH' ? NotificationPriority.MEDIUM : NotificationPriority.LOW,
            category: NotificationCategory.PORTAL,
            relatedEntityType: 'portalSubmission',
            relatedEntityId: submission.id,
            actionUrl: `/portals/${submission.portal.id}/submissions/${submission.id}`,
            actionLabel: 'Review Submission',
            channels: ['IN_APP']
          });
        }
      }

      console.log(`Checked ${newSubmissions.length} new portal submissions`);
    } catch (error) {
      console.error('Error checking portal submissions:', error);
    }
  }

  // Trigger notification when work order status changes
  async onWorkOrderStatusChanged(workOrderId: number, oldStatus: WorkOrderStatus, newStatus: WorkOrderStatus, changedById?: number) {
    try {
      const workOrder = await prisma.workOrder.findUnique({
        where: { id: workOrderId },
        include: {
          assignedTo: true,
          asset: true,
          organization: { select: { id: true } }
        }
      });

      if (!workOrder) return;

      // Don't notify the user who made the change
      let targetUserIds: number[] = [];
      
      if (workOrder.assignedTo && workOrder.assignedTo.id !== changedById) {
        targetUserIds.push(workOrder.assignedTo.id);
      }

      // Notify managers and admins (except the one who made the change)
      const managersAndAdmins = await prisma.user.findMany({
        where: {
          organizationId: workOrder.organization.id,
          role: { in: ['MANAGER', 'ADMIN'] },
          ...(changedById && { id: { not: changedById } })
        },
        select: { id: true }
      });

      targetUserIds.push(...managersAndAdmins.map(u => u.id));
      targetUserIds = [...new Set(targetUserIds)]; // Remove duplicates

      const changedBy = changedById ? await prisma.user.findUnique({
        where: { id: changedById },
        select: { name: true }
      }) : null;

      const statusMessages = {
        [WorkOrderStatus.OPEN]: 'opened',
        [WorkOrderStatus.IN_PROGRESS]: 'started',
        [WorkOrderStatus.ON_HOLD]: 'put on hold',
        [WorkOrderStatus.COMPLETED]: 'completed',
        [WorkOrderStatus.CANCELED]: 'canceled'
      };

      for (const userId of targetUserIds) {
        await this.notificationService.createNotification({
          userId,
          organizationId: workOrder.organization.id,
          title: 'Work Order Status Changed',
          message: `Work order "${workOrder.title}" has been ${statusMessages[newStatus]}${changedBy ? ` by ${changedBy.name}` : ''}.`,
          type: newStatus === WorkOrderStatus.COMPLETED ? NotificationType.SUCCESS : NotificationType.INFO,
          priority: newStatus === WorkOrderStatus.COMPLETED ? NotificationPriority.LOW : NotificationPriority.MEDIUM,
          category: NotificationCategory.WORK_ORDER,
          relatedEntityType: 'workOrder',
          relatedEntityId: workOrder.id,
          actionUrl: `/work-orders/${workOrder.id}`,
          actionLabel: 'View Work Order',
          createdById: changedById,
          channels: ['IN_APP']
        });
      }

      console.log(`Sent work order status change notifications for WO ${workOrderId}`);
    } catch (error) {
      console.error('Error sending work order status change notification:', error);
    }
  }

  // Trigger notification when work order is assigned
  async onWorkOrderAssigned(workOrderId: number, assignedToId: number, assignedById?: number) {
    try {
      const workOrder = await prisma.workOrder.findUnique({
        where: { id: workOrderId },
        include: {
          assignedTo: true,
          asset: true,
          organization: { select: { id: true } }
        }
      });

      if (!workOrder) return;

      const assignedBy = assignedById ? await prisma.user.findUnique({
        where: { id: assignedById },
        select: { name: true }
      }) : null;

      // Notify the assigned user (if not self-assigned)
      if (assignedToId !== assignedById) {
        await this.notificationService.createNotification({
          userId: assignedToId,
          organizationId: workOrder.organization.id,
          title: 'New Work Order Assignment',
          message: `You have been assigned work order "${workOrder.title}"${assignedBy ? ` by ${assignedBy.name}` : ''}.`,
          type: NotificationType.INFO,
          priority: workOrder.priority === 'URGENT' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
          category: NotificationCategory.WORK_ORDER,
          relatedEntityType: 'workOrder',
          relatedEntityId: workOrder.id,
          actionUrl: `/work-orders/${workOrder.id}`,
          actionLabel: 'View Work Order',
          createdById: assignedById,
          channels: ['IN_APP']
        });
      }

      console.log(`Sent work order assignment notification for WO ${workOrderId}`);
    } catch (error) {
      console.error('Error sending work order assignment notification:', error);
    }
  }

  // Trigger notification when asset goes offline
  async onAssetStatusChanged(assetId: number, oldStatus: AssetStatus, newStatus: AssetStatus, changedById?: number) {
    try {
      if (newStatus !== AssetStatus.OFFLINE) return; // Only notify when going offline

      const asset = await prisma.asset.findUnique({
        where: { id: assetId },
        include: {
          organization: { select: { id: true } }
        }
      });

      if (!asset) return;

      // Get maintenance personnel
      const maintenancePersonnel = await prisma.user.findMany({
        where: {
          organizationId: asset.organization.id,
          role: { in: ['TECHNICIAN', 'MANAGER', 'ADMIN'] },
          ...(changedById && { id: { not: changedById } })
        },
        select: { id: true }
      });

      const changedBy = changedById ? await prisma.user.findUnique({
        where: { id: changedById },
        select: { name: true }
      }) : null;

      for (const user of maintenancePersonnel) {
        await this.notificationService.createNotification({
          userId: user.id,
          organizationId: asset.organization.id,
          title: 'Asset Status Changed',
          message: `Asset "${asset.name}" has gone offline${changedBy ? ` (updated by ${changedBy.name})` : ''} and may require attention.`,
          type: asset.criticality === 'HIGH' || asset.criticality === 'IMPORTANT' ? NotificationType.ALERT : NotificationType.WARNING,
          priority: asset.criticality === 'IMPORTANT' ? NotificationPriority.URGENT : 
                   asset.criticality === 'HIGH' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
          category: NotificationCategory.ASSET,
          relatedEntityType: 'asset',
          relatedEntityId: asset.id,
          actionUrl: `/assets/${asset.id}`,
          actionLabel: 'View Asset',
          createdById: changedById,
          channels: ['IN_APP']
        });
      }

      console.log(`Sent asset offline notifications for asset ${assetId}`);
    } catch (error) {
      console.error('Error sending asset status change notification:', error);
    }
  }

  // Trigger notification when portal submission is created
  async onPortalSubmission(submissionId: number) {
    try {
      const submission = await prisma.portalSubmission.findUnique({
        where: { id: submissionId },
        include: {
          portal: true,
          assignedTo: true
        }
      });

      if (!submission) return;

      // Determine who should be notified
      const targetUsers: number[] = [];
      
      if (submission.assignedTo) {
        targetUsers.push(submission.assignedTo.id);
      } else {
        // Get portal managers and admins if no specific assignment
        const portalManagers = await prisma.user.findMany({
          where: {
            organizationId: submission.portal.organizationId,
            role: {
              in: ['MANAGER', 'ADMIN']
            }
          },
          select: { id: true }
        });
        targetUsers.push(...portalManagers.map(u => u.id));
      }

      for (const userId of targetUsers) {
        await this.notificationService.createNotification({
          userId,
          organizationId: submission.portal.organizationId,
          title: 'New Portal Submission',
          message: `New ${submission.portal.type.toLowerCase().replace('_', ' ')} submission received through portal "${submission.portal.name}".`,
          type: NotificationType.INFO,
          priority: submission.priority === 'URGENT' ? NotificationPriority.HIGH : 
                   submission.priority === 'HIGH' ? NotificationPriority.MEDIUM : NotificationPriority.LOW,
          category: NotificationCategory.PORTAL,
          relatedEntityType: 'portalSubmission',
          relatedEntityId: submission.id,
          actionUrl: `/portals/${submission.portal.id}/submissions/${submission.id}`,
          actionLabel: 'Review Submission',
          channels: ['IN_APP']
        });
      }

      console.log(`Sent portal submission notification for submission ${submissionId}`);
    } catch (error) {
      console.error('Error sending portal submission notification:', error);
    }
  }

  // Clean up old notifications
  async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          OR: [
            { isArchived: true },
            { isRead: true, createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // Read notifications older than 7 days
          ]
        }
      });

      console.log(`Cleaned up ${result.count} old notifications`);
      return result.count;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      return 0;
    }
  }
}

export const notificationTriggersService = new NotificationTriggersService();