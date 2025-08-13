
import { PrismaClient, AssetStatus } from '@prisma/client';
import { notificationTriggersService } from '../../services/notification-triggers.service';

const prisma = new PrismaClient();

export const getAllAssets = async (organizationId: number) => {
  return prisma.asset.findMany({
    where: {
      organizationId,
    },
    include: {
      location: {
        select: {
          id: true,
          name: true,
        },
      },
      workOrders: {
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      },
      pmSchedules: {
        select: {
          id: true,
          nextDue: true,
        },
        orderBy: {
          nextDue: 'asc',
        },
        take: 1,
      },
    },
  });
};

export const getAssetById = async (id: number, organizationId: number) => {
  return prisma.asset.findFirst({
    where: { 
      id,
      organizationId,
    },
    include: {
      location: {
        select: {
          id: true,
          name: true,
        },
      },
      workOrders: {
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      pmSchedules: {
        select: {
          id: true,
          title: true,
          nextDue: true,
        },
        orderBy: {
          nextDue: 'asc',
        },
      },
    },
  });
};

export const createAsset = async (data: any, organizationId: number) => {
  return prisma.asset.create({ 
    data: {
      ...data,
      organizationId
    }
  });
};

export const updateAsset = async (id: number, data: any, organizationId: number, updatedById?: number) => {
  // Get current asset to check for status changes
  const currentAsset = await prisma.asset.findUnique({
    where: { id },
    select: { status: true }
  });

  const result = await prisma.asset.updateMany({
    where: { 
      id,
      organizationId,
    },
    data,
  });

  // Trigger notifications for status changes
  if (currentAsset && data.status && currentAsset.status !== data.status) {
    await notificationTriggersService.onAssetStatusChange(
      id,
      currentAsset.status as AssetStatus,
      data.status as AssetStatus,
      updatedById
    );
  }

  return result;
};

export const deleteAsset = async (id: number, organizationId: number) => {
  return prisma.asset.deleteMany({ 
    where: { 
      id,
      organizationId,
    }
  });
};
