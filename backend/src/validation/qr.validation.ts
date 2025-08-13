import { body, param, query, ValidationChain } from 'express-validator';
import { Request } from 'express';
import crypto from 'crypto';

/**
 * Comprehensive validation schemas for QR operations
 * Implements defense-in-depth validation with security focus
 */

// Security-focused regex patterns
const SECURITY_PATTERNS = {
  // Resource ID: alphanumeric, hyphens, underscores only
  RESOURCE_ID: /^[a-zA-Z0-9\-_]{1,100}$/,
  
  // QR Token: JWT format validation
  QR_TOKEN: /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/,
  
  // Permission format: namespace:action
  PERMISSION: /^[a-zA-Z0-9_\-]+:[a-zA-Z0-9_\-\*]+$/,
  
  // Time format: number followed by unit (s, m, h, d)
  TIME_DURATION: /^(\d+)([smhd])$/,
  
  // IP Address (basic validation)
  IP_ADDRESS: /^(\d{1,3}\.){3}\d{1,3}$|^([a-f0-9:]+:+)+[a-f0-9]+$/i,
  
  // Safe string (no HTML, scripts, or SQL injection patterns)
  SAFE_STRING: /^[^<>'"\\;(){}[\]]*$/,
  
  // Base64 pattern for encrypted data
  BASE64: /^[A-Za-z0-9+/]*={0,2}$/
};

// Dangerous patterns to reject
const DANGEROUS_PATTERNS = [
  // SQL injection patterns
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
  /(['"][\s]*;[\s]*--)/i,
  /(\/\*[\s\S]*?\*\/)/,
  
  // XSS patterns
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
  
  // Path traversal
  /\.\.[\/\\]/,
  /(\/|\\)+(etc|windows|system32)/i,
  
  // Command injection
  /[;&|`$()]/,
  /(nc|netcat|wget|curl)\s/i
];

/**
 * Check if input contains dangerous patterns
 */
function containsDangerousPattern(input: string): boolean {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Sanitize metadata to prevent XSS and injection attacks
 */
function sanitizeMetadata(metadata: any): boolean {
  if (typeof metadata !== 'object' || metadata === null) {
    return false;
  }
  
  const jsonString = JSON.stringify(metadata);
  
  // Check for dangerous patterns
  if (containsDangerousPattern(jsonString)) {
    return false;
  }
  
  // Check for excessively long strings (potential DoS)
  if (jsonString.length > 10000) {
    return false;
  }
  
  // Check for deeply nested objects (potential DoS)
  const maxDepth = 5;
  function getDepth(obj: any, depth = 0): number {
    if (depth > maxDepth) return depth;
    if (typeof obj !== 'object' || obj === null) return depth;
    
    return Math.max(...Object.values(obj).map(value => getDepth(value, depth + 1)));
  }
  
  if (getDepth(metadata) > maxDepth) {
    return false;
  }
  
  // Check for sensitive data patterns
  const sensitiveKeys = [
    'password', 'secret', 'key', 'token', 'ssn', 'social',
    'credit', 'card', 'cvv', 'pin', 'private', 'confidential'
  ];
  
  const keysAndValues = jsonString.toLowerCase();
  if (sensitiveKeys.some(key => keysAndValues.includes(key))) {
    return false;
  }
  
  return true;
}

/**
 * QR Generation Validation
 */
export const validateQRGeneration: ValidationChain[] = [
  // Resource Type Validation
  body('resourceType')
    .trim()
    .isIn(['asset', 'work-order', 'pm-schedule', 'location', 'user', 'part', 'portal'])
    .withMessage('Invalid resource type')
    .custom((value) => {
      if (containsDangerousPattern(value)) {
        throw new Error('Resource type contains invalid characters');
      }
      return true;
    }),
  
  // Resource ID Validation
  body('resourceId')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Resource ID must be 1-100 characters')
    .matches(SECURITY_PATTERNS.RESOURCE_ID)
    .withMessage('Resource ID contains invalid characters')
    .custom((value) => {
      if (containsDangerousPattern(value)) {
        throw new Error('Resource ID contains dangerous patterns');
      }
      return true;
    }),
  
  // Permissions Validation
  body('permissions')
    .optional()
    .isArray({ max: 50 })
    .withMessage('Permissions must be an array with max 50 items')
    .custom((permissions) => {
      if (!Array.isArray(permissions)) return true;
      
      for (const permission of permissions) {
        if (typeof permission !== 'string') {
          throw new Error('All permissions must be strings');
        }
        
        if (!SECURITY_PATTERNS.PERMISSION.test(permission)) {
          throw new Error(`Invalid permission format: ${permission}`);
        }
        
        if (containsDangerousPattern(permission)) {
          throw new Error(`Permission contains dangerous patterns: ${permission}`);
        }
        
        if (permission.length > 100) {
          throw new Error(`Permission too long: ${permission}`);
        }
      }
      
      // Check for duplicate permissions
      const uniquePermissions = new Set(permissions);
      if (uniquePermissions.size !== permissions.length) {
        throw new Error('Duplicate permissions not allowed');
      }
      
      return true;
    }),
  
  // Expiration Validation
  body('expiresIn')
    .optional()
    .matches(SECURITY_PATTERNS.TIME_DURATION)
    .withMessage('Invalid expiration format (use: 30s, 5m, 2h, 7d)')
    .custom((value) => {
      if (!value) return true;
      
      const match = value.match(SECURITY_PATTERNS.TIME_DURATION);
      if (!match) return false;
      
      const [, num, unit] = match;
      const number = parseInt(num);
      
      // Enforce reasonable limits
      const limits = { s: 3600, m: 1440, h: 168, d: 30 }; // 1hr, 24hr, 1week, 30days
      if (number > limits[unit as keyof typeof limits]) {
        throw new Error(`Expiration too long for unit ${unit}`);
      }
      
      return true;
    }),
  
  // Scan Limit Validation
  body('scanLimit')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Scan limit must be between 1 and 10000'),
  
  // Metadata Validation
  body('metadata')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined) return true;
      
      if (!sanitizeMetadata(value)) {
        throw new Error('Metadata contains invalid or potentially dangerous content');
      }
      
      return true;
    })
];

/**
 * QR Scan Validation
 */
export const validateQRScan: ValidationChain[] = [
  // Token Validation
  param('token')
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Invalid token length')
    .matches(SECURITY_PATTERNS.QR_TOKEN)
    .withMessage('Invalid QR token format')
    .custom((value) => {
      if (containsDangerousPattern(value)) {
        throw new Error('Token contains dangerous patterns');
      }
      
      // Additional JWT structure validation
      const parts = value.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT structure');
      }
      
      // Check if parts are valid base64
      for (const part of parts) {
        if (!SECURITY_PATTERNS.BASE64.test(part.replace(/-/g, '+').replace(/_/g, '/'))) {
          throw new Error('Invalid JWT encoding');
        }
      }
      
      return true;
    }),
  
  // Optional location validation
  body('location')
    .optional()
    .custom((location) => {
      if (!location) return true;
      
      if (typeof location !== 'object') {
        throw new Error('Location must be an object');
      }
      
      const { latitude, longitude } = location;
      
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        throw new Error('Latitude and longitude must be numbers');
      }
      
      // Validate coordinate ranges
      if (latitude < -90 || latitude > 90) {
        throw new Error('Invalid latitude range');
      }
      
      if (longitude < -180 || longitude > 180) {
        throw new Error('Invalid longitude range');
      }
      
      return true;
    })
];

/**
 * QR Action Validation
 */
export const validateQRAction: ValidationChain[] = [
  // Include scan validation
  ...validateQRScan,
  
  // Action Type Validation
  body('actionType')
    .trim()
    .isIn(['view', 'edit', 'delete', 'assign', 'complete', 'update', 'create'])
    .withMessage('Invalid action type')
    .custom((value) => {
      if (containsDangerousPattern(value)) {
        throw new Error('Action type contains dangerous patterns');
      }
      return true;
    }),
  
  // Action Data Validation
  body('actionData')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined) return true;
      
      if (typeof value !== 'object') {
        throw new Error('Action data must be an object');
      }
      
      const jsonString = JSON.stringify(value);
      
      // Size limit
      if (jsonString.length > 50000) {
        throw new Error('Action data too large');
      }
      
      // Check for dangerous patterns
      if (containsDangerousPattern(jsonString)) {
        throw new Error('Action data contains dangerous patterns');
      }
      
      return true;
    })
];

/**
 * QR Audit Query Validation
 */
export const validateQRAudit: ValidationChain[] = [
  // Page validation
  query('page')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Page must be between 1 and 10000'),
  
  // Limit validation
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  
  // Resource Type filter
  query('resourceType')
    .optional()
    .isIn(['asset', 'work-order', 'pm-schedule', 'location', 'user', 'part', 'portal'])
    .withMessage('Invalid resource type filter'),
  
  // Scan Result filter
  query('scanResult')
    .optional()
    .isIn(['success', 'denied', 'expired', 'invalid'])
    .withMessage('Invalid scan result filter'),
  
  // Date range validation
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((endDate, { req }) => {
      if (!endDate || !req.query?.startDate) return true;
      
      const start = new Date(req.query.startDate as string);
      const end = new Date(endDate);
      
      if (end <= start) {
        throw new Error('End date must be after start date');
      }
      
      // Limit date range to prevent performance issues
      const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 90) {
        throw new Error('Date range cannot exceed 90 days');
      }
      
      return true;
    })
];

/**
 * IP Address validation for security logging
 */
export const validateIPAddress = (ip: string): boolean => {
  return SECURITY_PATTERNS.IP_ADDRESS.test(ip);
};

/**
 * User Agent validation for security logging
 */
export const validateUserAgent = (userAgent: string): boolean => {
  // Basic checks for user agent
  if (!userAgent || userAgent.length < 10 || userAgent.length > 1000) {
    return false;
  }
  
  if (containsDangerousPattern(userAgent)) {
    return false;
  }
  
  return true;
};

/**
 * CSRF Token validation
 */
export const validateCSRFToken: ValidationChain[] = [
  body('csrfToken')
    .optional()
    .isLength({ min: 32, max: 128 })
    .withMessage('Invalid CSRF token length')
    .matches(/^[a-fA-F0-9]+$/)
    .withMessage('CSRF token must be hexadecimal')
];

/**
 * Rate limiting validation helpers
 */
export const validateRateLimitIdentifier = (identifier: string): boolean => {
  // Validate rate limit identifier (user ID, IP, etc.)
  if (!identifier || identifier.length > 100) {
    return false;
  }
  
  if (containsDangerousPattern(identifier)) {
    return false;
  }
  
  return true;
};

/**
 * Cryptographic nonce validation
 */
export const validateNonce = (nonce: string): boolean => {
  // Nonce should be 32 hex characters (16 bytes)
  return /^[a-fA-F0-9]{32}$/.test(nonce);
};

/**
 * Generate secure nonce
 */
export const generateSecureNonce = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Validate organization token format
 */
export const validateOrganizationToken = (token: string): boolean => {
  // Encrypted organization ID should be valid hex
  return /^[a-fA-F0-9]+$/.test(token) && token.length >= 16 && token.length <= 256;
};

/**
 * Time window validation for rate limiting
 */
export const validateTimeWindow = (windowStart: number, windowEnd: number): boolean => {
  const now = Date.now();
  
  // Window start should not be in the future
  if (windowStart > now) {
    return false;
  }
  
  // Window end should be after start
  if (windowEnd <= windowStart) {
    return false;
  }
  
  // Window should not be too long (max 24 hours)
  const maxWindow = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  if (windowEnd - windowStart > maxWindow) {
    return false;
  }
  
  return true;
};

/**
 * Export all validation functions
 */
export const QRValidation = {
  validateQRGeneration,
  validateQRScan,
  validateQRAction,
  validateQRAudit,
  validateCSRFToken,
  validateIPAddress,
  validateUserAgent,
  validateRateLimitIdentifier,
  validateNonce,
  generateSecureNonce,
  validateOrganizationToken,
  validateTimeWindow,
  containsDangerousPattern,
  sanitizeMetadata,
  SECURITY_PATTERNS,
  DANGEROUS_PATTERNS
};