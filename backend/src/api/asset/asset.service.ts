
import { PrismaClient } from '@prisma/client';

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

export const createAsset = async (data: any) => {
  return prisma.asset.create({ data });
};

export const updateAsset = async (id: number, data: any, organizationId: number) => {
  return prisma.asset.updateMany({
    where: { 
      id,
      organizationId,
    },
    data,
  });
};

export const deleteAsset = async (id: number, organizationId: number) => {
  return prisma.asset.deleteMany({ 
    where: { 
      id,
      organizationId,
    }
  });
};
