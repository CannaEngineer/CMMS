import { PrismaClient, Part } from '@prisma/client';

const prisma = new PrismaClient();

export class PartService {
  async getAllParts(organizationId: number) {
    return prisma.part.findMany({
      where: { organizationId },
      include: {
        supplier: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getPartById(id: number, organizationId: number) {
    return prisma.part.findFirst({
      where: { id, organizationId },
      include: {
        supplier: true,
      },
    });
  }

  async createPart(data: Omit<Part, 'id' | 'createdAt' | 'updatedAt'>) {
    return prisma.part.create({
      data,
      include: {
        supplier: true,
      },
    });
  }

  async updatePart(id: number, organizationId: number, data: Partial<Part>) {
    return prisma.part.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        supplier: true,
      },
    });
  }

  async deletePart(id: number, organizationId: number) {
    return prisma.part.delete({
      where: { id },
    });
  }

  async getLowStockParts(organizationId: number) {
    return prisma.part.findMany({
      where: {
        organizationId,
        stockLevel: {
          lte: prisma.part.fields.reorderPoint,
        },
      },
      include: {
        supplier: true,
      },
      orderBy: { stockLevel: 'asc' },
    });
  }

  async updateStockLevel(id: number, organizationId: number, quantity: number) {
    return prisma.part.update({
      where: { id },
      data: {
        stockLevel: {
          increment: quantity,
        },
        updatedAt: new Date(),
      },
    });
  }
}