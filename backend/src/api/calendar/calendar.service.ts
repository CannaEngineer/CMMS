import { prisma } from '../../lib/prisma';
import dayjs from 'dayjs';

// Prisma client imported from singleton

export interface CalendarItem {
  id: number;
  title: string;
  type: 'PM_SCHEDULE' | 'WORK_ORDER';
  scheduledDate: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: string;
  assetName?: string;
  assetId?: number;
  location?: string;
  assignedTechnician?: string;
  description?: string;
  isOverdue: boolean;
  estimatedDuration?: number;
  originalData: any; // Store original PM or WO data for reference
}

export interface CalendarStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  overdue: number;
  byType: {
    pmSchedules: number;
    workOrders: number;
  };
  byPriority: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    URGENT: number;
  };
}

export const calendarService = {
  async getCalendarItems(
    organizationId: number,
    startDate?: Date,
    endDate?: Date,
    type?: 'PM_SCHEDULE' | 'WORK_ORDER' | 'ALL',
    assetId?: number,
    locationId?: number,
    assignedToId?: number
  ): Promise<CalendarItem[]> {
    const start = startDate ? dayjs(startDate) : dayjs().subtract(1, 'month');
    const end = endDate ? dayjs(endDate) : dayjs().add(2, 'months');

    const items: CalendarItem[] = [];

    // Fetch PM Schedules if requested
    if (!type || type === 'PM_SCHEDULE' || type === 'ALL') {
      try {
        const pmSchedules = await prisma.pMSchedule.findMany({
          where: {
            asset: {
              organizationId,
              ...(assetId && { id: assetId }),
              ...(locationId && { locationId }),
            },
            nextDue: {
              gte: start.toDate(),
              lte: end.toDate(),
            },
          },
          include: {
            asset: {
              include: {
                location: true,
              },
            },
            workOrders: {
              where: {
                status: {
                  not: 'COMPLETED'
                }
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 1, // Get the most recent active work order
            },
          },
          orderBy: {
            nextDue: 'asc',
          },
        });

        for (const pm of pmSchedules) {
          const isOverdue = dayjs(pm.nextDue).isBefore(dayjs(), 'day');
          const activeWorkOrder = pm.workOrders?.[0]; // Get the most recent active work order
          
          items.push({
            id: pm.id,
            title: pm.title,
            type: 'PM_SCHEDULE',
            scheduledDate: pm.nextDue,
            priority: 'MEDIUM', // PM schedules typically medium priority
            status: isOverdue ? 'OVERDUE' : 'SCHEDULED',
            assetName: pm.asset.name,
            assetId: pm.asset.id,
            location: pm.asset.location?.name,
            description: pm.description || undefined,
            isOverdue,
            estimatedDuration: 60, // Default 1 hour for PM tasks
            originalData: {
              ...pm,
              // Include work order information for navigation
              workOrderId: activeWorkOrder?.id,
              workOrder: activeWorkOrder,
            },
          });
        }
      } catch (error) {
        console.error('Error fetching PM schedules for calendar:', error);
      }
    }

    // For now, skip work orders due to schema issues
    // Will add work orders back once schema is clarified

    // Sort by date and priority
    return items.sort((a, b) => {
      const dateA = dayjs(a.scheduledDate);
      const dateB = dayjs(b.scheduledDate);
      
      if (dateA.isSame(dateB, 'day')) {
        // Same day - sort by priority and overdue status
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      
      return dateA.valueOf() - dateB.valueOf();
    });
  },

  async getCalendarStats(organizationId: number): Promise<CalendarStats> {
    const today = dayjs().startOf('day');
    const thisWeekStart = dayjs().startOf('week');
    const thisMonthStart = dayjs().startOf('month');
    
    try {
      // Get calendar items for calculations
      const allItems = await this.getCalendarItems(
        organizationId, 
        thisMonthStart.subtract(1, 'month').toDate(),
        thisMonthStart.add(1, 'month').toDate()
      );

      // Calculate stats
      const todayItems = allItems.filter(item => 
        dayjs(item.scheduledDate).isSame(today, 'day')
      );
      
      const thisWeekItems = allItems.filter(item => 
        dayjs(item.scheduledDate).isSame(thisWeekStart, 'week')
      );
      
      const thisMonthItems = allItems.filter(item => 
        dayjs(item.scheduledDate).isSame(thisMonthStart, 'month')
      );
      
      const overdueItems = allItems.filter(item => item.isOverdue);
      
      const pmItems = allItems.filter(item => item.type === 'PM_SCHEDULE');
      const workOrderItems = allItems.filter(item => item.type === 'WORK_ORDER');
      
      const priorityCounts = {
        LOW: allItems.filter(item => item.priority === 'LOW').length,
        MEDIUM: allItems.filter(item => item.priority === 'MEDIUM').length,
        HIGH: allItems.filter(item => item.priority === 'HIGH').length,
        URGENT: allItems.filter(item => item.priority === 'URGENT').length,
      };

      return {
        today: todayItems.length,
        thisWeek: thisWeekItems.length,
        thisMonth: thisMonthItems.length,
        overdue: overdueItems.length,
        byType: {
          pmSchedules: pmItems.length,
          workOrders: workOrderItems.length,
        },
        byPriority: priorityCounts,
      };
    } catch (error) {
      console.error('Error calculating calendar stats:', error);
      // Return empty stats on error
      return {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        overdue: 0,
        byType: {
          pmSchedules: 0,
          workOrders: 0,
        },
        byPriority: {
          LOW: 0,
          MEDIUM: 0,
          HIGH: 0,
          URGENT: 0,
        },
      };
    }
  },

  async rescheduleItem(
    itemId: number, 
    itemType: 'PM_SCHEDULE' | 'WORK_ORDER', 
    newDate: Date
  ): Promise<boolean> {
    try {
      if (itemType === 'PM_SCHEDULE') {
        await prisma.pMSchedule.update({
          where: { id: itemId },
          data: { nextDue: newDate },
        });
        return true;
      } else {
        // Will implement work order rescheduling once schema is clarified
        return false;
      }
    } catch (error) {
      console.error('Error rescheduling item:', error);
      return false;
    }
  },
};