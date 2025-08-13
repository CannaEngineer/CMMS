
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { UnauthorizedError, Logger } from './errorHandler.middleware';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
    organizationId: number;
    organization: any;
  };
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authorization token required');
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedError('Authorization token required');
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token has expired');
      } else if (jwtError.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid token');
      } else {
        throw new UnauthorizedError('Token verification failed');
      }
    }
    
    if (!decoded.userId) {
      throw new UnauthorizedError('Invalid token payload');
    }

    // Fetch full user details including organization
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organization: true
      }
    });

    if (!user) {
      throw new UnauthorizedError('User account not found');
    }

    // Check if user account is active (if you have this field)
    if (user.status && user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User account is not active');
    }

    // Update user's last seen and activity time
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastSeen: new Date(),
        lastActivity: new Date(),
        isOnline: true
      }
    });

    // Attach user info to request
    (req as any).user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organization: user.organization
    };
    
    // Log successful authentication in development
    if (process.env.NODE_ENV === 'development') {
      Logger.info('User authenticated', {
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        path: req.path,
        method: req.method
      });
    }
    
    next();
  } catch (error) {
    // Log authentication failures for security monitoring
    Logger.warn('Authentication failed', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    next(error);
  }
};

// Admin-only middleware (requires authenticate middleware to run first)
export const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: { 
          message: 'Authentication required', 
          type: 'UnauthorizedError',
          statusCode: 401,
          timestamp: new Date().toISOString(),
          path: req.path
        } 
      });
    }
    
    if (req.user.role !== 'ADMIN') {
      Logger.warn('Admin access denied', {
        userId: req.user.id,
        role: req.user.role,
        path: req.path,
        method: req.method,
        organizationId: req.user.organizationId
      });
      
      return res.status(403).json({ 
        error: { 
          message: 'Admin access required. Only administrators can perform this action.', 
          type: 'ForbiddenError',
          statusCode: 403,
          timestamp: new Date().toISOString(),
          path: req.path
        } 
      });
    }
    
    Logger.info('Admin access granted', {
      userId: req.user.id,
      path: req.path,
      method: req.method,
      organizationId: req.user.organizationId
    });
    
    next();
  } catch (error: any) {
    Logger.error('Admin authorization error', error);
    res.status(500).json({ 
      error: { 
        message: 'Internal server error during authorization', 
        type: 'InternalServerError',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: req.path
      } 
    });
  }
};
