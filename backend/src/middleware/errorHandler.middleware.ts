import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  field?: string;
  isOperational?: boolean;
}

// Custom error classes
export class ValidationError extends Error implements ApiError {
  statusCode = 400;
  isOperational = true;
  
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error implements ApiError {
  statusCode = 404;
  isOperational = true;
  
  constructor(resource: string, id?: string) {
    super(id ? `${resource} with id ${id} not found` : `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error implements ApiError {
  statusCode = 401;
  isOperational = true;
  
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error implements ApiError {
  statusCode = 403;
  isOperational = true;
  
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends Error implements ApiError {
  statusCode = 409;
  isOperational = true;
  
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error implements ApiError {
  statusCode = 429;
  isOperational = true;
  
  constructor(message: string = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Error response interface
interface ErrorResponse {
  error: {
    message: string;
    type: string;
    statusCode: number;
    timestamp: string;
    path: string;
    field?: string;
    code?: string;
    requestId?: string;
  };
}

// Logger utility
class Logger {
  static error(message: string, error?: any, context?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: 'ERROR',
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        statusCode: error.statusCode,
        isOperational: error.isOperational
      } : undefined,
      context
    };
    
    console.error(JSON.stringify(logEntry, null, 2));
  }
  
  static warn(message: string, context?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: 'WARN',
      message,
      context
    };
    
    console.warn(JSON.stringify(logEntry, null, 2));
  }
  
  static info(message: string, context?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: 'INFO',
      message,
      context
    };
    
    console.log(JSON.stringify(logEntry, null, 2));
  }
}

// Handle Prisma errors
function handlePrismaError(error: any): ApiError {
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const field = error.meta?.target ? (error.meta.target as string[])[0] : 'field';
        return new ConflictError(`${field} already exists`);
      
      case 'P2025':
        // Record not found
        return new NotFoundError('Record');
      
      case 'P2003':
        // Foreign key constraint violation
        return new ValidationError('Referenced record does not exist');
      
      case 'P2014':
        // Invalid ID
        return new ValidationError('Invalid ID provided');
      
      default:
        Logger.error('Unhandled Prisma error', error);
        return {
          name: 'DatabaseError',
          message: 'Database operation failed',
          statusCode: 500,
          isOperational: true
        } as ApiError;
    }
  }
  
  if (error instanceof PrismaClientValidationError) {
    return new ValidationError('Invalid data provided');
  }
  
  return error;
}

// Main error handler middleware
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate request ID for tracing
  const requestId = req.headers['x-request-id'] as string || 
                   Math.random().toString(36).substring(7);

  // Handle Prisma errors
  if (error.name?.includes('Prisma')) {
    error = handlePrismaError(error);
  }

  // Default to 500 server error
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let type = error.name || 'InternalServerError';

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    type = 'UnauthorizedError';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    type = 'UnauthorizedError';
  }

  // Log error details (but not for operational errors like 404s)
  if (!error.isOperational || statusCode >= 500) {
    Logger.error('Unhandled error occurred', error, {
      requestId,
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
      user: (req as any).user?.id,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
  } else {
    Logger.warn('Operational error occurred', {
      requestId,
      error: { type, message, statusCode },
      method: req.method,
      path: req.path,
      user: (req as any).user?.id
    });
  }

  // Create standardized error response
  const errorResponse: ErrorResponse = {
    error: {
      message,
      type,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      requestId
    }
  };

  // Add field information for validation errors
  if (error.field) {
    errorResponse.error.field = error.field;
  }

  // Add error code if available
  if (error.code) {
    errorResponse.error.code = error.code;
  }

  // Don't expose sensitive information in production
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    errorResponse.error.message = 'An unexpected error occurred';
  }

  res.status(statusCode).json(errorResponse);
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  const error = new NotFoundError('Endpoint', req.path);
  res.status(404).json({
    error: {
      message: error.message,
      type: error.name,
      statusCode: 404,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] as string || 
                   Math.random().toString(36).substring(7);
  
  // Add request ID to headers for client tracking
  res.setHeader('x-request-id', requestId);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    Logger[logLevel as 'info' | 'warn']('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      user: (req as any).user?.id
    });
  });
  
  next();
};

export { Logger };