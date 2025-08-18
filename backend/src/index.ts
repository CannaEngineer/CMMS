
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
import calendarRouter from './api/calendar/calendar.router';
import qrRouter from './api/qr/qr.router';
import settingsRouter from './api/settings/settings.routes';
import { authenticate } from './middleware/auth.middleware';
import { uploadService } from './services/uploadService';
import { WebSocketService } from './services/websocket.service';
import { notificationTriggersService } from './services/notification-triggers.service';
import { 
  errorHandler, 
  notFoundHandler, 
  requestLogger,
  asyncHandler 
} from './middleware/errorHandler.middleware';

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

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
app.use('/api/settings', authenticate, settingsRouter);
app.use('/api/qr', qrRouter); // QR routes include their own authentication where needed

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Public portal routes (no authentication) - MUST come before authenticated routes
app.get('/api/portals/public/:slug', (req, res) => {
  const { getPublicPortal } = require('./api/portal/portal.controller');
  getPublicPortal(req, res);
});

// File upload endpoint for portals
app.post('/api/portals/public/:slug/upload', (req, res) => {
  const upload = uploadService.getMulterConfig();
  upload.array('files', 5)(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const processedFiles = await uploadService.processUploadedFiles(files, 'portal_files');
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

// Set up periodic notification checks (run every 5 minutes)
setInterval(() => {
  notificationTriggersService.runPeriodicChecks();
}, 5 * 60 * 1000);

// Cleanup old notifications every hour
setInterval(() => {
  notificationTriggersService.cleanupOldNotifications();
}, 60 * 60 * 1000);

// For local development, start the server
if (process.env.NODE_ENV !== 'production') {
  server.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
    console.log(`WebSocket server initialized`);
  });
}

// Export the app for Vercel serverless deployment
export default app;
