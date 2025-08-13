import { PrismaClient, QRCodeType, QRCodeStatus, QRScanActionType, QRBatchOperationType } from '@prisma/client';
import QRCode from 'qrcode';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export interface CreateQRCodeRequest {
  entityType: QRCodeType;
  entityId: string;
  entityName?: string;
  metadata?: Record<string, any>;
  isPublic?: boolean;
  allowedUserRoles?: string[];
  maxScans?: number;
  expiresAt?: Date;
}

export interface QRCodeGenerationOptions {
  size?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export interface BatchQRCodeRequest {
  items: CreateQRCodeRequest[];
  options?: QRCodeGenerationOptions;
  organizationId: number;
}

export interface QRScanRequest {
  secureToken: string;
  actionType?: QRScanActionType;
  actionData?: Record<string, any>;
  location?: { latitude: number; longitude: number };
  deviceType?: string;
  userAgent?: string;
  ipAddress?: string;
}

export class QRService {
  private static readonly ENCRYPTION_KEY = process.env.QR_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
  private static readonly JWT_SECRET = process.env.QR_JWT_SECRET || 'qr-jwt-secret-change-in-production';
  private static readonly ALGORITHM = 'aes-256-cbc';

  // Generate secure token for QR code
  private static generateSecureToken(entityType: QRCodeType, entityId: string, organizationId: number): string {
    const payload = {
      entityType,
      entityId,
      organizationId,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex')
    };

    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: '10y' });
  }

  // Validate and decode secure token
  private static validateSecureToken(token: string): any {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired QR code token');
    }
  }

  // Encrypt sensitive metadata
  private static encryptMetadata(metadata: Record<string, any>): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.ALGORITHM, this.ENCRYPTION_KEY);
    let encrypted = cipher.update(JSON.stringify(metadata), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  // Decrypt metadata
  private static decryptMetadata(encryptedMetadata: string): Record<string, any> {
    try {
      const [ivHex, encrypted] = encryptedMetadata.split(':');
      const decipher = crypto.createDecipher(this.ALGORITHM, this.ENCRYPTION_KEY);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to decrypt QR metadata:', error);
      return {};
    }
  }

  // Generate QR code URL
  private static generateQRCodeUrl(secureToken: string): string {
    const baseUrl = process.env.QR_BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/qr/scan/${secureToken}`;
  }

  // Create QR code
  static async createQRCode(
    request: CreateQRCodeRequest,
    organizationId: number,
    createdById: number
  ): Promise<any> {
    // Generate secure token
    const secureToken = this.generateSecureToken(
      request.entityType,
      request.entityId,
      organizationId
    );

    // Encrypt metadata if provided
    const encryptedMetadata = request.metadata 
      ? this.encryptMetadata(request.metadata)
      : null;

    // Generate QR code URL
    const qrCodeUrl = this.generateQRCodeUrl(secureToken);

    // Generate QR code image
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });

    // Save to database
    const qrCode = await prisma.qRCode.create({
      data: {
        entityType: request.entityType,
        entityId: request.entityId,
        entityName: request.entityName,
        secureToken,
        organizationId,
        qrCodeDataUrl,
        metadata: encryptedMetadata,
        status: QRCodeStatus.ACTIVE,
        isPublic: request.isPublic || false,
        allowedUserRoles: request.allowedUserRoles,
        maxScans: request.maxScans,
        expiresAt: request.expiresAt,
        createdById,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        organization: {
          select: { id: true, name: true }
        }
      }
    });

    return {
      ...qrCode,
      metadata: request.metadata, // Return unencrypted metadata
      qrCodeUrl
    };
  }

  // Get QR code by secure token
  static async getQRCodeByToken(secureToken: string): Promise<any> {
    // Validate token
    const tokenPayload = this.validateSecureToken(secureToken);

    // Find QR code
    const qrCode = await prisma.qRCode.findUnique({
      where: { secureToken },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        organization: {
          select: { id: true, name: true }
        }
      }
    });

    if (!qrCode) {
      throw new Error('QR code not found');
    }

    // Check if expired
    if (qrCode.expiresAt && qrCode.expiresAt < new Date()) {
      throw new Error('QR code has expired');
    }

    // Check if revoked
    if (qrCode.status !== QRCodeStatus.ACTIVE) {
      throw new Error('QR code is no longer active');
    }

    // Check scan limit
    if (qrCode.maxScans && qrCode.scanCount >= qrCode.maxScans) {
      throw new Error('QR code scan limit exceeded');
    }

    // Decrypt metadata
    const metadata = qrCode.metadata 
      ? this.decryptMetadata(qrCode.metadata as string)
      : null;

    return {
      ...qrCode,
      metadata,
      tokenPayload
    };
  }

  // Log QR code scan
  static async logScan(
    request: QRScanRequest,
    userId?: number,
    sessionId?: string
  ): Promise<any> {
    // Get QR code
    const qrCode = await this.getQRCodeByToken(request.secureToken);

    // Create scan log
    const scanLog = await prisma.qRScanLog.create({
      data: {
        qrCodeId: qrCode.id,
        userId,
        sessionId,
        actionTaken: request.actionType,
        actionData: request.actionData,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        deviceType: request.deviceType,
        location: request.location,
        organizationId: qrCode.organizationId,
        isSuccessful: true
      }
    });

    // Update QR code scan count and last scanned time
    await prisma.qRCode.update({
      where: { id: qrCode.id },
      data: {
        scanCount: { increment: 1 },
        lastScannedAt: new Date()
      }
    });

    return {
      scanLog,
      qrCode: {
        ...qrCode,
        scanCount: qrCode.scanCount + 1
      }
    };
  }

  // Create batch operation
  static async createBatchOperation(
    request: BatchQRCodeRequest,
    createdById: number
  ): Promise<any> {
    // Create batch operation
    const batchOperation = await prisma.qRBatchOperation.create({
      data: {
        operationType: QRBatchOperationType.GENERATE,
        totalItems: request.items.length,
        options: request.options,
        organizationId: request.organizationId,
        createdById,
        startedAt: new Date()
      }
    });

    // Create batch items
    const batchItems = await Promise.all(
      request.items.map(async (item, index) => {
        try {
          // Create individual QR code
          const qrCode = await this.createQRCode(
            item,
            request.organizationId,
            createdById
          );

          // Create batch item
          return await prisma.qRBatchOperationItem.create({
            data: {
              batchOperationId: batchOperation.id,
              qrCodeId: qrCode.id,
              entityType: item.entityType,
              entityId: item.entityId,
              entityName: item.entityName,
              status: 'COMPLETED',
              resultData: {
                qrCodeDataUrl: qrCode.qrCodeDataUrl,
                secureToken: qrCode.secureToken
              },
              processedAt: new Date()
            }
          });
        } catch (error) {
          // Create failed batch item
          return await prisma.qRBatchOperationItem.create({
            data: {
              batchOperationId: batchOperation.id,
              entityType: item.entityType,
              entityId: item.entityId,
              entityName: item.entityName,
              status: 'FAILED',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              processedAt: new Date()
            }
          });
        }
      })
    );

    // Update batch operation status
    const successfulItems = batchItems.filter(item => 
      item.status === 'COMPLETED'
    ).length;
    const failedItems = batchItems.length - successfulItems;

    await prisma.qRBatchOperation.update({
      where: { id: batchOperation.id },
      data: {
        status: failedItems > 0 ? 'COMPLETED' : 'COMPLETED', // Could be PARTIALLY_COMPLETED
        processedItems: batchItems.length,
        successfulItems,
        failedItems,
        completedAt: new Date()
      }
    });

    return {
      ...batchOperation,
      items: batchItems,
      processedItems: batchItems.length,
      successfulItems,
      failedItems
    };
  }

  // Get QR codes for entity
  static async getQRCodesForEntity(
    entityType: QRCodeType,
    entityId: string,
    organizationId: number
  ): Promise<any[]> {
    const qrCodes = await prisma.qRCode.findMany({
      where: {
        entityType,
        entityId,
        organizationId,
        status: QRCodeStatus.ACTIVE
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return qrCodes.map(qrCode => ({
      ...qrCode,
      metadata: qrCode.metadata 
        ? this.decryptMetadata(qrCode.metadata as string)
        : null,
      qrCodeUrl: this.generateQRCodeUrl(qrCode.secureToken)
    }));
  }

  // Get analytics
  static async getAnalytics(organizationId: number, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalScans, qrCodeCount, topScannedCodes, scansByDay] = await Promise.all([
      // Total scans
      prisma.qRScanLog.count({
        where: {
          organizationId,
          scannedAt: { gte: startDate }
        }
      }),

      // Total QR codes
      prisma.qRCode.count({
        where: { organizationId }
      }),

      // Top scanned QR codes
      prisma.qRCode.findMany({
        where: { organizationId },
        orderBy: { scanCount: 'desc' },
        take: 10,
        select: {
          id: true,
          entityType: true,
          entityId: true,
          entityName: true,
          scanCount: true
        }
      }),

      // Scans by day
      prisma.$queryRaw`
        SELECT 
          DATE(scannedAt) as date,
          COUNT(*) as count
        FROM QRScanLog 
        WHERE organizationId = ${organizationId}
          AND scannedAt >= ${startDate}
        GROUP BY DATE(scannedAt)
        ORDER BY date DESC
      `
    ]);

    return {
      totalScans,
      qrCodeCount,
      topScannedCodes,
      scansByDay,
      period: `${days} days`
    };
  }

  // Revoke QR code
  static async revokeQRCode(
    qrCodeId: string,
    organizationId: number,
    reason?: string
  ): Promise<void> {
    await prisma.qRCode.updateMany({
      where: {
        id: qrCodeId,
        organizationId
      },
      data: {
        status: QRCodeStatus.REVOKED,
        updatedAt: new Date()
      }
    });
  }

  // Cleanup expired QR codes
  static async cleanupExpiredQRCodes(): Promise<number> {
    const result = await prisma.qRCode.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        status: QRCodeStatus.ACTIVE
      },
      data: {
        status: QRCodeStatus.EXPIRED
      }
    });

    return result.count;
  }
}