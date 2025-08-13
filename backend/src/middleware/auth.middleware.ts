
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { UnauthorizedError, Logger } from './errorHandler.middleware';

const prisma = new PrismaClient();

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
