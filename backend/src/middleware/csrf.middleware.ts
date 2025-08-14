import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Logger } from './errorHandler.middleware';
import { AuthenticatedRequest } from './auth.middleware';

// In-memory store for CSRF tokens (use Redis in production)
const csrfTokenStore = new Map<string, { token: string; expires: number; userId: number }>();

// CSRF configuration
interface CSRFConfig {
  tokenLength: number;
  tokenExpiry: number; // milliseconds
  cookieName: string;
  headerName: string;
  paramName: string;
  secure: boolean; // HTTPS only
  sameSite: 'strict' | 'lax' | 'none';
  maxTokensPerUser: number;
}

const defaultConfig: CSRFConfig = {
  tokenLength: 32,
  tokenExpiry: 60 * 60 * 1000, // 1 hour
  cookieName: 'csrfToken',
  headerName: 'x-csrf-token',
  paramName: 'csrfToken',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxTokensPerUser: 5
};

/**
 * Generate cryptographically secure CSRF token
 */
function generateCSRFToken(): string {
  return crypto.randomBytes(defaultConfig.tokenLength).toString('hex');
}

/**
 * Generate token key for storage
 */
function generateTokenKey(userId: number, sessionId?: string): string {
  const base = `csrf:${userId}`;
  return sessionId ? `${base}:${sessionId}` : base;
}

/**
 * Clean up expired CSRF tokens
 */
function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [key, value] of csrfTokenStore.entries()) {
    if (value.expires < now) {
      csrfTokenStore.delete(key);
    }
  }
}

/**
 * Limit CSRF tokens per user to prevent memory exhaustion
 */
function limitTokensPerUser(userId: number): void {
  const userTokens = Array.from(csrfTokenStore.entries())
    .filter(([key]) => key.startsWith(`csrf:${userId}`))
    .sort(([, a], [, b]) => b.expires - a.expires); // Sort by expiry desc
  
  // Remove oldest tokens if exceeding limit
  if (userTokens.length >= defaultConfig.maxTokensPerUser) {
    const tokensToRemove = userTokens.slice(defaultConfig.maxTokensPerUser - 1);
    tokensToRemove.forEach(([key]) => csrfTokenStore.delete(key));
  }
}

/**
 * Generate CSRF token endpoint
 * POST /api/csrf/token
 */
export const generateCSRFTokenEndpoint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: {
          message: 'Authentication required for CSRF token generation',
          type: 'AuthenticationRequired',
          statusCode: 401
        }
      });
    }

    // Clean up expired tokens periodically
    if (Math.random() < 0.1) { // 10% chance
      cleanupExpiredTokens();
    }

    // Limit tokens per user
    limitTokensPerUser(user.id);

    // Generate new CSRF token
    const token = generateCSRFToken();
    const expires = Date.now() + defaultConfig.tokenExpiry;
    const sessionId = (req as any).sessionID || req.headers['x-session-id'] as string;
    
    const tokenKey = generateTokenKey(user.id, sessionId);
    
    // Store token
    csrfTokenStore.set(tokenKey, {
      token,
      expires,
      userId: user.id
    });

    // Set secure cookie
    res.cookie(defaultConfig.cookieName, token, {
      httpOnly: true,
      secure: defaultConfig.secure,
      sameSite: defaultConfig.sameSite,
      maxAge: defaultConfig.tokenExpiry,
      path: '/'
    });

    Logger.info('CSRF token generated', {
      userId: user.id,
      sessionId,
      tokenKey,
      expiresAt: new Date(expires).toISOString()
    });

    res.json({
      success: true,
      data: {
        csrfToken: token,
        expiresAt: new Date(expires).toISOString(),
        headerName: defaultConfig.headerName,
        cookieName: defaultConfig.cookieName
      }
    });

  } catch (error) {
    Logger.error('CSRF token generation failed', error);
    res.status(500).json({
      error: {
        message: 'CSRF token generation failed',
        type: 'CSRFGenerationError',
        statusCode: 500
      }
    });
  }
};

/**
 * CSRF protection middleware
 * Validates CSRF tokens for state-changing operations
 */
export const csrfProtection = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
          type: 'AuthenticationRequired',
          statusCode: 401
        }
      });
    }

    // Skip CSRF protection for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Skip CSRF protection for API keys (if implemented)
    if (req.headers['x-api-key']) {
      return next();
    }

    // Extract CSRF token from various sources
    let token: string | undefined;
    
    // 1. Check header
    token = req.headers[defaultConfig.headerName] as string;
    
    // 2. Check body parameter
    if (!token && req.body) {
      token = req.body[defaultConfig.paramName];
    }
    
    // 3. Check cookie (as fallback, less secure)
    if (!token) {
      token = req.cookies?.[defaultConfig.cookieName];
    }

    if (!token) {
      Logger.warn('CSRF token missing', {
        userId: user.id,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(403).json({
        error: {
          message: 'CSRF token required for this operation',
          type: 'CSRFTokenMissing',
          statusCode: 403,
          details: {
            headerName: defaultConfig.headerName,
            paramName: defaultConfig.paramName,
            cookieName: defaultConfig.cookieName
          }
        }
      });
    }

    // Validate token format
    if (!/^[a-fA-F0-9]{64}$/.test(token)) {
      Logger.warn('Invalid CSRF token format', {
        userId: user.id,
        tokenLength: token.length,
        path: req.path
      });

      return res.status(403).json({
        error: {
          message: 'Invalid CSRF token format',
          type: 'CSRFTokenInvalid',
          statusCode: 403
        }
      });
    }

    // Find token in store
    const sessionId = (req as any).sessionID || req.headers['x-session-id'] as string;
    const tokenKey = generateTokenKey(user.id, sessionId);
    
    let storedTokenData = csrfTokenStore.get(tokenKey);
    
    // If session-specific token not found, try user-only key
    if (!storedTokenData) {
      const userOnlyKey = generateTokenKey(user.id);
      storedTokenData = csrfTokenStore.get(userOnlyKey);
    }

    if (!storedTokenData) {
      Logger.warn('CSRF token not found in store', {
        userId: user.id,
        sessionId,
        tokenKey,
        path: req.path
      });

      return res.status(403).json({
        error: {
          message: 'CSRF token not found or expired',
          type: 'CSRFTokenNotFound',
          statusCode: 403
        }
      });
    }

    // Check token expiry
    if (storedTokenData.expires < Date.now()) {
      csrfTokenStore.delete(tokenKey);
      
      Logger.warn('CSRF token expired', {
        userId: user.id,
        tokenKey,
        expiredAt: new Date(storedTokenData.expires).toISOString(),
        path: req.path
      });

      return res.status(403).json({
        error: {
          message: 'CSRF token has expired',
          type: 'CSRFTokenExpired',
          statusCode: 403
        }
      });
    }

    // Verify token matches
    if (!crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(storedTokenData.token, 'hex')
    )) {
      Logger.warn('CSRF token mismatch', {
        userId: user.id,
        tokenKey,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(403).json({
        error: {
          message: 'CSRF token validation failed',
          type: 'CSRFTokenMismatch',
          statusCode: 403
        }
      });
    }

    // Verify user matches (double-check)
    if (storedTokenData.userId !== user.id) {
      Logger.error('CSRF token user mismatch - potential security issue', {
        tokenUserId: storedTokenData.userId,
        requestUserId: user.id,
        tokenKey,
        path: req.path,
        ip: req.ip
      });

      return res.status(403).json({
        error: {
          message: 'CSRF token user mismatch',
          type: 'CSRFTokenUserMismatch',
          statusCode: 403
        }
      });
    }

    // Logger.debug('CSRF token validated successfully', {
    //   userId: user.id,
    //   tokenKey,
    //   path: req.path
    // });

    next();

  } catch (error) {
    Logger.error('CSRF protection error', error);
    res.status(500).json({
      error: {
        message: 'CSRF protection service error',
        type: 'CSRFProtectionError',
        statusCode: 500
      }
    });
  }
};

/**
 * Double-submit cookie pattern for additional protection
 * Validates that cookie and header tokens match
 */
export const doubleSubmitCSRFProtection = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Skip for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    const headerToken = req.headers[defaultConfig.headerName] as string;
    const cookieToken = req.cookies?.[defaultConfig.cookieName];

    if (!headerToken || !cookieToken) {
      return res.status(403).json({
        error: {
          message: 'Double-submit CSRF validation failed: missing tokens',
          type: 'DoubleSubmitCSRFFailed',
          statusCode: 403
        }
      });
    }

    // Tokens must match exactly
    if (!crypto.timingSafeEqual(
      Buffer.from(headerToken, 'hex'),
      Buffer.from(cookieToken, 'hex')
    )) {
      Logger.warn('Double-submit CSRF token mismatch', {
        userId: req.user?.id,
        path: req.path,
        ip: req.ip
      });

      return res.status(403).json({
        error: {
          message: 'Double-submit CSRF validation failed: token mismatch',
          type: 'DoubleSubmitCSRFFailed',
          statusCode: 403
        }
      });
    }

    next();

  } catch (error) {
    Logger.error('Double-submit CSRF protection error', error);
    res.status(500).json({
      error: {
        message: 'Double-submit CSRF protection error',
        type: 'DoubleSubmitCSRFError',
        statusCode: 500
      }
    });
  }
};

/**
 * Origin validation middleware
 * Validates request origin against allowed origins
 */
export const originValidation = (allowedOrigins: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin || req.headers.referer;
    
    if (!origin) {
      // Allow requests without origin (e.g., mobile apps, Postman)
      return next();
    }

    try {
      const originUrl = new URL(origin);
      const isAllowed = allowedOrigins.some(allowed => {
        const allowedUrl = new URL(allowed);
        return originUrl.hostname === allowedUrl.hostname &&
               originUrl.port === allowedUrl.port &&
               originUrl.protocol === allowedUrl.protocol;
      });

      if (!isAllowed) {
        Logger.warn('Origin validation failed', {
          origin,
          allowedOrigins,
          path: req.path,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });

        return res.status(403).json({
          error: {
            message: 'Origin not allowed',
            type: 'OriginNotAllowed',
            statusCode: 403
          }
        });
      }

      next();

    } catch (error) {
      Logger.error('Origin validation error', error);
      res.status(400).json({
        error: {
          message: 'Invalid origin format',
          type: 'InvalidOrigin',
          statusCode: 400
        }
      });
    }
  };
};

/**
 * Cleanup expired tokens periodically
 * Should be called by a cron job or scheduled task
 */
export const cleanupCSRFTokens = (): void => {
  const before = csrfTokenStore.size;
  cleanupExpiredTokens();
  const after = csrfTokenStore.size;
  
  Logger.info('CSRF token cleanup completed', {
    tokensBefore: before,
    tokensAfter: after,
    tokensRemoved: before - after
  });
};

/**
 * Get CSRF statistics (for monitoring)
 */
export const getCSRFStats = (): {
  totalTokens: number;
  activeTokens: number;
  expiredTokens: number;
} => {
  const now = Date.now();
  let activeTokens = 0;
  let expiredTokens = 0;

  for (const [, value] of csrfTokenStore.entries()) {
    if (value.expires >= now) {
      activeTokens++;
    } else {
      expiredTokens++;
    }
  }

  return {
    totalTokens: csrfTokenStore.size,
    activeTokens,
    expiredTokens
  };
};

// Export CSRF router for token generation endpoint
import express from 'express';
import { authenticate } from './auth.middleware';

export const csrfRouter = express.Router();

csrfRouter.post('/token', authenticate, generateCSRFTokenEndpoint);
csrfRouter.get('/stats', authenticate, (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      error: { message: 'Admin access required', statusCode: 403 }
    });
  }
  
  res.json({
    success: true,
    data: getCSRFStats()
  });
});

export default {
  csrfProtection,
  doubleSubmitCSRFProtection,
  originValidation,
  generateCSRFTokenEndpoint,
  cleanupCSRFTokens,
  getCSRFStats,
  csrfRouter
};