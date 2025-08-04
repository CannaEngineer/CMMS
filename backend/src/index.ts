
import express from 'express';
import cors from 'cors';
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
import { authenticate } from './middleware/auth.middleware';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
