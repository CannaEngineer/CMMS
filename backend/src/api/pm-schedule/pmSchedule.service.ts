import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PMScheduleService {
  async getAllPMSchedules() {
    return prisma.pMSchedule.findMany({
      include: {
        asset: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    });
  }

  async getPMScheduleById(id: number) {
    return prisma.pMSchedule.findUnique({
      where: { id },
      include: {
        asset: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    });
  }

  async createPMSchedule(data: any) {
    return prisma.pMSchedule.create({
      data,
    });
  }

  async updatePMSchedule(id: number, data: any) {
    return prisma.pMSchedule.update({
      where: { id },
      data,
    });
  }

  async deletePMSchedule(id: number) {
    return prisma.pMSchedule.delete({
      where: { id },
    });
  }
}