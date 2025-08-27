import { prisma } from '../../lib/prisma';
import { DashboardService } from '../dashboard/dashboard.service';
import { getAllWorkOrders, updateWorkOrder } from '../work-order/workOrder.service';

// Prisma client imported from singleton
const dashboardService = new DashboardService();

export class BatchService {
  async processBatchRequests(requests: any[], organizationId: number) {
    const results = await Promise.allSettled(
      requests.map(async (request) => {
        try {
          const { method, endpoint, data } = request;
          
          // Route to appropriate service based on endpoint
          switch (endpoint) {
            case '/work-orders':
              if (method === 'GET') {
                return await getAllWorkOrders(organizationId);
              }
              break;
            case '/dashboard/stats':
              return await dashboardService.getStats(organizationId);
            case '/dashboard/trends':
              return await dashboardService.getWorkOrderTrends(organizationId);
            default:
              throw new Error(`Unsupported batch endpoint: ${endpoint}`);
          }
        } catch (error: any) {
          return { error: error.message, request };
        }
      })
    );

    return results.map((result, index) => ({
      requestIndex: index,
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null,
    }));
  }

  async getDashboardData(organizationId: number) {
    // Parallel execution of all dashboard queries
    const [stats, trends, recentWorkOrders, schedule] = await Promise.all([
      dashboardService.getStats(organizationId),
      dashboardService.getWorkOrderTrends(organizationId),
      dashboardService.getRecentWorkOrders(organizationId, 5),
      dashboardService.getMaintenanceSchedule(organizationId),
    ]);

    return {
      stats,
      trends,
      recentWorkOrders,
      schedule,
    };
  }

  async processSyncChanges(changes: any[], organizationId: number) {
    const results = [];

    for (const change of changes) {
      try {
        const { method, url, data } = change;
        
        // Parse URL to determine entity and action
        const urlParts = url.split('/').filter(Boolean);
        const entity = urlParts[0]; // e.g., 'work-orders', 'assets'
        
        let result;
        
        switch (entity) {
          case 'work-orders':
            if (method === 'PUT' || method === 'PATCH') {
              const id = parseInt(urlParts[1]);
              result = await updateWorkOrder(id, { ...data, organizationId }, organizationId);
            }
            break;
          // Add more entity handlers as needed
          default:
            throw new Error(`Unsupported sync entity: ${entity}`);
        }

        results.push({
          changeId: change.id,
          success: true,
          data: result,
        });
      } catch (error: any) {
        results.push({
          changeId: change.id,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  async processWorkOrderActions(actions: any[], organizationId: number) {
    const results = await Promise.allSettled(
      actions.map(async (action) => {
        const { workOrderId, actionType, data } = action;
        
        switch (actionType) {
          case 'updateStatus':
            return await updateWorkOrder(workOrderId, { 
              status: data.status,
              organizationId 
            }, organizationId);
          case 'assignTechnician':
            return await updateWorkOrder(workOrderId, { 
              assignedTo: data.assignedTo,
              organizationId 
            }, organizationId);
          case 'updatePriority':
            return await updateWorkOrder(workOrderId, { 
              priority: data.priority,
              organizationId 
            }, organizationId);
          default:
            throw new Error(`Unsupported action type: ${actionType}`);
        }
      })
    );

    return results.map((result, index) => ({
      actionIndex: index,
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason?.message : null,
    }));
  }

  // Optimized query for mobile data with pagination
  async getMobileWorkOrders(organizationId: number, page = 0, limit = 20, filters?: any) {
    const skip = page * limit;
    
    const [workOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where: {
          organizationId,
          ...(filters?.status && { status: filters.status }),
          ...(filters?.priority && { priority: filters.priority }),
          ...(filters?.assignedTo && { assignedTo: filters.assignedTo }),
        },
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              location: {
                select: {
                  name: true,
                },
              },
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.workOrder.count({
        where: {
          organizationId,
          ...(filters?.status && { status: filters.status }),
          ...(filters?.priority && { priority: filters.priority }),
          ...(filters?.assignedTo && { assignedTo: filters.assignedTo }),
        },
      }),
    ]);

    return {
      workOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: (page + 1) * limit < total,
        hasPrev: page > 0,
      },
    };
  }
}