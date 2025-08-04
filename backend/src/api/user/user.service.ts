import { PrismaClient, User, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export class UserService {
  async getAllUsers(organizationId: number) {
    return prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password from results
      },
      orderBy: { name: 'asc' },
    });
  }

  async getUserById(id: number, organizationId: number) {
    return prisma.user.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        workOrders: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async createUser(data: { email: string; name: string; password: string; role?: UserRole; organizationId: number }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        role: data.role || UserRole.TECHNICIAN,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateUser(id: number, organizationId: number, data: Partial<User>) {
    const updateData: any = { ...data };
    
    // Hash password if provided
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    
    return prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(id: number, organizationId: number) {
    return prisma.user.delete({
      where: { id },
    });
  }

  async getUserWorkOrders(id: number, organizationId: number) {
    return prisma.workOrder.findMany({
      where: { 
        assignedToId: id,
        organizationId,
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            location: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserStats(organizationId: number) {
    const total = await prisma.user.count({
      where: { organizationId },
    });

    const byRole = await prisma.user.groupBy({
      by: ['role'],
      where: { organizationId },
      _count: {
        role: true,
      },
    });

    const activeUsers = await prisma.user.count({
      where: {
        organizationId,
        workOrders: {
          some: {
            status: {
              in: ['OPEN', 'IN_PROGRESS'],
            },
          },
        },
      },
    });

    return {
      total,
      byRole: byRole.reduce((acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {} as Record<string, number>),
      activeUsers,
    };
  }
}