
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllAssets = async () => {
  return prisma.asset.findMany({
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

export const getAssetById = async (id: number) => {
  return prisma.asset.findUnique({
    where: { id },
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

export const updateAsset = async (id: number, data: any) => {
  return prisma.asset.update({
    where: { id },
    data,
  });
};

export const deleteAsset = async (id: number) => {
  return prisma.asset.delete({ where: { id } });
};
