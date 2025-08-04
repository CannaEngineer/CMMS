import { Router } from 'express';
import { MaintenanceHistoryController } from './maintenanceHistory.controller';

const router = Router();
const maintenanceHistoryController = new MaintenanceHistoryController();

// Maintenance history CRUD
router.post('/', (req, res) => maintenanceHistoryController.createMaintenanceRecord(req, res));
router.put('/:id', (req, res) => maintenanceHistoryController.updateMaintenanceRecord(req, res));
router.delete('/:id', (req, res) => maintenanceHistoryController.deleteMaintenanceRecord(req, res));

// Get maintenance history for an asset
router.get('/asset/:assetId', (req, res) => maintenanceHistoryController.getMaintenanceHistory(req, res));
router.get('/asset/:assetId/stats', (req, res) => maintenanceHistoryController.getMaintenanceStats(req, res));
router.get('/asset/:assetId/trends', (req, res) => maintenanceHistoryController.getMaintenanceTrends(req, res));

// Complete and sign off maintenance records
router.post('/:id/complete', (req, res) => maintenanceHistoryController.completeMaintenanceRecord(req, res));
router.post('/:id/sign-off', (req, res) => maintenanceHistoryController.signOffMaintenanceRecord(req, res));

// Compliance reporting
router.get('/compliance/report', (req, res) => maintenanceHistoryController.getComplianceReport(req, res));

export default router;