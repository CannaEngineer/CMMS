import { Router } from 'express';
import { BatchController } from './batch.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const batchController = new BatchController();

// Apply authentication middleware to all batch routes
router.use(authMiddleware);

// General batch request endpoint
router.post('/requests', batchController.batchRequest);

// Dashboard-specific batch endpoint
router.get('/dashboard', batchController.dashboardBatch);

// Sync offline changes
router.post('/sync', batchController.syncBatch);

// Work order actions batch
router.post('/work-order-actions', batchController.workOrderActionsBatch);

export default router;