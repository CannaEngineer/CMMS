import { Request, Response } from 'express';
import { QRService } from '../../services/qr.service';
import { AuthenticatedRequest } from '../../types/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const qrController = {
  // Generate single QR code
  async generateQRCode(req: AuthenticatedRequest, res: Response) {
    try {
      const { entityType, entityId, entityName, metadata, isPublic, allowedUserRoles, maxScans, expiresAt } = req.body;
      const userId = req.user.id;
      const organizationId = req.user.organizationId;

      const qrCode = await QRService.createQRCode(
        {
          entityType,
          entityId,
          entityName,
          metadata,
          isPublic,
          allowedUserRoles,
          maxScans,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined
        },
        organizationId,
        userId
      );

      res.status(201).json({
        success: true,
        data: qrCode
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate QR code'
      });
    }
  },

  // Get QR codes with filtering and pagination
  async getQRCodes(req: AuthenticatedRequest, res: Response) {
    try {
      const { entityType, entityId, page = 1, limit = 20 } = req.query;
      const organizationId = req.user.organizationId;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = { organizationId };
      if (entityType) where.entityType = entityType;
      if (entityId) where.entityId = entityId;

      const [qrCodes, total] = await Promise.all([
        prisma.qRCode.findMany({
          where,
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.qRCode.count({ where })
      ]);

      // Decrypt metadata for response
      const processedQRCodes = qrCodes.map(qrCode => ({
        ...qrCode,
        qrCodeUrl: `${process.env.QR_BASE_URL || 'http://localhost:5000'}/qr/scan/${qrCode.secureToken}`
      }));

      res.json({
        success: true,
        data: processedQRCodes,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching QR codes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch QR codes'
      });
    }
  },

  // Get QR code by ID
  async getQRCodeById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const organizationId = req.user.organizationId;

      const qrCode = await prisma.qRCode.findFirst({
        where: { id, organizationId },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          scanLogs: {
            take: 10,
            orderBy: { scannedAt: 'desc' },
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      });

      if (!qrCode) {
        return res.status(404).json({
          success: false,
          error: 'QR code not found'
        });
      }

      res.json({
        success: true,
        data: {
          ...qrCode,
          qrCodeUrl: `${process.env.QR_BASE_URL || 'http://localhost:5000'}/qr/scan/${qrCode.secureToken}`
        }
      });
    } catch (error) {
      console.error('Error fetching QR code:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch QR code'
      });
    }
  },

  // Update QR code
  async updateQRCode(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, maxScans, expiresAt } = req.body;
      const organizationId = req.user.organizationId;

      const updateData: any = {};
      if (status) updateData.status = status;
      if (maxScans) updateData.maxScans = maxScans;
      if (expiresAt) updateData.expiresAt = new Date(expiresAt);

      const qrCode = await prisma.qRCode.updateMany({
        where: { id, organizationId },
        data: updateData
      });

      if (qrCode.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'QR code not found'
        });
      }

      res.json({
        success: true,
        message: 'QR code updated successfully'
      });
    } catch (error) {
      console.error('Error updating QR code:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update QR code'
      });
    }
  },

  // Revoke QR code
  async revokeQRCode(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const organizationId = req.user.organizationId;

      await QRService.revokeQRCode(id, organizationId);

      res.json({
        success: true,
        message: 'QR code revoked successfully'
      });
    } catch (error) {
      console.error('Error revoking QR code:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to revoke QR code'
      });
    }
  },

  // Scan QR code (public endpoint)
  async scanQRCode(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const { actionType, actionData, location, deviceType } = req.body;
      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip;

      // Extract user info if authenticated
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      const sessionId = req.sessionID || `anon-${Date.now()}`;

      const result = await QRService.logScan(
        {
          secureToken: token,
          actionType,
          actionData,
          location,
          deviceType,
          userAgent,
          ipAddress
        },
        userId,
        sessionId
      );

      res.json({
        success: true,
        data: {
          qrCode: {
            id: result.qrCode.id,
            entityType: result.qrCode.entityType,
            entityId: result.qrCode.entityId,
            entityName: result.qrCode.entityName,
            metadata: result.qrCode.metadata,
            scanCount: result.qrCode.scanCount
          },
          scanLog: {
            id: result.scanLog.id,
            scannedAt: result.scanLog.scannedAt,
            actionTaken: result.scanLog.actionTaken
          }
        }
      });
    } catch (error) {
      console.error('Error scanning QR code:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to scan QR code'
      });
    }
  },

  // Get QR code info without logging scan
  async getQRCodeInfo(req: Request, res: Response) {
    try {
      const { token } = req.params;

      const qrCode = await QRService.getQRCodeByToken(token);

      res.json({
        success: true,
        data: {
          id: qrCode.id,
          entityType: qrCode.entityType,
          entityId: qrCode.entityId,
          entityName: qrCode.entityName,
          metadata: qrCode.metadata,
          isPublic: qrCode.isPublic,
          scanCount: qrCode.scanCount,
          maxScans: qrCode.maxScans,
          expiresAt: qrCode.expiresAt
        }
      });
    } catch (error) {
      console.error('Error fetching QR code info:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch QR code info'
      });
    }
  },

  // Batch generate QR codes
  async batchGenerateQRCodes(req: AuthenticatedRequest, res: Response) {
    try {
      const { items, options } = req.body;
      const userId = req.user.id;
      const organizationId = req.user.organizationId;

      const batchOperation = await QRService.createBatchOperation(
        { items, options, organizationId },
        userId
      );

      res.status(201).json({
        success: true,
        data: batchOperation
      });
    } catch (error) {
      console.error('Error in batch QR generation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process batch QR generation'
      });
    }
  },

  // Get batch operation
  async getBatchOperation(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const organizationId = req.user.organizationId;

      const batchOperation = await prisma.qRBatchOperation.findFirst({
        where: { id, organizationId },
        include: {
          items: {
            include: {
              qrCode: {
                select: { id: true, secureToken: true, qrCodeDataUrl: true }
              }
            }
          },
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (!batchOperation) {
        return res.status(404).json({
          success: false,
          error: 'Batch operation not found'
        });
      }

      res.json({
        success: true,
        data: batchOperation
      });
    } catch (error) {
      console.error('Error fetching batch operation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch batch operation'
      });
    }
  },

  // Get batch operations
  async getBatchOperations(req: AuthenticatedRequest, res: Response) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const organizationId = req.user.organizationId;
      const skip = (Number(page) - 1) * Number(limit);

      const [batchOperations, total] = await Promise.all([
        prisma.qRBatchOperation.findMany({
          where: { organizationId },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.qRBatchOperation.count({ where: { organizationId } })
      ]);

      res.json({
        success: true,
        data: batchOperations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching batch operations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch batch operations'
      });
    }
  },

  // Get analytics
  async getAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      const { days = 30 } = req.query;
      const organizationId = req.user.organizationId;

      const analytics = await QRService.getAnalytics(organizationId, Number(days));

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch analytics'
      });
    }
  },

  // Get scan analytics
  async getScanAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      const { entityType, entityId, days = 30 } = req.query;
      const organizationId = req.user.organizationId;

      const where: any = { organizationId };
      if (entityType || entityId) {
        where.qrCode = {};
        if (entityType) where.qrCode.entityType = entityType;
        if (entityId) where.qrCode.entityId = entityId;
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(days));
      where.scannedAt = { gte: startDate };

      const scanLogs = await prisma.qRScanLog.findMany({
        where,
        include: {
          qrCode: {
            select: { id: true, entityType: true, entityId: true, entityName: true }
          },
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { scannedAt: 'desc' }
      });

      res.json({
        success: true,
        data: scanLogs
      });
    } catch (error) {
      console.error('Error fetching scan analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch scan analytics'
      });
    }
  },

  // Get QR codes for entity
  async getQRCodesForEntity(req: AuthenticatedRequest, res: Response) {
    try {
      const { entityType, entityId } = req.params;
      const organizationId = req.user.organizationId;

      const qrCodes = await QRService.getQRCodesForEntity(
        entityType as any,
        entityId,
        organizationId
      );

      res.json({
        success: true,
        data: qrCodes
      });
    } catch (error) {
      console.error('Error fetching QR codes for entity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch QR codes for entity'
      });
    }
  },

  // Generate QR code for entity
  async generateQRCodeForEntity(req: AuthenticatedRequest, res: Response) {
    try {
      const { entityType, entityId } = req.params;
      const { entityName, metadata } = req.body;
      const userId = req.user.id;
      const organizationId = req.user.organizationId;

      const qrCode = await QRService.createQRCode(
        {
          entityType: entityType as any,
          entityId,
          entityName,
          metadata
        },
        organizationId,
        userId
      );

      res.status(201).json({
        success: true,
        data: qrCode
      });
    } catch (error) {
      console.error('Error generating QR code for entity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate QR code for entity'
      });
    }
  },

  // Get QR templates
  async getQRTemplates(req: AuthenticatedRequest, res: Response) {
    try {
      const organizationId = req.user.organizationId;

      const templates = await prisma.qRTemplate.findMany({
        where: {
          OR: [
            { isPublic: true },
            { organizationId }
          ]
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      console.error('Error fetching QR templates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch QR templates'
      });
    }
  },

  // Create QR template
  async createQRTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, description, category, dimensions, layout, qrSize, fontSize, includeQRBorder, customCSS } = req.body;
      const userId = req.user.id;
      const organizationId = req.user.organizationId;

      const template = await prisma.qRTemplate.create({
        data: {
          name,
          description,
          category,
          dimensions,
          layout,
          qrSize,
          fontSize,
          includeQRBorder,
          customCSS,
          organizationId,
          createdById: userId
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error creating QR template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create QR template'
      });
    }
  },

  // Cleanup expired QR codes
  async cleanupExpiredQRCodes(req: AuthenticatedRequest, res: Response) {
    try {
      // Only allow admins to run cleanup
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      const count = await QRService.cleanupExpiredQRCodes();

      res.json({
        success: true,
        data: {
          expiredCount: count,
          message: `${count} QR codes marked as expired`
        }
      });
    } catch (error) {
      console.error('Error cleaning up expired QR codes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup expired QR codes'
      });
    }
  }
};