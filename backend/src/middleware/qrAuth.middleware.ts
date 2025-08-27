import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, param, validationResult } from 'express-validator';
import { secureQRService } from '../services/secureQR.service';
import { AuthenticatedRequest } from './auth.middleware';
import { Logger } from './errorHandler.middleware';

// Extended request interface for QR operations
export interface QRAuthenticatedRequest extends AuthenticatedRequest {
  qrContext?: {
    resourceType: string;
    resourceId: string;
    organizationId: number;
    permissions: string[];
    metadata?: Record<string, any>;
  };
  securityContext?: {
    ipAddress: string;
    userAgent: string;
    location?: { latitude: number; longitude: number };
    riskScore: number;
  };
}

/**
 * QR-specific rate limiting middleware
 */
export const qrRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request) => {
    // Dynamic limits based on user role
    const user = (req as AuthenticatedRequest).user;
    if (!user) return 5; // Unauthenticated users: very limited
    
    switch (user.role) {
      case 'ADMIN': return 1000;
      case 'MANAGER': return 500;
      case 'TECHNICIAN': return 100;
      default: return 50;
    }
  },
  message: {
    error: {
      message: 'Too many QR operations. Please try again later.',
      type: 'RateLimitError',
      statusCode: 429,
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const user = (req as AuthenticatedRequest).user;
    return `qr-${user?.id || req.ip}-${req.path}`;
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks or specific scenarios
    return req.path === '/health' || req.path === '/qr/health';
  }
});

/**
 * QR generation rate limiting (more restrictive)
 */
export const qrGenerationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req: Request) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return 0; // No generation for unauthenticated
    
    switch (user.role) {
      case 'ADMIN': return 10000;
      case 'MANAGER': return 1000;
      case 'TECHNICIAN': return 100;
      default: return 10;
    }
  },
  message: {
    error: {
      message: 'QR generation limit exceeded. Contact administrator for higher limits.',
      type: 'GenerationLimitError',
      statusCode: 429
    }
  }
});

/**
 * Input validation schemas for QR operations
 */
export const validateQRGeneration = [
  body('resourceType')
    .isIn(['asset', 'work-order', 'pm-schedule', 'location', 'user', 'part', 'portal'])
    .withMessage('Invalid resource type'),
  body('resourceId')
    .isString()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage('Invalid resource ID format'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array'),
  body('permissions.*')
    .optional()
    .isString()
    .matches(/^[a-zA-Z0-9:_\-]+$/)
    .withMessage('Invalid permission format'),
  body('expiresIn')
    .optional()
    .matches(/^(\d+[smhd])$/)
    .withMessage('Invalid expiration format (use: 30s, 5m, 2h, 7d)'),
  body('scanLimit')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Scan limit must be between 1 and 10000'),
  body('metadata')
    .optional()
    .custom((value) => {
      if (typeof value !== 'object' || value === null) {
        throw new Error('Metadata must be an object');
      }
      // Check for potentially sensitive keys
      const sensitiveKeys = ['password', 'secret', 'key', 'token', 'ssn', 'credit'];
      const keys = JSON.stringify(value).toLowerCase();
      if (sensitiveKeys.some(key => keys.includes(key))) {
        throw new Error('Metadata contains potentially sensitive information');
      }
      return true;
    })
];

export const validateQRScan = [
  param('token')
    .isString()
    .isLength({ min: 50 }) // JWT tokens are typically long
    .matches(/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/)
    .withMessage('Invalid QR token format'),
  body('location')
    .optional()
    .custom((value) => {
      if (value && (typeof value.latitude !== 'number' || typeof value.longitude !== 'number')) {
        throw new Error('Location must have valid latitude and longitude');
      }
      return true;
    })
];

/**
 * Security context middleware - analyzes request for risk factors
 */
export const buildSecurityContext = async (
  req: QRAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Calculate basic risk score
    let riskScore = 0;
    
    // IP-based risk factors
    if (ipAddress === 'unknown') riskScore += 20;
    if (req.headers['x-forwarded-for']) riskScore += 5; // Proxied request
    
    // User-Agent risk factors
    if (userAgent === 'unknown' || userAgent.length < 10) riskScore += 15;
    if (userAgent.toLowerCase().includes('bot')) riskScore += 30;
    
    // Time-based risk factors
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) riskScore += 10; // Outside business hours
    
    // Request pattern risk factors
    const path = req.path.toLowerCase();
    if (path.includes('..') || path.includes('%')) riskScore += 50; // Path traversal attempt
    
    req.securityContext = {
      ipAddress,
      userAgent,
      location: req.body.location,
      riskScore
    };
    
    // Log high-risk requests
    if (riskScore > 50) {
      Logger.warn('High-risk QR request detected', {
        userId: req.user?.id,
        ipAddress,
        userAgent,
        riskScore,
        path: req.path,
        method: req.method
      });
    }
    
    next();
  } catch (error) {
    Logger.error('Security context building failed', error);
    next(error);
  }
};

/**
 * QR token validation middleware
 */
export const validateQRToken = async (
  req: QRAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.params.token;
    const user = req.user;
    const securityContext = req.securityContext;
    
    if (!user || !securityContext) {
      return res.status(401).json({
        error: {
          message: 'Authentication required for QR operations',
          type: 'AuthenticationRequired',
          statusCode: 401
        }
      });
    }
    
    // Block high-risk requests
    if (securityContext.riskScore > 80) {
      Logger.warn('QR access blocked due to high risk score', {
        userId: user.id,
        riskScore: securityContext.riskScore,
        ipAddress: securityContext.ipAddress
      });
      
      return res.status(403).json({
        error: {
          message: 'Access denied due to security concerns',
          type: 'SecurityBlocked',
          statusCode: 403
        }
      });
    }
    
    // Validate the QR token
    const validation = await secureQRService.validateQRToken(
      token,
      user.id,
      securityContext.ipAddress,
      securityContext.userAgent,
      securityContext.location
    );
    
    if (!validation.isValid) {
      return res.status(400).json({
        error: {
          message: validation.error || 'Invalid QR code',
          type: 'QRValidationError',
          statusCode: 400
        }
      });
    }
    
    // Check resource permissions
    const permissionCheck = await secureQRService.checkResourcePermissions(
      user.id,
      validation.organizationId!,
      validation.payload!.resourceType,
      validation.payload!.resourceId,
      validation.payload!.permissions
    );
    
    if (!permissionCheck.hasAccess) {
      Logger.warn('QR access denied due to insufficient permissions', {
        userId: user.id,
        resourceType: validation.payload!.resourceType,
        resourceId: validation.payload!.resourceId,
        requiredPermissions: validation.payload!.permissions,
        userPermissions: permissionCheck.userPermissions
      });
      
      return res.status(403).json({
        error: {
          message: 'Insufficient permissions to access this resource',
          type: 'PermissionDenied',
          statusCode: 403
        }
      });
    }
    
    // Attach QR context to request
    req.qrContext = {
      resourceType: validation.payload!.resourceType,
      resourceId: validation.payload!.resourceId,
      organizationId: validation.organizationId!,
      permissions: permissionCheck.userPermissions,
      metadata: validation.payload!.metadata
    };
    
    Logger.info('QR token validated successfully', {
      userId: user.id,
      resourceType: validation.payload!.resourceType,
      resourceId: validation.payload!.resourceId,
      organizationId: validation.organizationId
    });
    
    next();
    
  } catch (error) {
    Logger.error('QR token validation error', error);
    res.status(500).json({
      error: {
        message: 'QR validation service error',
        type: 'ServiceError',
        statusCode: 500
      }
    });
  }
};

/**
 * QR generation authorization middleware
 */
export const authorizeQRGeneration = async (
  req: QRAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    const { resourceType, resourceId } = req.body;
    
    if (!user) {
      return res.status(401).json({
        error: {
          message: 'Authentication required for QR generation',
          type: 'AuthenticationRequired',
          statusCode: 401
        }
      });
    }
    
    // Check if user can generate QR codes for this resource type
    const canGenerate = await checkQRGenerationPermission(
      user.id,
      user.organizationId,
      resourceType,
      resourceId
    );
    
    if (!canGenerate.allowed) {
      Logger.warn('QR generation denied', {
        userId: user.id,
        resourceType,
        resourceId,
        reason: canGenerate.reason
      });
      
      return res.status(403).json({
        error: {
          message: canGenerate.reason || 'QR generation not permitted',
          type: 'GenerationDenied',
          statusCode: 403
        }
      });
    }
    
    next();
    
  } catch (error) {
    Logger.error('QR generation authorization error', error);
    res.status(500).json({
      error: {
        message: 'Authorization service error',
        type: 'ServiceError',
        statusCode: 500
      }
    });
  }
};

/**
 * Handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        type: 'ValidationError',
        statusCode: 400,
        details: errors.array()
      }
    });
  }
  next();
};

/**
 * Security headers for QR endpoints
 */
export const qrSecurityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // For QR scanner
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"], // For QR images
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Check if user can generate QR codes for specific resource
 */
async function checkQRGenerationPermission(
  userId: number,
  organizationId: number,
  resourceType: string,
  resourceId: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Check if resource exists and user has access
    switch (resourceType) {
      case 'asset':
        const asset = await prisma.asset.findFirst({
          where: { id: parseInt(resourceId), organizationId }
        });
        if (!asset) {
          return { allowed: false, reason: 'Asset not found or access denied' };
        }
        break;
        
      case 'work-order':
        const workOrder = await prisma.workOrder.findFirst({
          where: { id: parseInt(resourceId), organizationId }
        });
        if (!workOrder) {
          return { allowed: false, reason: 'Work order not found or access denied' };
        }
        break;
        
      case 'location':
        const location = await prisma.location.findFirst({
          where: { id: parseInt(resourceId), organizationId }
        });
        if (!location) {
          return { allowed: false, reason: 'Location not found or access denied' };
        }
        break;
        
      // Add other resource types as needed
    }
    
    return { allowed: true };
    
  } catch (error) {
    Logger.error('QR generation permission check failed', error);
    return { allowed: false, reason: 'Permission check failed' };
  }
}

// Import prisma for database operations
import { prisma } from '../lib/prisma';
// Prisma client imported from singleton