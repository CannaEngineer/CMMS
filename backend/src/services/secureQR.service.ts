import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

// Prisma client imported from singleton

// Secure QR Configuration
interface SecureQRConfig {
  encryptionKey: string;
  signingSecret: string;
  tokenExpiry: string; // e.g., '24h', '7d'
  maxScanAttempts: number;
  rateLimitWindow: number; // milliseconds
}

interface SecureQRPayload {
  resourceType: 'asset' | 'work-order' | 'pm-schedule' | 'location' | 'user' | 'part' | 'portal';
  resourceId: string;
  organizationToken: string; // Encrypted org ID
  permissions: string[]; // Required permissions to access
  metadata?: Record<string, any>;
  expiresAt: number;
  nonce: string; // Prevents replay attacks
  scanLimit?: number; // Optional scan limit
}

interface QRAccessLog {
  qrToken: string;
  userId: number;
  organizationId: number;
  ipAddress: string;
  userAgent: string;
  scanResult: 'success' | 'denied' | 'expired' | 'invalid';
  timestamp: number;
  location?: { latitude: number; longitude: number };
}

export class SecureQRService {
  private config: SecureQRConfig;
  private scanAttempts: Map<string, { count: number; firstAttempt: number }> = new Map();

  constructor(config: SecureQRConfig) {
    this.config = config;
  }

  /**
   * Generate secure QR token with cryptographic protection
   */
  public async generateSecureQRToken(
    resourceType: SecureQRPayload['resourceType'],
    resourceId: string,
    organizationId: number,
    requiredPermissions: string[] = [],
    options: {
      expiresIn?: string;
      scanLimit?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string> {
    // Generate organization token (encrypted org ID)
    const organizationToken = this.encryptOrganizationId(organizationId);
    
    // Generate cryptographically secure nonce
    const nonce = crypto.randomBytes(16).toString('hex');
    
    // Calculate expiration
    const expiresAt = Date.now() + this.parseExpiry(options.expiresIn || this.config.tokenExpiry);
    
    // Create payload
    const payload: SecureQRPayload = {
      resourceType,
      resourceId,
      organizationToken,
      permissions: requiredPermissions,
      metadata: options.metadata ? this.encryptMetadata(options.metadata) : undefined,
      expiresAt,
      nonce,
      scanLimit: options.scanLimit
    };

    // Create signed JWT token
    const token = jwt.sign(payload, this.config.signingSecret, {
      algorithm: 'HS256',
      issuer: 'cmms-qr-system',
      audience: 'qr-scanner'
    });

    // Store QR token metadata in database for audit trail
    await this.storeQRTokenMetadata(token, payload, organizationId);

    return token;
  }

  /**
   * Generate secure QR URL with token
   */
  public generateSecureQRURL(token: string, baseUrl: string): string {
    // Use secure path structure that doesn't reveal resource details
    return `${baseUrl}/qr/scan/${token}`;
  }

  /**
   * Validate and decode secure QR token
   */
  public async validateQRToken(
    token: string,
    userId: number,
    ipAddress: string,
    userAgent: string,
    location?: { latitude: number; longitude: number }
  ): Promise<{
    isValid: boolean;
    payload?: SecureQRPayload;
    organizationId?: number;
    error?: string;
  }> {
    try {
      // Rate limiting check
      if (!this.checkRateLimit(token, ipAddress)) {
        await this.logQRAccess(token, userId, 0, ipAddress, userAgent, 'denied', location);
        return { isValid: false, error: 'Rate limit exceeded' };
      }

      // Verify JWT signature and decode
      const decoded = jwt.verify(token, this.config.signingSecret, {
        algorithms: ['HS256'],
        issuer: 'cmms-qr-system',
        audience: 'qr-scanner'
      }) as SecureQRPayload;

      // Check expiration
      if (Date.now() > decoded.expiresAt) {
        await this.logQRAccess(token, userId, 0, ipAddress, userAgent, 'expired', location);
        return { isValid: false, error: 'QR code has expired' };
      }

      // Decrypt organization ID
      const organizationId = this.decryptOrganizationId(decoded.organizationToken);
      
      // Verify user belongs to organization
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          organizationId: organizationId
        }
      });

      if (!user) {
        await this.logQRAccess(token, userId, organizationId, ipAddress, userAgent, 'denied', location);
        return { isValid: false, error: 'Access denied: Organization mismatch' };
      }

      // Check scan limit if specified
      if (decoded.scanLimit) {
        const scanCount = await this.getQRScanCount(token);
        if (scanCount >= decoded.scanLimit) {
          await this.logQRAccess(token, userId, organizationId, ipAddress, userAgent, 'denied', location);
          return { isValid: false, error: 'QR code scan limit exceeded' };
        }
      }

      // Decrypt metadata if present
      if (decoded.metadata) {
        decoded.metadata = this.decryptMetadata(decoded.metadata);
      }

      // Log successful access
      await this.logQRAccess(token, userId, organizationId, ipAddress, userAgent, 'success', location);
      
      // Update scan count
      await this.incrementQRScanCount(token);

      return { 
        isValid: true, 
        payload: decoded, 
        organizationId 
      };

    } catch (error) {
      await this.logQRAccess(token, userId, 0, ipAddress, userAgent, 'invalid', location);
      
      if (error instanceof jwt.JsonWebTokenError) {
        return { isValid: false, error: 'Invalid QR code signature' };
      } else if (error instanceof jwt.TokenExpiredError) {
        return { isValid: false, error: 'QR code has expired' };
      }
      
      return { isValid: false, error: 'QR code validation failed' };
    }
  }

  /**
   * Check user permissions for QR resource access
   */
  public async checkResourcePermissions(
    userId: number,
    organizationId: number,
    resourceType: string,
    resourceId: string,
    requiredPermissions: string[]
  ): Promise<{ hasAccess: boolean; userPermissions: string[] }> {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
      select: { role: true }
    });

    if (!user) {
      return { hasAccess: false, userPermissions: [] };
    }

    // Define role-based permissions
    const rolePermissions = this.getRolePermissions(user.role);
    
    // Check if user has all required permissions
    const hasAccess = requiredPermissions.every(permission => 
      rolePermissions.includes(permission) || rolePermissions.includes('*')
    );

    return { hasAccess, userPermissions: rolePermissions };
  }

  /**
   * Revoke QR token (mark as invalid)
   */
  public async revokeQRToken(token: string, revokedBy: number): Promise<void> {
    await prisma.$executeRaw`
      UPDATE QRTokenMetadata 
      SET isRevoked = true, revokedAt = ${Date.now()}, revokedBy = ${revokedBy}
      WHERE token = ${token}
    `;
  }

  /**
   * Encrypt organization ID to prevent enumeration
   */
  private encryptOrganizationId(organizationId: number): string {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(organizationId.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt organization ID
   */
  private decryptOrganizationId(encryptedOrgId: string): number {
    const [ivHex, encrypted] = encryptedOrgId.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return parseInt(decrypted, 10);
  }

  /**
   * Encrypt sensitive metadata
   */
  private encryptMetadata(metadata: Record<string, any>): Record<string, any> {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const jsonString = JSON.stringify(metadata);
    let encrypted = cipher.update(jsonString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { _encrypted: iv.toString('hex') + ':' + encrypted };
  }

  /**
   * Decrypt metadata
   */
  private decryptMetadata(encryptedMetadata: Record<string, any>): Record<string, any> {
    if (!encryptedMetadata._encrypted) {
      return encryptedMetadata;
    }
    
    const [ivHex, encrypted] = encryptedMetadata._encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  /**
   * Rate limiting implementation
   */
  private checkRateLimit(token: string, ipAddress: string): boolean {
    const key = `${token}:${ipAddress}`;
    const now = Date.now();
    const attempts = this.scanAttempts.get(key);

    if (!attempts) {
      this.scanAttempts.set(key, { count: 1, firstAttempt: now });
      return true;
    }

    // Reset window if expired
    if (now - attempts.firstAttempt > this.config.rateLimitWindow) {
      this.scanAttempts.set(key, { count: 1, firstAttempt: now });
      return true;
    }

    // Check if within limits
    if (attempts.count >= this.config.maxScanAttempts) {
      return false;
    }

    // Increment counter
    attempts.count++;
    return true;
  }

  /**
   * Parse expiry string to milliseconds
   */
  private parseExpiry(expiry: string): number {
    const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error('Invalid expiry format');
    
    const [, value, unit] = match;
    return parseInt(value) * units[unit as keyof typeof units];
  }

  /**
   * Get role-based permissions
   */
  private getRolePermissions(role: string): string[] {
    const permissions = {
      ADMIN: ['*'], // Full access
      MANAGER: [
        'qr:scan', 'qr:generate', 'asset:read', 'asset:write',
        'workorder:read', 'workorder:write', 'pm:read', 'pm:write'
      ],
      TECHNICIAN: [
        'qr:scan', 'asset:read', 'workorder:read', 'workorder:update',
        'pm:read', 'pm:complete'
      ]
    };
    
    return permissions[role as keyof typeof permissions] || ['qr:scan'];
  }

  /**
   * Store QR token metadata for audit trail
   */
  private async storeQRTokenMetadata(
    token: string, 
    payload: SecureQRPayload, 
    organizationId: number
  ): Promise<void> {
    // This would require a QRTokenMetadata table in your schema
    // For now, we'll use a simple approach
    await prisma.$executeRaw`
      INSERT INTO QRTokenMetadata (
        token, resourceType, resourceId, organizationId, 
        expiresAt, createdAt, isRevoked, scanCount
      ) VALUES (
        ${token}, ${payload.resourceType}, ${payload.resourceId}, 
        ${organizationId}, ${payload.expiresAt}, ${Date.now()}, 
        false, 0
      )
    `;
  }

  /**
   * Log QR access attempts for security monitoring
   */
  private async logQRAccess(
    qrToken: string,
    userId: number,
    organizationId: number,
    ipAddress: string,
    userAgent: string,
    scanResult: QRAccessLog['scanResult'],
    location?: { latitude: number; longitude: number }
  ): Promise<void> {
    const logEntry: QRAccessLog = {
      qrToken,
      userId,
      organizationId,
      ipAddress,
      userAgent,
      scanResult,
      timestamp: Date.now(),
      location
    };

    // Store in audit log table
    await prisma.$executeRaw`
      INSERT INTO QRAccessLog (
        qrToken, userId, organizationId, ipAddress, userAgent,
        scanResult, timestamp, latitude, longitude
      ) VALUES (
        ${logEntry.qrToken}, ${logEntry.userId}, ${logEntry.organizationId},
        ${logEntry.ipAddress}, ${logEntry.userAgent}, ${logEntry.scanResult},
        ${logEntry.timestamp}, ${logEntry.location?.latitude || null},
        ${logEntry.location?.longitude || null}
      )
    `;
  }

  /**
   * Get QR scan count
   */
  private async getQRScanCount(token: string): Promise<number> {
    const result = await prisma.$queryRaw`
      SELECT scanCount FROM QRTokenMetadata WHERE token = ${token}
    ` as Array<{ scanCount: number }>;
    
    return result[0]?.scanCount || 0;
  }

  /**
   * Increment QR scan count
   */
  private async incrementQRScanCount(token: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE QRTokenMetadata 
      SET scanCount = scanCount + 1, lastScannedAt = ${Date.now()}
      WHERE token = ${token}
    `;
  }
}

// Export singleton with production configuration
export const secureQRService = new SecureQRService({
  encryptionKey: process.env.QR_ENCRYPTION_KEY || 'default-dev-key-change-in-production',
  signingSecret: process.env.QR_SIGNING_SECRET || 'default-dev-secret-change-in-production',
  tokenExpiry: process.env.QR_TOKEN_EXPIRY || '24h',
  maxScanAttempts: parseInt(process.env.QR_MAX_SCAN_ATTEMPTS || '10'),
  rateLimitWindow: parseInt(process.env.QR_RATE_LIMIT_WINDOW || '900000') // 15 minutes
});