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
        isOnline: true,
        lastSeen: true,
        lastActivity: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateUser(id: number, organizationId: number, data: Partial<User>) {
    const updateData: any = {};
    
    // Only include valid User model fields
    const validFields = ['email', 'name', 'role', 'isOnline', 'lastSeen', 'lastActivity'];
    validFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });
    
    // Handle password update separately with validation
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
        isOnline: true,
        lastSeen: true,
        lastActivity: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updatePassword(id: number, organizationId: number, currentPassword: string, newPassword: string) {
    // First verify the current password
    const user = await prisma.user.findFirst({
      where: { id, organizationId },
      select: { password: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash and update the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    return prisma.user.update({
      where: { id },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isOnline: true,
        lastSeen: true,
        lastActivity: true,
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