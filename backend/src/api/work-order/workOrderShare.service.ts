import { prisma } from '../../lib/prisma';
import { randomBytes } from 'crypto';

// Prisma client imported from singleton

export interface CreateShareRequest {
  workOrderId: number;
  organizationId: number;
  createdById: number;
  expiresAt?: Date;
  maxViews?: number;
  allowComments?: boolean;
  allowDownload?: boolean;
  viewerCanSeeAssignee?: boolean;
  sanitizationLevel?: 'MINIMAL' | 'STANDARD' | 'STRICT';
}

export interface SanitizedWorkOrder {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignedTo?: { name: string } | null;
  asset?: { name: string } | null;
  createdAt: Date;
  updatedAt: Date;
  totalLoggedHours?: number;
}

export class WorkOrderShareService {
  
  private generateSecureToken(): string {
    // Generate 32 bytes (256 bits) of cryptographically secure random data
    return randomBytes(32).toString('base64url');
  }

  private hashIpAddress(ipAddress: string): string {
    const crypto = require('crypto');
    const salt = process.env.IP_HASH_SALT || 'default-salt-change-in-production';
    return crypto.createHash('sha256').update(ipAddress + salt).digest('hex');
  }

  async createShare(data: CreateShareRequest) {
    const shareToken = this.generateSecureToken();

    const share = await prisma.workOrderShare.create({
      data: {
        shareToken,
        workOrderId: data.workOrderId,
        organizationId: data.organizationId,
        createdById: data.createdById,
        expiresAt: data.expiresAt,
        maxViews: data.maxViews,
        allowComments: data.allowComments ?? true,
        allowDownload: data.allowDownload ?? false,
        viewerCanSeeAssignee: data.viewerCanSeeAssignee ?? false,
        sanitizationLevel: data.sanitizationLevel ?? 'STANDARD',
      },
      include: {
        workOrder: {
          include: {
            assignedTo: {
              select: { name: true }
            },
            asset: {
              select: { name: true }
            }
          }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return share;
  }

  async getShareByToken(shareToken: string) {
    const share = await prisma.workOrderShare.findUnique({
      where: { shareToken },
      include: {
        workOrder: {
          include: {
            assignedTo: {
              select: { name: true }
            },
            asset: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!share) {
      return null;
    }

    // Check if share is active and not expired
    if (!share.isActive || (share.expiresAt && share.expiresAt < new Date())) {
      return null;
    }

    // Check view limits
    if (share.maxViews && share.currentViews >= share.maxViews) {
      return null;
    }

    return share;
  }

  async incrementViewCount(shareToken: string) {
    await prisma.workOrderShare.update({
      where: { shareToken },
      data: {
        currentViews: {
          increment: 1
        },
        lastAccessedAt: new Date()
      }
    });
  }

  private sanitizeWorkOrder(workOrder: any, sanitizationLevel: string, viewerCanSeeAssignee: boolean): SanitizedWorkOrder {
    const base = {
      id: workOrder.id,
      title: workOrder.title,
      status: workOrder.status,
      priority: workOrder.priority,
      createdAt: workOrder.createdAt,
      updatedAt: workOrder.updatedAt
    };

    switch (sanitizationLevel) {
      case 'MINIMAL':
        return base;
      
      case 'STANDARD':
        return {
          ...base,
          description: workOrder.description,
          asset: workOrder.asset ? { name: workOrder.asset.name } : null,
          totalLoggedHours: workOrder.totalLoggedHours
        };
      
      case 'STRICT':
        return {
          ...base,
          description: workOrder.description,
          assignedTo: viewerCanSeeAssignee && workOrder.assignedTo 
            ? { name: workOrder.assignedTo.name } 
            : null,
          asset: workOrder.asset ? { name: workOrder.asset.name } : null,
          totalLoggedHours: workOrder.totalLoggedHours
        };
      
      default:
        throw new Error('Invalid sanitization level');
    }
  }

  async getPublicWorkOrder(shareToken: string, ipAddress: string) {
    const share = await this.getShareByToken(shareToken);
    
    if (!share) {
      return null;
    }

    // Increment view count and log access
    await this.incrementViewCount(shareToken);
    await this.logShareAccess(share.id, 'VIEW', ipAddress);

    // Sanitize work order data based on share settings
    const sanitizedWorkOrder = this.sanitizeWorkOrder(
      share.workOrder,
      share.sanitizationLevel,
      share.viewerCanSeeAssignee
    );

    return {
      workOrder: sanitizedWorkOrder,
      share: {
        id: share.id,
        allowComments: share.allowComments,
        allowDownload: share.allowDownload,
        currentViews: share.currentViews + 1, // Include the current view
        expiresAt: share.expiresAt
      }
    };
  }

  private async logShareAccess(shareId: string, action: string, ipAddress: string, userAgent?: string) {
    try {
      await prisma.shareAuditLog.create({
        data: {
          shareId,
          action,
          ipAddressHash: this.hashIpAddress(ipAddress),
          userAgent: userAgent?.substring(0, 500) || null,
        }
      });
    } catch (error) {
      console.error('Error logging share access:', error);
      // Don't throw error as this shouldn't break the main functionality
    }
  }

  async addPublicComment(shareId: string, content: string, authorName: string | null, authorEmail: string | null, ipAddress: string, userAgent?: string) {
    // Validate and sanitize comment content
    const sanitizedContent = this.validateAndSanitizeComment(content);

    const comment = await prisma.publicComment.create({
      data: {
        shareId,
        content: sanitizedContent,
        authorName: authorName?.substring(0, 100) || null, // Limit name length
        authorEmail: authorEmail?.substring(0, 255) || null,
        status: 'PENDING', // All comments start as pending moderation
        ipAddressHash: this.hashIpAddress(ipAddress),
        userAgent: userAgent?.substring(0, 500) || null
      }
    });

    // Log comment creation
    await this.logShareAccess(shareId, 'COMMENT', ipAddress, userAgent);

    return comment;
  }

  private validateAndSanitizeComment(content: string): string {
    if (!content || content.trim().length === 0) {
      throw new Error('Comment cannot be empty');
    }
    
    if (content.length > 5000) {
      throw new Error('Comment too long (max 5000 characters)');
    }

    // Basic content filtering
    const prohibitedPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // event handlers
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];

    for (const pattern of prohibitedPatterns) {
      if (pattern.test(content)) {
        throw new Error('Comment contains prohibited content');
      }
    }

    // Return trimmed content (basic sanitization)
    return content.trim();
  }

  async getPublicComments(shareId: string, status: string = 'APPROVED') {
    const comments = await prisma.publicComment.findMany({
      where: {
        shareId,
        status
      },
      select: {
        id: true,
        content: true,
        authorName: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return comments;
  }

  async deactivateShare(shareId: string) {
    await prisma.workOrderShare.update({
      where: { id: shareId },
      data: { isActive: false }
    });
  }

  async getSharesByWorkOrder(workOrderId: number) {
    const shares = await prisma.workOrderShare.findMany({
      where: { workOrderId },
      include: {
        createdBy: {
          select: { id: true, name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return shares;
  }
}