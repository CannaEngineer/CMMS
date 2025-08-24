import { Router } from 'express';
import * as workOrderController from './workOrder.controller';

const router = Router();

router.get('/', workOrderController.getAllWorkOrders);
router.get('/recent', workOrderController.getRecentWorkOrders);
router.get('/:id', workOrderController.getWorkOrderById);
router.get('/:id/progress', workOrderController.getWorkOrderProgress);
router.post('/', workOrderController.createWorkOrder);
router.put('/:id', workOrderController.updateWorkOrder);
router.put('/:id/status', workOrderController.updateWorkOrderStatus);
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

// Work Order Notification routes
router.post('/:id/notify', workOrderController.sendNotification);

// Work Order Tasks routes
router.get('/:id/tasks', workOrderController.getWorkOrderTasks);

// Work Order History routes
router.get('/:id/history', workOrderController.getWorkOrderHistory);

export default router;
