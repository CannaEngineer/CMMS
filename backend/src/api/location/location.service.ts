import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllLocations = async () => {
  return prisma.location.findMany();
};

export const getLocationById = async (id: number) => {
  return prisma.location.findUnique({ where: { id } });
};

export const createLocation = async (data: any) => {
  return prisma.location.create({ data });
};

export const updateLocation = async (id: number, data: any) => {
  return prisma.location.update({
    where: { id },
    data,
  });
};

export const deleteLocation = async (id: number) => {
  return prisma.location.delete({ where: { id } });
};
