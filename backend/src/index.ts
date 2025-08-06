
import express from 'express';
import cors from 'cors';
import path from 'path';
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
import portalRouter from './api/portal/portal.router';
import commentRouter from './api/comment/comment.router';
import importRouter from './api/import/import.router';
import { authenticate } from './middleware/auth.middleware';
import { uploadService } from './services/uploadService';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase JSON payload limit for CSV imports
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Increase URL encoded payload limit

app.get('/', (req, res) => {
  res.send('Hello from the Compass CMMS Backend!');
});

// Temporary bypass for development - TODO: Remove in production
const developmentAuth = (req: any, res: any, next: any) => {
  req.user = { organizationId: 1, id: 1, role: 'ADMIN' };
  next();
};

app.use('/api/auth', authRouter);
app.use('/api/assets', process.env.NODE_ENV === 'production' ? authenticate : developmentAuth, assetRouter);
app.use('/api/locations', process.env.NODE_ENV === 'production' ? authenticate : developmentAuth, locationRouter);
app.use('/api/work-orders', process.env.NODE_ENV === 'production' ? authenticate : developmentAuth, workOrderRouter);
app.use('/api/parts', process.env.NODE_ENV === 'production' ? authenticate : developmentAuth, partRouter);
app.use('/api/users', process.env.NODE_ENV === 'production' ? authenticate : developmentAuth, userRouter);

app.use('/api/dashboard', process.env.NODE_ENV === 'production' ? authenticate : developmentAuth, dashboardRouter);
app.use('/api/pm-schedules', process.env.NODE_ENV === 'production' ? authenticate : developmentAuth, pmScheduleRouter);
app.use('/api/pm-tasks', process.env.NODE_ENV === 'production' ? authenticate : developmentAuth, pmTaskRouter);
app.use('/api/pm-triggers', process.env.NODE_ENV === 'production' ? authenticate : developmentAuth, pmTriggerRouter);
app.use('/api/meter-readings', process.env.NODE_ENV === 'production' ? authenticate : developmentAuth, meterReadingRouter);
app.use('/api/maintenance-history', process.env.NODE_ENV === 'production' ? authenticate : developmentAuth, maintenanceHistoryRouter);
app.use('/api/comments', process.env.NODE_ENV === 'production' ? authenticate : developmentAuth, commentRouter);
app.use('/api/import', process.env.NODE_ENV === 'production' ? authenticate : developmentAuth, importRouter);

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

app.use('/api/portals', process.env.NODE_ENV === 'production' ? authenticate : developmentAuth, portalRouter);

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
