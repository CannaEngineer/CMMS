import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class WorkOrderNotesService {
  async addNote(workOrderId: number, userId: number, content: string, isInternal = false) {
    const note = await prisma.comment.create({
      data: {
        entityType: 'workOrder',
        entityId: workOrderId,
        content,
        isInternal,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return note;
  }

  async getNotes(workOrderId: number, includeInternal = true) {
    const where: any = {
      entityType: 'workOrder',
      entityId: workOrderId,
      parentId: null, // Only top-level comments
    };

    if (!includeInternal) {
      where.isInternal = false;
    }

    const notes = await prisma.comment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return notes;
  }

  async getNotesCount(workOrderId: number, includeInternal = true) {
    const where: any = {
      entityType: 'workOrder',
      entityId: workOrderId,
    };

    if (!includeInternal) {
      where.isInternal = false;
    }

    return await prisma.comment.count({ where });
  }
}