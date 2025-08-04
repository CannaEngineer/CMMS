import { PrismaClient, PMTriggerType, MeterType } from '@prisma/client';

const prisma = new PrismaClient();

export class PMTriggerService {
  async getTriggersByPMSchedule(pmScheduleId: number) {
    return prisma.pMTrigger.findMany({
      where: { pmScheduleId },
      orderBy: { createdAt: 'asc' }
    });
  }

  async createTrigger(data: {
    pmScheduleId: number;
    type: PMTriggerType;
    isActive?: boolean;
    // Time-based fields
    intervalDays?: number;
    intervalWeeks?: number;
    intervalMonths?: number;
    dayOfWeek?: number;
    dayOfMonth?: number;
    timeOfDay?: string;
    // Usage-based fields
    meterType?: MeterType;
    thresholdValue?: number;
    // Condition-based fields
    sensorField?: string;
    comparisonOperator?: string;
    // Event-based fields
    eventType?: string;
  }) {
    // Calculate initial nextDue based on trigger type
    let nextDue = new Date();
    
    if (data.type === 'TIME_BASED') {
      if (data.intervalDays) {
        nextDue.setDate(nextDue.getDate() + data.intervalDays);
      } else if (data.intervalWeeks) {
        nextDue.setDate(nextDue.getDate() + (data.intervalWeeks * 7));
      } else if (data.intervalMonths) {
        nextDue.setMonth(nextDue.getMonth() + data.intervalMonths);
      }
    }

    return prisma.pMTrigger.create({
      data: {
        ...data,
        isActive: data.isActive ?? true,
        nextDue
      }
    });
  }

  async updateTrigger(id: number, data: any) {
    return prisma.pMTrigger.update({
      where: { id },
      data
    });
  }

  async deleteTrigger(id: number) {
    return prisma.pMTrigger.delete({
      where: { id }
    });
  }

  async evaluateTriggers() {
    const now = new Date();
    
    // Get all active triggers that are due
    const dueTriggers = await prisma.pMTrigger.findMany({
      where: {
        isActive: true,
        nextDue: {
          lte: now
        }
      },
      include: {
        pmSchedule: {
          include: {
            asset: true
          }
        }
      }
    });

    return dueTriggers;
  }

  async evaluateUsageBasedTriggers(assetId: number) {
    // Get all usage-based triggers for the asset
    const triggers = await prisma.pMTrigger.findMany({
      where: {
        type: 'USAGE_BASED',
        isActive: true,
        pmSchedule: {
          assetId
        }
      },
      include: {
        pmSchedule: true
      }
    });

    const triggeredList = [];

    for (const trigger of triggers) {
      if (!trigger.meterType || !trigger.thresholdValue) continue;

      // Get latest meter reading for this type
      const latestReading = await prisma.meterReading.findFirst({
        where: {
          assetId,
          meterType: trigger.meterType
        },
        orderBy: { readingDate: 'desc' }
      });

      if (latestReading && latestReading.value >= trigger.thresholdValue) {
        // Check if there's a meter reading when this trigger was last fired
        const lastTriggerReading = await prisma.meterReading.findFirst({
          where: {
            assetId,
            meterType: trigger.meterType,
            readingDate: {
              lte: trigger.lastTriggered || new Date(0)
            }
          },
          orderBy: { readingDate: 'desc' }
        });

        // Only trigger if we've passed the threshold since last trigger
        if (!lastTriggerReading || lastTriggerReading.value < trigger.thresholdValue) {
          triggeredList.push(trigger);
        }
      }
    }

    return triggeredList;
  }

  async evaluateConditionBasedTriggers(assetId: number, sensorData: any) {
    const triggers = await prisma.pMTrigger.findMany({
      where: {
        type: 'CONDITION_BASED',
        isActive: true,
        pmSchedule: {
          assetId
        }
      },
      include: {
        pmSchedule: true
      }
    });

    const triggeredList = [];

    for (const trigger of triggers) {
      if (!trigger.sensorField || !trigger.comparisonOperator || trigger.thresholdValue === null) continue;

      const sensorValue = sensorData[trigger.sensorField];
      if (sensorValue === undefined) continue;

      let isTriggered = false;
      
      switch (trigger.comparisonOperator) {
        case '>':
          isTriggered = sensorValue > trigger.thresholdValue;
          break;
        case '>=':
          isTriggered = sensorValue >= trigger.thresholdValue;
          break;
        case '<':
          isTriggered = sensorValue < trigger.thresholdValue;
          break;
        case '<=':
          isTriggered = sensorValue <= trigger.thresholdValue;
          break;
        case '=':
          isTriggered = sensorValue === trigger.thresholdValue;
          break;
        case '!=':
          isTriggered = sensorValue !== trigger.thresholdValue;
          break;
      }

      if (isTriggered) {
        triggeredList.push(trigger);
      }
    }

    return triggeredList;
  }

  async markTriggerFired(triggerId: number) {
    const trigger = await prisma.pMTrigger.findUnique({
      where: { id: triggerId }
    });

    if (!trigger) return;

    let nextDue = new Date();

    // Calculate next due date based on trigger type
    if (trigger.type === 'TIME_BASED') {
      if (trigger.intervalDays) {
        nextDue.setDate(nextDue.getDate() + trigger.intervalDays);
      } else if (trigger.intervalWeeks) {
        nextDue.setDate(nextDue.getDate() + (trigger.intervalWeeks * 7));
      } else if (trigger.intervalMonths) {
        nextDue.setMonth(nextDue.getMonth() + trigger.intervalMonths);
      } else if (trigger.dayOfWeek !== null) {
        // Calculate next occurrence of specified day of week
        const currentDay = nextDue.getDay();
        const daysUntilTarget = (trigger.dayOfWeek - currentDay + 7) % 7 || 7;
        nextDue.setDate(nextDue.getDate() + daysUntilTarget);
      } else if (trigger.dayOfMonth !== null) {
        // Calculate next occurrence of specified day of month
        nextDue.setMonth(nextDue.getMonth() + 1);
        nextDue.setDate(trigger.dayOfMonth);
      }
    } else if (trigger.type === 'USAGE_BASED' && trigger.thresholdValue) {
      // For usage-based, next due is when meter reaches next threshold increment
      nextDue = new Date(8640000000000000); // Max date
    }

    return prisma.pMTrigger.update({
      where: { id: triggerId },
      data: {
        lastTriggered: new Date(),
        nextDue
      }
    });
  }

  // Get all triggers due within a date range
  async getUpcomingTriggers(startDate: Date, endDate: Date) {
    return prisma.pMTrigger.findMany({
      where: {
        isActive: true,
        nextDue: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        pmSchedule: {
          include: {
            asset: {
              select: {
                id: true,
                name: true,
                criticality: true
              }
            }
          }
        }
      },
      orderBy: { nextDue: 'asc' }
    });
  }
}