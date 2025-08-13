import { Router } from 'express';
import { qrController } from './qr.controller';
import { authenticate } from '../../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../../middleware/validation.middleware';

const router = Router();

// Rate limiting middleware
const qrGenerationLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 QR generation requests per windowMs
  message: 'Too many QR generation requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const qrScanningLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 scan requests per minute
  message: 'Too many QR scan requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const batchOperationLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 batch operations per hour
  message: 'Too many batch operations from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const createQRCodeValidation = [
  body('entityType')
    .isIn(['ASSET', 'WORK_ORDER', 'PM_SCHEDULE', 'LOCATION', 'USER', 'PART', 'PORTAL'])
    .withMessage('Invalid entity type'),
  body('entityId')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Entity ID must be between 1 and 100 characters'),
  body('entityName')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('Entity name must be less than 255 characters'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('maxScans')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('maxScans must be between 1 and 10000'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('expiresAt must be a valid ISO8601 date'),
];

const scanQRCodeValidation = [
  param('token')
    .isString()
    .isLength({ min: 10 })
    .withMessage('Invalid QR token'),
  body('actionType')
    .optional()
    .isIn(['VIEW', 'EDIT', 'CREATE_WORK_ORDER', 'COMPLETE_TASK', 'CHECK_IN', 'SCHEDULE_PM', 'UPDATE_STATUS', 'ADD_NOTES'])
    .withMessage('Invalid action type'),
  body('location')
    .optional()
    .isObject()
    .withMessage('Location must be an object with latitude and longitude'),
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
];

const batchGenerationValidation = [
  body('items')
    .isArray({ min: 1, max: 1000 })
    .withMessage('Items must be an array with 1-1000 elements'),
  body('items.*.entityType')
    .isIn(['ASSET', 'WORK_ORDER', 'PM_SCHEDULE', 'LOCATION', 'USER', 'PART', 'PORTAL'])
    .withMessage('Invalid entity type in items'),
  body('items.*.entityId')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Entity ID in items must be between 1 and 100 characters'),
];

// QR Code CRUD Operations
router.post(
  '/generate',
  authenticate,
  qrGenerationLimit,
  createQRCodeValidation,
  validateRequest,
  qrController.generateQRCode
);

router.get(
  '/codes',
  authenticate,
  query('entityType').optional().isIn(['ASSET', 'WORK_ORDER', 'PM_SCHEDULE', 'LOCATION', 'USER', 'PART', 'PORTAL']),
  query('entityId').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validateRequest,
  qrController.getQRCodes
);

router.get(
  '/codes/:id',
  authenticate,
  param('id').isString(),
  validateRequest,
  qrController.getQRCodeById
);

router.put(
  '/codes/:id',
  authenticate,
  param('id').isString(),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'EXPIRED', 'REVOKED']),
  body('maxScans').optional().isInt({ min: 1, max: 10000 }),
  body('expiresAt').optional().isISO8601(),
  validateRequest,
  qrController.updateQRCode
);

router.delete(
  '/codes/:id',
  authenticate,
  param('id').isString(),
  validateRequest,
  qrController.revokeQRCode
);

// QR Scanning Operations
router.post(
  '/scan/:token',
  qrScanningLimit,
  scanQRCodeValidation,
  validateRequest,
  qrController.scanQRCode
);

router.get(
  '/scan/:token/info',
  qrScanningLimit,
  param('token').isString(),
  validateRequest,
  qrController.getQRCodeInfo
);

// Batch Operations
router.post(
  '/batch/generate',
  authenticate,
  batchOperationLimit,
  batchGenerationValidation,
  validateRequest,
  qrController.batchGenerateQRCodes
);

router.get(
  '/batch/:id',
  authenticate,
  param('id').isString(),
  validateRequest,
  qrController.getBatchOperation
);

router.get(
  '/batch',
  authenticate,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validateRequest,
  qrController.getBatchOperations
);

// Analytics and Reporting
router.get(
  '/analytics',
  authenticate,
  query('days').optional().isInt({ min: 1, max: 365 }),
  validateRequest,
  qrController.getAnalytics
);

router.get(
  '/analytics/scans',
  authenticate,
  query('entityType').optional().isIn(['ASSET', 'WORK_ORDER', 'PM_SCHEDULE', 'LOCATION', 'USER', 'PART', 'PORTAL']),
  query('entityId').optional().isString(),
  query('days').optional().isInt({ min: 1, max: 365 }),
  validateRequest,
  qrController.getScanAnalytics
);

// Entity Integration
router.get(
  '/entity/:entityType/:entityId',
  authenticate,
  param('entityType').isIn(['ASSET', 'WORK_ORDER', 'PM_SCHEDULE', 'LOCATION', 'USER', 'PART', 'PORTAL']),
  param('entityId').isString(),
  validateRequest,
  qrController.getQRCodesForEntity
);

router.post(
  '/entity/:entityType/:entityId/generate',
  authenticate,
  qrGenerationLimit,
  param('entityType').isIn(['ASSET', 'WORK_ORDER', 'PM_SCHEDULE', 'LOCATION', 'USER', 'PART', 'PORTAL']),
  param('entityId').isString(),
  body('entityName').optional().isString(),
  body('metadata').optional().isObject(),
  validateRequest,
  qrController.generateQRCodeForEntity
);

// Templates
router.get(
  '/templates',
  authenticate,
  qrController.getQRTemplates
);

router.post(
  '/templates',
  authenticate,
  body('name').isString().isLength({ min: 1, max: 100 }),
  body('description').optional().isString(),
  body('category').isString(),
  body('dimensions').isObject(),
  body('layout').isIn(['horizontal', 'vertical']),
  body('qrSize').isInt({ min: 10, max: 200 }),
  validateRequest,
  qrController.createQRTemplate
);

// Maintenance Operations
router.post(
  '/maintenance/cleanup-expired',
  authenticate,
  qrController.cleanupExpiredQRCodes
);

export default router;