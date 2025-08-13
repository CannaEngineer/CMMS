import { Router } from 'express';
import { MaintenanceController } from './maintenance.controller';

const router = Router();
const maintenanceController = new MaintenanceController();

router.get('/stats', (req, res) => maintenanceController.getStats(req, res));

export default router;