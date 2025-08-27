import { MeterType } from '@prisma/client';
import { prisma } from '../../lib/prisma';

// Prisma client imported from singleton

export class MeterReadingService {
  async getMeterReadings(assetId: number, meterType?: MeterType, limit: number = 100) {
    const where: any = { assetId };
    if (meterType) {
      where.meterType = meterType;
    }

    return prisma.meterReading.findMany({
      where,
      include: {
        recordedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { readingDate: 'desc' },
      take: limit
    });
  }

  async getLatestReadings(assetId: number) {
    // Get the latest reading for each meter type
    const meterTypes = Object.values(MeterType);
    const latestReadings = [];

    for (const type of meterTypes) {
      const reading = await prisma.meterReading.findFirst({
        where: {
          assetId,
          meterType: type as MeterType
        },
        orderBy: { readingDate: 'desc' }
      });

      if (reading) {
        latestReadings.push(reading);
      }
    }

    return latestReadings;
  }

  async createMeterReading(data: {
    assetId: number;
    meterType: MeterType;
    value: number;
    unit?: string;
    readingDate?: Date;
    recordedById: number;
    notes?: string;
    isAutomatic?: boolean;
  }) {
    const reading = await prisma.meterReading.create({
      data: {
        ...data,
        readingDate: data.readingDate || new Date()
      }
    });

    // After creating a meter reading, evaluate usage-based triggers
    // Note: This would trigger PM evaluation in a real implementation

    return reading;
  }

  async updateMeterReading(id: number, data: any) {
    return prisma.meterReading.update({
      where: { id },
      data
    });
  }

  async deleteMeterReading(id: number) {
    return prisma.meterReading.delete({
      where: { id }
    });
  }

  async getMeterReadingTrends(assetId: number, meterType: MeterType, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const readings = await prisma.meterReading.findMany({
      where: {
        assetId,
        meterType,
        readingDate: {
          gte: startDate
        }
      },
      orderBy: { readingDate: 'asc' }
    });

    // Calculate daily averages
    const dailyData: { [key: string]: { total: number; count: number } } = {};

    readings.forEach(reading => {
      const dateKey = reading.readingDate.toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { total: 0, count: 0 };
      }
      dailyData[dateKey].total += reading.value;
      dailyData[dateKey].count += 1;
    });

    const trends = Object.entries(dailyData).map(([date, data]) => ({
      date,
      averageValue: data.total / data.count,
      readingCount: data.count
    }));

    return {
      meterType,
      period: `${days} days`,
      trends,
      latestReading: readings[readings.length - 1],
      highestReading: readings.reduce((max, r) => r.value > max.value ? r : max, readings[0]),
      lowestReading: readings.reduce((min, r) => r.value < min.value ? r : min, readings[0])
    };
  }

  async bulkCreateMeterReadings(readings: Array<{
    assetId: number;
    meterType: MeterType;
    value: number;
    unit?: string;
    readingDate?: Date;
    recordedById: number;
    notes?: string;
    isAutomatic?: boolean;
  }>) {
    return prisma.$transaction(
      readings.map(reading =>
        prisma.meterReading.create({
          data: {
            ...reading,
            readingDate: reading.readingDate || new Date()
          }
        })
      )
    );
  }

  async getAssetMeterTypes(assetId: number) {
    // Get all unique meter types that have been recorded for this asset
    const result = await prisma.meterReading.findMany({
      where: { assetId },
      select: { meterType: true },
      distinct: ['meterType']
    });

    return result.map(r => r.meterType);
  }
}