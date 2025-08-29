
import dotenv from 'dotenv';
dotenv.config();

console.log('[Backend] Starting CMMS backend application...');
console.log('[Backend] Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  PORT: process.env.PORT || 5000,
  PWD: process.cwd()
});

import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { prisma } from './lib/prisma';
import authRouter from './api/auth/auth.router';
import assetRouter from './api/asset/asset.router';
import locationRouter from './api/location/location.router';
import workOrderRouter from './api/work-order/workOrder.router';
import partRouter from './api/part/part.router';
import userRouter from './api/user/user.router';
import dashboardRouter from './api/dashboard/dashboard.router';
import pmScheduleRouter from './api/pm-schedule/pmSchedule.router';
import pmTaskRouter from './api/pm-task/pmTask.router';
import pmTriggerRouter from './api/pm-trigger/pmTrigger.router';
import meterReadingRouter from './api/meter-reading/meterReading.router';
import maintenanceHistoryRouter from './api/maintenance-history/maintenanceHistory.router';
import maintenanceRouter from './api/maintenance/maintenance.router';
import portalRouter from './api/portal/portal.router';
import commentRouter from './api/comment/comment.router';
import importRouter from './api/import/import.router';
import publicShareRouter from './api/public/publicShare.router';
import organizationRouter from './api/organization/organization.router';
import { notificationRouter } from './api/notification/notification.router';
import emailRouter from './api/email/email.router';
import calendarRouter from './api/calendar/calendar.router';
import qrRouter from './api/qr/qr.router';
import settingsRouter from './api/settings/settings.routes';
import debugRouter from './api/debug/debug.router';
import { authenticate } from './middleware/auth.middleware';
import { blobUploadService } from './services/blobUploadService';
import { WebSocketService } from './services/websocket.service';
import { notificationTriggersService } from './services/notification-triggers.service';
import { 
  errorHandler, 
  notFoundHandler, 
  requestLogger,
  asyncHandler 
} from './middleware/errorHandler.middleware';

// Initialize database connection for Vercel
async function initializeDatabase() {
  if (process.env.VERCEL && process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('file:')) {
    try {
      console.log('[Backend] Checking database connection...');
      await prisma.$connect();
      console.log('[Backend] Database connection successful');
    } catch (error) {
      console.warn('[Backend] Database connection failed:', error);
    }
  }
}

// Initialize database on startup
initializeDatabase();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;
// Prisma client imported from singleton

// Initialize WebSocket service only in non-serverless environments
// WebSockets don't work in Vercel serverless functions
if (!process.env.VERCEL) {
  console.log('[Backend] Initializing WebSocket service...');
  WebSocketService.getInstance().initialize(server);
} else {
  console.log('[Backend] Running in Vercel serverless - WebSocket disabled');
}

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // In production, allow specific domains
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://cmms-orpin.vercel.app',
      'https://your-cmms-app.vercel.app',
      'https://cmms.elevatedcompliance.tech',
      /\.vercel\.app$/  // Allow all Vercel preview deployments
    ];
    
    const allowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (allowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // For now, allow all origins to fix the immediate issue
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Increase JSON payload limit for CSV imports
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Increase URL encoded payload limit

// Request logging
app.use(requestLogger);

app.get('/', (req, res) => {
  res.send('Hello from the Compass CMMS Backend!');
});

// Remove development auth bypass - use real authentication

// Public routes (no authentication required)
app.use('/api/public', publicShareRouter);

app.use('/api/auth', authRouter);
app.use('/api/assets', authenticate, assetRouter);
app.use('/api/locations', authenticate, locationRouter);
app.use('/api/work-orders', authenticate, workOrderRouter);
app.use('/api/parts', authenticate, partRouter);
app.use('/api/users', authenticate, userRouter);
app.use('/api/organization', authenticate, organizationRouter);

app.use('/api/dashboard', authenticate, dashboardRouter);
app.use('/api/calendar', authenticate, calendarRouter);
app.use('/api/maintenance', authenticate, maintenanceRouter);
app.use('/api/pm-schedules', authenticate, pmScheduleRouter);
app.use('/api/pm-tasks', authenticate, pmTaskRouter);
app.use('/api/pm-triggers', authenticate, pmTriggerRouter);
app.use('/api/meter-readings', authenticate, meterReadingRouter);
app.use('/api/maintenance-history', authenticate, maintenanceHistoryRouter);
app.use('/api/comments', authenticate, commentRouter);
app.use('/api/import', authenticate, importRouter);
app.use('/api/notifications', authenticate, notificationRouter);
app.use('/api/email', authenticate, emailRouter);
app.use('/api/settings', authenticate, settingsRouter);
app.use('/api/debug', debugRouter); // Debug routes for database connection testing
app.use('/api/qr', qrRouter); // QR routes include their own authentication where needed

// Static file serving removed - all files now served from Vercel Blob CDN

// Generic file upload endpoint for authenticated users
const handleUpload = (req: any, res: any) => {
  const upload = blobUploadService.getMulterConfig();
  upload.array('files', 10)(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const { entityType, entityId } = req.params;
      const organizationId = req.user?.organizationId;
      
      if (!organizationId) {
        return res.status(401).json({ error: 'User organization not found' });
      }
      
      // Create folder structure: entityType/organizationId/entityId (if provided)
      const folder = entityId 
        ? `${entityType}/${organizationId}/${entityId}`
        : `${entityType}/${organizationId}`;

      const processedFiles = await blobUploadService.processUploadedFiles(files, folder, {
        access: 'public',
        addRandomSuffix: true,
        cacheControlMaxAge: 86400 // 1 day cache
      });

      // Save file metadata to database if entityId is provided
      if (entityId && (entityType === 'assets' || entityType === 'work-orders')) {
        await saveFilesToDatabase(entityType, entityId, processedFiles, organizationId);
      }
      
      res.json({
        success: true,
        files: processedFiles
      });
    } catch (error) {
      console.error('File processing error:', error);
      res.status(500).json({ error: 'Failed to process uploaded files' });
    }
  });
};

// Helper function to save file metadata to database
async function saveFilesToDatabase(entityType: string, entityId: string, files: any[], organizationId: number) {
  try {
    const fileMetadata = files.map(file => ({
      id: file.id,
      filename: file.filename,
      originalName: file.originalName,
      mimetype: file.mimetype,
      size: file.size,
      url: file.url,
      pathname: file.pathname,
      uploadedAt: new Date().toISOString(),
      uploadedBy: organizationId
    }));

    if (entityType === 'assets') {
      // Get current attachments
      const asset = await prisma.asset.findFirst({
        where: { id: parseInt(entityId), organizationId },
        select: { attachments: true }
      });
      
      if (!asset) {
        console.error(`Asset ${entityId} not found in organization ${organizationId}`);
        return;
      }

      const currentAttachments = (asset.attachments as any[]) || [];
      const updatedAttachments = [...currentAttachments, ...fileMetadata];

      await prisma.asset.update({
        where: { id: parseInt(entityId) },
        data: { attachments: updatedAttachments }
      });
      
      console.log(`Saved ${files.length} files to asset ${entityId} attachments`);
      
    } else if (entityType === 'work-orders') {
      // Get current attachments
      const workOrder = await prisma.workOrder.findFirst({
        where: { id: parseInt(entityId), organizationId },
        select: { attachments: true }
      });
      
      if (!workOrder) {
        console.error(`Work order ${entityId} not found in organization ${organizationId}`);
        return;
      }

      const currentAttachments = (workOrder.attachments as any[]) || [];
      const updatedAttachments = [...currentAttachments, ...fileMetadata];

      await prisma.workOrder.update({
        where: { id: parseInt(entityId) },
        data: { attachments: updatedAttachments }
      });
      
      console.log(`Saved ${files.length} files to work order ${entityId} attachments`);
    }
    
  } catch (error) {
    console.error('Error saving file metadata to database:', error);
  }
}

// Upload routes with and without entity ID
app.post('/api/uploads/:entityType/:entityId', authenticate, handleUpload);
app.post('/api/uploads/:entityType', authenticate, handleUpload);

// GET routes for fetching uploaded files
app.get('/api/uploads/:entityType/:entityId', authenticate, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { organizationId } = req.user;

    console.log(`Fetching files for ${entityType} ${entityId} in organization ${organizationId}`);

    let files: any[] = [];
    
    if (entityType === 'assets') {
      // Validate entityId is a valid integer
      const assetId = parseInt(entityId);
      if (isNaN(assetId)) {
        console.error(`Invalid asset ID: ${entityId}`);
        return res.json({
          success: true,
          files: [],
          entityType,
          entityId,
          organizationId
        });
      }

      const asset = await prisma.asset.findFirst({
        where: { id: assetId, organizationId },
        select: { attachments: true }
      });
      
      if (asset && asset.attachments) {
        files = Array.isArray(asset.attachments) ? asset.attachments : [];
      }
      
    } else if (entityType === 'work-orders') {
      // Validate entityId is a valid integer
      const workOrderId = parseInt(entityId);
      if (isNaN(workOrderId)) {
        console.error(`Invalid work order ID: ${entityId}`);
        return res.json({
          success: true,
          files: [],
          entityType,
          entityId,
          organizationId
        });
      }

      const workOrder = await prisma.workOrder.findFirst({
        where: { id: workOrderId, organizationId },
        select: { attachments: true }
      });
      
      if (workOrder && workOrder.attachments) {
        files = Array.isArray(workOrder.attachments) ? workOrder.attachments : [];
      }
    } else {
      console.error(`Unsupported entity type: ${entityType}`);
      return res.status(400).json({ 
        error: `Unsupported entity type: ${entityType}`,
        success: false 
      });
    }

    res.json({
      success: true,
      files: files,
      entityType,
      entityId,
      organizationId
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

app.get('/api/uploads/:entityType', authenticate, async (req, res) => {
  try {
    const { entityType } = req.params;
    const { organizationId, role } = req.user;

    console.log(`Fetching files for ${entityType} in organization ${organizationId}`);

    let allFiles: any[] = [];
    
    // Only admins can access organization-wide files
    if (role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    if (entityType === 'assets') {
      const assets = await prisma.asset.findMany({
        where: { organizationId },
        select: { id: true, name: true, attachments: true }
      });
      
      assets.forEach(asset => {
        if (asset.attachments && Array.isArray(asset.attachments)) {
          const filesWithAssetInfo = (asset.attachments as any[]).map(file => ({
            ...file,
            entityId: asset.id,
            entityName: asset.name,
            entityType: 'assets'
          }));
          allFiles.push(...filesWithAssetInfo);
        }
      });
      
    } else if (entityType === 'work-orders') {
      const workOrders = await prisma.workOrder.findMany({
        where: { organizationId },
        select: { id: true, title: true, attachments: true }
      });
      
      workOrders.forEach(workOrder => {
        if (workOrder.attachments && Array.isArray(workOrder.attachments)) {
          const filesWithWorkOrderInfo = (workOrder.attachments as any[]).map(file => ({
            ...file,
            entityId: workOrder.id,
            entityName: workOrder.title,
            entityType: 'work-orders'
          }));
          allFiles.push(...filesWithWorkOrderInfo);
        }
      });
    }

    res.json({
      success: true,
      files: allFiles,
      entityType,
      organizationId,
      totalFiles: allFiles.length
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// DELETE route for removing files (admin only)
app.delete('/api/uploads/:entityType/:entityId/:fileId', authenticate, async (req, res) => {
  try {
    const { entityType, entityId, fileId } = req.params;
    const { organizationId, role } = req.user;

    console.log(`Admin deleting file ${fileId} from ${entityType} ${entityId} in organization ${organizationId}`);

    // Only admins can delete files
    if (role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required to delete files' });
    }
    
    if (entityType === 'assets') {
      const asset = await prisma.asset.findFirst({
        where: { id: parseInt(entityId), organizationId },
        select: { attachments: true }
      });
      
      if (!asset) {
        return res.status(404).json({ error: 'Asset not found' });
      }

      const currentAttachments = (asset.attachments as any[]) || [];
      const updatedAttachments = currentAttachments.filter(file => file.id !== fileId);

      await prisma.asset.update({
        where: { id: parseInt(entityId) },
        data: { attachments: updatedAttachments }
      });
      
      console.log(`Removed file ${fileId} from asset ${entityId}`);
      
    } else if (entityType === 'work-orders') {
      const workOrder = await prisma.workOrder.findFirst({
        where: { id: parseInt(entityId), organizationId },
        select: { attachments: true }
      });
      
      if (!workOrder) {
        return res.status(404).json({ error: 'Work order not found' });
      }

      const currentAttachments = (workOrder.attachments as any[]) || [];
      const updatedAttachments = currentAttachments.filter(file => file.id !== fileId);

      await prisma.workOrder.update({
        where: { id: parseInt(entityId) },
        data: { attachments: updatedAttachments }
      });
      
      console.log(`Removed file ${fileId} from work order ${entityId}`);
    } else {
      return res.status(400).json({ error: 'Unsupported entity type for file deletion' });
    }

    res.json({
      success: true,
      message: 'File deleted successfully',
      fileId,
      entityType,
      entityId
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Legacy blob upload route (for backward compatibility)
app.post('/api/upload/blob', authenticate, (req, res) => {
  const upload = blobUploadService.getMulterConfig();
  upload.single('file')(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    try {
      const file = req.file as Express.Multer.File;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { entityType = 'general', entityId } = req.body;
      const organizationId = req.user?.organizationId;
      
      // Create folder structure
      const folder = entityId 
        ? `${entityType}/${organizationId}/${entityId}`
        : `${entityType}/${organizationId}`;

      const processedFile = await blobUploadService.uploadFile(file, folder, {
        access: 'public',
        addRandomSuffix: true,
        cacheControlMaxAge: 86400
      });
      
      res.json({
        success: true,
        url: processedFile.url,
        fileId: processedFile.id,
        filename: processedFile.filename,
        size: processedFile.size
      });
    } catch (error) {
      console.error('File processing error:', error);
      res.status(500).json({ error: 'Failed to process uploaded file' });
    }
  });
});

// Public portal routes (no authentication) - MUST come before authenticated routes
app.get('/api/portals/public/:slug', (req, res) => {
  const { getPublicPortal } = require('./api/portal/portal.controller');
  getPublicPortal(req, res);
});

// File upload endpoint for portals
app.post('/api/portals/public/:slug/upload', (req, res) => {
  const upload = blobUploadService.getMulterConfig();
  upload.array('files', 10)(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const { slug } = req.params;
      const processedFiles = await blobUploadService.processUploadedFiles(files, `portals/${slug}`, {
        access: 'public',
        addRandomSuffix: true,
        cacheControlMaxAge: 86400 // 1 day cache
      });
      
      res.json({
        success: true,
        files: processedFiles
      });
    } catch (error) {
      console.error('File processing error:', error);
      res.status(500).json({ error: 'Failed to process uploaded files' });
    }
  });
});

app.post('/api/portals/public/submit', (req, res) => {
  const { submitPortal } = require('./api/portal/portal.controller');
  submitPortal(req, res);
});
app.get('/api/portals/public/:slug/rate-limit', (req, res) => {
  const { checkRateLimit } = require('./api/portal/portal.controller');
  checkRateLimit(req, res);
});

app.use('/api/portals', authenticate, portalRouter);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Temporarily disabled periodic notification checks due to connection pool issues
// TODO: Re-enable with proper connection pool management
// Set up periodic notification checks (run every 5 minutes)
// setInterval(() => {
//   notificationTriggersService.runPeriodicChecks();
// }, 5 * 60 * 1000);

// Cleanup old notifications every hour
// setInterval(() => {
//   notificationTriggersService.cleanupOldNotifications();
// }, 60 * 60 * 1000);

// For local development, start the server
if (process.env.NODE_ENV !== 'production') {
  server.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
    console.log(`WebSocket server initialized`);
  });
}

// Export the app for Vercel serverless deployment
export default app;
