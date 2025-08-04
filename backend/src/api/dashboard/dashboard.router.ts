import { Router } from 'express';
import { DashboardController } from './dashboard.controller';

const router = Router();
const dashboardController = new DashboardController();

router.get('/stats', (req, res) => dashboardController.getStats(req, res));
router.get('/work-order-trends', (req, res) => dashboardController.getWorkOrderTrends(req, res));
router.get('/asset-health', (req, res) => dashboardController.getAssetHealth(req, res));
router.get('/recent-work-orders', (req, res) => dashboardController.getRecentWorkOrders(req, res));
router.get('/maintenance-schedule', (req, res) => dashboardController.getMaintenanceSchedule(req, res));

export default router;