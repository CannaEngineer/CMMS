import { MaintenanceType } from '@prisma/client';
import { prisma } from '../../lib/prisma';

// Prisma client imported from singleton

export class MaintenanceHistoryService {
  async getMaintenanceHistory(assetId: number, limit: number = 50) {
    return prisma.maintenanceHistory.findMany({
      where: { assetId },
      include: {
        workOrder: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            assignedTo: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        pmSchedule: {
          select: {
            id: true,
            title: true,
            frequency: true
          }
        },
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        signedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  async createMaintenanceRecord(data: {
    assetId: number;
    workOrderId: number;
    pmScheduleId?: number;
    type: MaintenanceType;
    title: string;
    description?: string;
    performedById?: number;
    performedAt?: Date;
    durationMinutes?: number;
    laborCost?: number;
    partsCost?: number;
    totalCost?: number;
    notes?: string;
    attachments?: string[];
    isCompleted?: boolean;
  }) {
    return prisma.maintenanceHistory.create({
      data: {
        ...data,
        performedAt: data.performedAt || new Date(),
        isCompleted: data.isCompleted ?? false
      }
    });
  }

  async updateMaintenanceRecord(id: number, data: any) {
    return prisma.maintenanceHistory.update({
      where: { id },
      data
    });
  }

  async completeMaintenanceRecord(
    id: number,
    completionData: {
      performedById: number;
      durationMinutes?: number;
      laborCost?: number;
      partsCost?: number;
      notes?: string;
      attachments?: string[];
    }
  ) {
    const record = await prisma.maintenanceHistory.findUnique({
      where: { id }
    });

    if (!record) {
      throw new Error('Maintenance record not found');
    }

    const totalCost = (completionData.laborCost || 0) + (completionData.partsCost || 0);

    return prisma.maintenanceHistory.update({
      where: { id },
      data: {
        ...completionData,
        totalCost,
        isCompleted: true,
        completedAt: new Date()
      }
    });
  }

  async signOffMaintenanceRecord(id: number, supervisorId: number, complianceNotes?: string) {
    return prisma.maintenanceHistory.update({
      where: { id },
      data: {
        signedById: supervisorId,
        signedAt: new Date(),
        complianceNotes
      }
    });
  }

  async getMaintenanceStats(assetId: number, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await prisma.maintenanceHistory.findMany({
      where: {
        assetId,
        createdAt: {
          gte: startDate
        }
      }
    });

    const stats = {
      totalRecords: records.length,
      completedRecords: records.filter(r => r.isCompleted).length,
      preventiveRecords: records.filter(r => r.type === 'PREVENTIVE').length,
      correctiveRecords: records.filter(r => r.type === 'CORRECTIVE').length,
      emergencyRecords: records.filter(r => r.type === 'EMERGENCY').length,
      totalCost: records.reduce((sum, r) => sum + (r.totalCost || 0), 0),
      totalLaborCost: records.reduce((sum, r) => sum + (r.laborCost || 0), 0),
      totalPartsCost: records.reduce((sum, r) => sum + (r.partsCost || 0), 0),
      totalDuration: records.reduce((sum, r) => sum + (r.durationMinutes || 0), 0),
      averageDuration: 0,
      completionRate: 0
    };

    if (stats.completedRecords > 0) {
      const completedRecords = records.filter(r => r.isCompleted);
      stats.averageDuration = completedRecords.reduce((sum, r) => sum + (r.durationMinutes || 0), 0) / completedRecords.length;
    }

    if (stats.totalRecords > 0) {
      stats.completionRate = (stats.completedRecords / stats.totalRecords) * 100;
    }

    return stats;
  }

  async getMaintenanceTrends(assetId: number, days: number = 90) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await prisma.maintenanceHistory.findMany({
      where: {
        assetId,
        createdAt: {
          gte: startDate
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by month
    const monthlyData: { [key: string]: any } = {};

    records.forEach(record => {
      const monthKey = record.createdAt.toISOString().substring(0, 7); // YYYY-MM
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          totalRecords: 0,
          preventive: 0,
          corrective: 0,
          emergency: 0,
          totalCost: 0,
          totalDuration: 0
        };
      }

      monthlyData[monthKey].totalRecords++;
      monthlyData[monthKey][record.type.toLowerCase()]++;
      monthlyData[monthKey].totalCost += record.totalCost || 0;
      monthlyData[monthKey].totalDuration += record.durationMinutes || 0;
    });

    return Object.values(monthlyData);
  }

  async getComplianceReport(organizationId: number, startDate: Date, endDate: Date) {
    const records = await prisma.maintenanceHistory.findMany({
      where: {
        asset: {
          organizationId
        },
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            criticality: true
          }
        },
        pmSchedule: {
          select: {
            id: true,
            title: true,
            frequency: true
          }
        }
      }
    });

    const report = {
      period: {
        start: startDate,
        end: endDate
      },
      totalMaintenanceActivities: records.length,
      completedActivities: records.filter(r => r.isCompleted).length,
      signedOffActivities: records.filter(r => r.signedById).length,
      preventiveMaintenanceRate: 0,
      averageCompletionTime: 0,
      totalCost: records.reduce((sum, r) => sum + (r.totalCost || 0), 0),
      byAssetCriticality: {
        IMPORTANT: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
      },
      byMaintenanceType: {
        PREVENTIVE: 0,
        CORRECTIVE: 0,
        EMERGENCY: 0,
        INSPECTION: 0,
        CALIBRATION: 0
      }
    };

    // Calculate rates and averages
    if (report.totalMaintenanceActivities > 0) {
      const preventiveCount = records.filter(r => r.type === 'PREVENTIVE').length;
      report.preventiveMaintenanceRate = (preventiveCount / report.totalMaintenanceActivities) * 100;

      const completedRecords = records.filter(r => r.isCompleted && r.durationMinutes);
      if (completedRecords.length > 0) {
        report.averageCompletionTime = completedRecords.reduce((sum, r) => sum + (r.durationMinutes || 0), 0) / completedRecords.length;
      }
    }

    // Group by asset criticality
    records.forEach(record => {
      if (record.asset.criticality) {
        report.byAssetCriticality[record.asset.criticality]++;
      }
      report.byMaintenanceType[record.type]++;
    });

    return report;
  }

  async deleteMaintenanceRecord(id: number) {
    return prisma.maintenanceHistory.delete({
      where: { id }
    });
  }
}