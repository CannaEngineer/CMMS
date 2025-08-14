import { PrismaClient, Comment, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCommentRequest {
  entityType: 'workOrder' | 'asset' | 'location' | 'part' | 'pmSchedule';
  entityId: number;
  content: string;
  isInternal?: boolean;
  isPinned?: boolean;
  userId: number;
  parentId?: number;
  attachments?: string[];
}

export interface UpdateCommentRequest {
  content?: string;
  isInternal?: boolean;
  isPinned?: boolean;
  attachments?: string[];
  editedById: number;
}

export interface CommentFilters {
  entityType?: string;
  entityId?: number;
  isInternal?: boolean;
  isPinned?: boolean;
  userId?: number;
  parentId?: number;
  includeReplies?: boolean;
}

export class CommentService {
  // Create a new comment
  async createComment(data: CreateCommentRequest): Promise<Comment> {
    const comment = await prisma.comment.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        content: data.content,
        isInternal: data.isInternal || false,
        isPinned: data.isPinned || false,
        userId: data.userId,
        parentId: data.parentId || null,
        attachments: data.attachments ? JSON.stringify(data.attachments) : undefined,
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
        editedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        replies: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return comment;
  }

  // Get comments for an entity
  async getCommentsForEntity(
    entityType: string,
    entityId: number,
    filters?: CommentFilters
  ): Promise<Comment[]> {
    const where: Prisma.CommentWhereInput = {
      entityType,
      entityId,
      parentId: filters?.includeReplies ? undefined : null, // Only top-level comments unless includeReplies is true
    };

    // Apply additional filters
    if (filters?.isInternal !== undefined) {
      where.isInternal = filters.isInternal;
    }
    if (filters?.isPinned !== undefined) {
      where.isPinned = filters.isPinned;
    }
    if (filters?.userId) {
      where.userId = filters.userId;
    }

    const comments = await prisma.comment.findMany({
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
        editedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
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
            editedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: [
        {
          isPinned: 'desc', // Pinned comments first
        },
        {
          createdAt: 'desc', // Newest first
        },
      ],
    });

    return comments;
  }

  // Get a single comment by ID
  async getCommentById(id: number): Promise<Comment | null> {
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        editedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
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
            editedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return comment;
  }

  // Update a comment
  async updateComment(id: number, data: UpdateCommentRequest): Promise<Comment | null> {
    const comment = await prisma.comment.update({
      where: { id },
      data: {
        ...(data.content && { content: data.content }),
        ...(data.isInternal !== undefined && { isInternal: data.isInternal }),
        ...(data.isPinned !== undefined && { isPinned: data.isPinned }),
        ...(data.attachments && { attachments: JSON.stringify(data.attachments) }),
        editedAt: new Date(),
        editedById: data.editedById,
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
        editedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
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
            editedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return comment;
  }

  // Delete a comment
  async deleteComment(id: number): Promise<boolean> {
    try {
      await prisma.comment.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }

  // Get comment count for an entity
  async getCommentCount(entityType: string, entityId: number, includeInternal = true): Promise<number> {
    const where: Prisma.CommentWhereInput = {
      entityType,
      entityId,
    };

    if (!includeInternal) {
      where.isInternal = false;
    }

    const count = await prisma.comment.count({
      where,
    });

    return count;
  }

  // Get recent comments for an entity (for activity feeds)
  async getRecentComments(
    entityType: string,
    entityId: number,
    limit = 5,
    includeInternal = true
  ): Promise<Comment[]> {
    const where: Prisma.CommentWhereInput = {
      entityType,
      entityId,
    };

    if (!includeInternal) {
      where.isInternal = false;
    }

    const comments = await prisma.comment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return comments;
  }

  // Pin/unpin a comment
  async togglePin(id: number, isPinned: boolean, editedById: number): Promise<Comment | null> {
    const comment = await prisma.comment.update({
      where: { id },
      data: {
        isPinned,
        editedAt: new Date(),
        editedById,
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
        editedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return comment;
  }

  // Mark comment as internal/external
  async toggleInternal(id: number, isInternal: boolean, editedById: number): Promise<Comment | null> {
    const comment = await prisma.comment.update({
      where: { id },
      data: {
        isInternal,
        editedAt: new Date(),
        editedById,
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
        editedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return comment;
  }

  // Get all comments by a user
  async getCommentsByUser(userId: number, limit = 50): Promise<Comment[]> {
    const comments = await prisma.comment.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        editedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return comments;
  }

  // Search comments
  async searchComments(
    searchTerm: string,
    entityType?: string,
    entityId?: number,
    limit = 50
  ): Promise<Comment[]> {
    const where: Prisma.CommentWhereInput = {
      content: {
        contains: searchTerm,
      },
    };

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    const comments = await prisma.comment.findMany({
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
        editedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return comments;
  }
}

export const commentService = new CommentService();