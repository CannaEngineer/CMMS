import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DashboardService {
  async getStats(organizationId: number) {
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
        dateFormat = '%Y-%m-%d';
        periodGenerator = (d) => d.toISOString().substring(0, 10);
        numPeriods = 7; // Last 7 days including today
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 11, 0, 1); // Last 12 years
        dateFormat = '%Y';
        periodGenerator = (d) => d.getFullYear().toString();
        numPeriods = 12;
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1); // Last 6 months
        startDate.setHours(0, 0, 0, 0);
        dateFormat = '%Y-%m';
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

    const createdTrend = await prisma.$queryRaw`
      SELECT 
        strftime(${dateFormat}, createdAt) as period,
        COUNT(*) as created
      FROM WorkOrder 
      WHERE organizationId = ${organizationId} 
        AND createdAt >= ${startDate.toISOString()}
      GROUP BY strftime(${dateFormat}, createdAt)
      ORDER BY period
    `;

    const completedTrend = await prisma.$queryRaw`
      SELECT 
        strftime(${dateFormat}, updatedAt) as period,
        COUNT(*) as completed
      FROM WorkOrder 
      WHERE organizationId = ${organizationId} 
        AND status = 'COMPLETED'
        AND updatedAt >= ${startDate.toISOString()}
      GROUP BY strftime(${dateFormat}, updatedAt)
      ORDER BY period
    `;

    console.log("Raw Created Trend:", createdTrend);
    console.log("Raw Completed Trend:", completedTrend);

    const trendData: Record<string, { period: string; created: number; completed: number }> = {};

    allPeriods.forEach(p => {
      trendData[p] = { period: p, created: 0, completed: 0 };
    });

    (createdTrend as any[]).forEach(item => {
      trendData[item.period].created = Number(item.created);
    });

    (completedTrend as any[]).forEach(item => {
      trendData[item.period].completed = Number(item.completed);
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
      })),
      recentMaintenance: assetsWithRecentWorkOrders,
      total: totalAssets,
      healthScore: Math.round(((totalAssets - assetsWithRecentWorkOrders) / totalAssets) * 100),
    };
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