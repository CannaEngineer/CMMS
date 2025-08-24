import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DashboardService {
  async getStats(organizationId: number) {
    try {
      // Get work order stats
      const totalWorkOrders = await prisma.workOrder.count({
        where: { organizationId },
      });

    const workOrdersByStatus = await prisma.workOrder.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: {
        status: true,
      },
    });

    const workOrdersStatusMap = workOrdersByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    const overdueWorkOrders = await prisma.workOrder.count({
      where: {
        organizationId,
        status: {
          in: ['OPEN', 'IN_PROGRESS'],
        },
        createdAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago as approximation
        },
      },
    });

    const totalAssets = await prisma.asset.count({
      where: { organizationId },
    });

    const assetsByStatus = await prisma.asset.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: {
        status: true,
      },
    });

    const assetsStatusMap = assetsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    const maintenanceDueAssets = await prisma.pMSchedule.count({
      where: {
        asset: {
          organizationId,
        },
        nextDue: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due within 7 days
        },
      },
    });

    const lowStockParts = await prisma.part.count({
      where: {
        organizationId,
        stockLevel: {
          lte: 10, // Temporary threshold - should be compared to reorderPoint field
        },
      },
    });

    const outOfStockParts = await prisma.part.count({
      where: {
        organizationId,
        stockLevel: 0,
      },
    });

    const completedWorkOrders = workOrdersStatusMap.COMPLETED || 0;
    const totalWorkOrdersForCompletionRate = totalWorkOrders - (workOrdersStatusMap.CANCELED || 0);
    const completionRate = totalWorkOrdersForCompletionRate > 0 
      ? Math.round((completedWorkOrders / totalWorkOrdersForCompletionRate) * 100) 
      : 0;

    return {
      workOrders: {
        total: totalWorkOrders,
        byStatus: workOrdersStatusMap,
        overdue: overdueWorkOrders,
        completionRate: completionRate,
      },
      assets: {
        total: totalAssets,
        byStatus: assetsStatusMap,
        maintenanceDue: maintenanceDueAssets,
      },
      inventory: {
        lowStock: lowStockParts,
        outOfStock: outOfStockParts,
      },
    };
    } catch (error) {
      console.error('[DashboardService] Error getting stats:', error);
      // Return default empty stats instead of throwing
      return {
        workOrders: {
          total: 0,
          byStatus: {},
          overdue: 0,
          completionRate: 0,
        },
        assets: {
          total: 0,
          byStatus: {},
          maintenanceDue: 0,
        },
        inventory: {
          lowStock: 0,
          outOfStock: 0,
        },
      };
    }
  }

  async getWorkOrderTrends(organizationId: number, period: 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;
    let dateFormat: string;
    let periodGenerator: (date: Date) => string;
    let numPeriods: number;

    switch (period) {
      case 'week':
        // Start of the current week (Monday)
        startDate = new Date(now);
        startDate.setDate(now.getDate() - (now.getDay() + 6) % 7); // Adjust to Monday
        startDate.setHours(0, 0, 0, 0);
        dateFormat = 'YYYY-MM-DD';
        periodGenerator = (d) => d.toISOString().substring(0, 10);
        numPeriods = 7; // Last 7 days including today
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 11, 0, 1); // Last 12 years
        dateFormat = 'YYYY';
        periodGenerator = (d) => d.getFullYear().toString();
        numPeriods = 12;
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1); // Last 6 months
        startDate.setHours(0, 0, 0, 0);
        dateFormat = 'YYYY-MM';
        periodGenerator = (d) => d.toISOString().substring(0, 7);
        numPeriods = 6;
        break;
    }

    // Generate all periods for the selected range to ensure continuous data
    const allPeriods: string[] = [];
    let current = new Date(startDate);
    for (let i = 0; i < numPeriods; i++) {
      const periodString = periodGenerator(current);
      allPeriods.push(periodString);
      if (period === 'week') {
        current.setDate(current.getDate() + 1);
      } else if (period === 'month') {
        current.setMonth(current.getMonth() + 1);
      } else if (period === 'year') {
        current.setFullYear(current.getFullYear() + 1);
      }
    }

    console.log(`Fetching trends for period: ${period}, from startDate: ${startDate.toISOString()}`);

    // Use database-agnostic approach with Prisma instead of raw SQL
    const createdWorkOrders = await prisma.workOrder.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    const completedWorkOrders = await prisma.workOrder.findMany({
      where: {
        organizationId,
        status: 'COMPLETED',
        updatedAt: {
          gte: startDate,
        },
      },
      select: {
        updatedAt: true,
      },
    });

    // Group data by period using JavaScript instead of SQL
    const createdTrend = createdWorkOrders.reduce((acc, wo) => {
      const period = periodGenerator(wo.createdAt);
      acc.push({ period, created: 1 });
      return acc;
    }, [] as any[]);

    const completedTrend = completedWorkOrders.reduce((acc, wo) => {
      const period = periodGenerator(wo.updatedAt!);
      acc.push({ period, completed: 1 });
      return acc;
    }, [] as any[]);

    // Aggregate the counts
    const createdCounts = createdTrend.reduce((acc, item) => {
      acc[item.period] = (acc[item.period] || 0) + item.created;
      return acc;
    }, {} as Record<string, number>);

    const completedCounts = completedTrend.reduce((acc, item) => {
      acc[item.period] = (acc[item.period] || 0) + item.completed;
      return acc;
    }, {} as Record<string, number>);

    // Convert to array format for consistency
    const createdTrendFormatted = Object.entries(createdCounts).map(([period, created]) => ({
      period,
      created,
    }));

    const completedTrendFormatted = Object.entries(completedCounts).map(([period, completed]) => ({
      period,
      completed,
    }));

    console.log("Raw Created Trend:", createdTrendFormatted);
    console.log("Raw Completed Trend:", completedTrendFormatted);

    const trendData: Record<string, { period: string; created: number; completed: number }> = {};

    allPeriods.forEach(p => {
      trendData[p] = { period: p, created: 0, completed: 0 };
    });

    createdTrendFormatted.forEach(item => {
      if (trendData[item.period]) {
        trendData[item.period].created = Number(item.created);
      }
    });

    completedTrendFormatted.forEach(item => {
      if (trendData[item.period]) {
        trendData[item.period].completed = Number(item.completed);
      }
    });

    return Object.values(trendData).sort((a, b) => a.period.localeCompare(b.period));
  }

  async getAssetHealth(organizationId: number) {
    const assetsByCriticality = await prisma.asset.groupBy({
      by: ['criticality'],
      where: { organizationId },
      _count: {
        criticality: true,
      },
    });

    const assetsWithRecentWorkOrders = await prisma.asset.count({
      where: {
        organizationId,
        workOrders: {
          some: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        },
      },
    });

    const totalAssets = await prisma.asset.count({
      where: { organizationId },
    });

    return {
      byCriticality: assetsByCriticality.map(item => ({
        name: item.criticality,
        value: item._count.criticality,
        color: this.getCriticalityColor(item.criticality),
      })),
      recentMaintenance: assetsWithRecentWorkOrders,
      total: totalAssets,
      healthScore: Math.round(((totalAssets - assetsWithRecentWorkOrders) / totalAssets) * 100),
    };
  }

  async getKPIMetrics(organizationId: number) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Calculate MTTR (Mean Time to Repair) in hours
    const completedWorkOrders = await prisma.workOrder.findMany({
      where: {
        organizationId,
        status: 'COMPLETED',
        updatedAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    const mttrHours = completedWorkOrders.length > 0 
      ? completedWorkOrders.reduce((sum, wo) => {
          const repairTime = wo.updatedAt!.getTime() - wo.createdAt.getTime();
          return sum + (repairTime / (1000 * 60 * 60)); // Convert to hours
        }, 0) / completedWorkOrders.length
      : 0;

    // Calculate planned vs unplanned work ratio
    const plannedWorkOrders = await prisma.workOrder.count({
      where: {
        organizationId,
        createdAt: { gte: thirtyDaysAgo },
        pmScheduleId: { not: null }, // Work orders created from PM schedules are planned
      },
    });

    const totalWorkOrders = await prisma.workOrder.count({
      where: {
        organizationId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const plannedWorkRatio = totalWorkOrders > 0 
      ? Math.round((plannedWorkOrders / totalWorkOrders) * 100)
      : 0;

    // Calculate technician utilization (simplified version)
    const technicians = await prisma.user.findMany({
      where: {
        organizationId,
        role: 'TECHNICIAN',
      },
      select: { id: true },
    });

    const totalTechnicianHours = technicians.length * 40; // Assume 40 hours per week
    
    const workOrderTimeLogged = await prisma.workOrderTimeLog.aggregate({
      where: {
        workOrder: { organizationId },
        loggedAt: { gte: sevenDaysAgo },
      },
      _sum: { hours: true },
    });

    const utilizationRate = totalTechnicianHours > 0 
      ? Math.round(((workOrderTimeLogged._sum.hours || 0) / totalTechnicianHours) * 100)
      : 0;

    // Calculate asset uptime percentage
    const onlineAssets = await prisma.asset.count({
      where: { organizationId, status: 'ONLINE' },
    });
    
    const totalAssets = await prisma.asset.count({
      where: { organizationId },
    });

    const uptimePercentage = totalAssets > 0 
      ? Math.round((onlineAssets / totalAssets) * 100)
      : 0;

    return {
      mttr: Math.round(mttrHours * 10) / 10, // Round to 1 decimal place
      plannedWorkRatio,
      technicianUtilization: utilizationRate,
      assetUptime: uptimePercentage,
      totalWorkOrders: totalWorkOrders,
      completedWorkOrders: completedWorkOrders.length,
    };
  }

  async getInventoryMetrics(organizationId: number) {
    // Get all parts and filter for low stock in memory
    const allParts = await prisma.part.findMany({
      where: {
        organizationId,
      },
      select: {
        id: true,
        name: true,
        stockLevel: true,
        reorderPoint: true,
        unitCost: true,
      },
    });
    
    // Filter for low stock parts (at or below reorder point)
    const lowStockParts = allParts.filter(part => part.stockLevel <= part.reorderPoint);

    // Calculate inventory turnover (simplified)
    const totalInventoryValue = await prisma.part.aggregate({
      where: { organizationId },
      _sum: {
        unitCost: true,
      },
    });

    const criticalParts = lowStockParts.filter(part => part.stockLevel === 0);

    return {
      lowStockCount: lowStockParts.length,
      outOfStockCount: criticalParts.length,
      totalInventoryValue: totalInventoryValue._sum.unitCost || 0,
      criticalParts: criticalParts.slice(0, 5), // Top 5 critical parts
      lowStockParts: lowStockParts.filter(part => part.stockLevel > 0).slice(0, 5),
    };
  }

  private getCriticalityColor(criticality: string) {
    switch (criticality) {
      case 'CRITICAL': return '#f44336'; // Red
      case 'HIGH': return '#ff9800'; // Orange  
      case 'MEDIUM': return '#ffc107'; // Yellow
      case 'LOW': return '#4caf50'; // Green
      default: return '#9e9e9e'; // Grey
    }
  }

  async getRecentWorkOrders(organizationId: number, limit: number = 10) {
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
  }

  async getMaintenanceSchedule(organizationId: number) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const todayTasks = await prisma.pMSchedule.count({
      where: {
        asset: {
          organizationId,
        },
        nextDue: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    const weekTasks = await prisma.pMSchedule.count({
      where: {
        asset: {
          organizationId,
        },
        nextDue: {
          gte: today,
          lt: nextWeek,
        },
      },
    });

    const monthTasks = await prisma.pMSchedule.count({
      where: {
        asset: {
          organizationId,
        },
        nextDue: {
          gte: startOfMonth,
          lt: new Date(today.getFullYear(), today.getMonth() + 1, 1),
        },
      },
    });

    return {
      today: todayTasks,
      thisWeek: weekTasks,
      thisMonth: monthTasks,
    };
  }
}