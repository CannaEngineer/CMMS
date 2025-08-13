import { Router } from 'express';
import * as workOrderController from './workOrder.controller';

const router = Router();

router.get('/', workOrderController.getAllWorkOrders);
router.get('/recent', workOrderController.getRecentWorkOrders);
router.get('/:id', workOrderController.getWorkOrderById);
router.post('/', workOrderController.createWorkOrder);
router.put('/:id', workOrderController.updateWorkOrder);
router.delete('/:id', workOrderController.deleteWorkOrder);

// Time logging routes
router.post('/:id/time', workOrderController.logTime);
router.get('/:id/time', workOrderController.getTimeLogs);
router.get('/:id/time/stats', workOrderController.getTimeStats);
router.put('/time/:timeLogId', workOrderController.updateTimeLog);
router.delete('/time/:timeLogId', workOrderController.deleteTimeLog);

// Note/Comment routes
router.post('/:id/notes', workOrderController.addNote);
router.get('/:id/notes', workOrderController.getNotes);

// Work Order Sharing routes
router.post('/:id/share', workOrderController.createShare);
router.get('/:id/shares', workOrderController.getShares);
router.patch('/shares/:shareId/deactivate', workOrderController.deactivateShare);

export default router;
