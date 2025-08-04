import { Router } from 'express';
import { PMTriggerController } from './pmTrigger.controller';

const router = Router();
const pmTriggerController = new PMTriggerController();

// PM Trigger CRUD
router.post('/', (req, res) => pmTriggerController.createTrigger(req, res));
router.put('/:id', (req, res) => pmTriggerController.updateTrigger(req, res));
router.delete('/:id', (req, res) => pmTriggerController.deleteTrigger(req, res));

// Get triggers by PM Schedule
router.get('/schedule/:scheduleId', (req, res) => pmTriggerController.getTriggersByPMSchedule(req, res));

// Trigger evaluation endpoints
router.get('/evaluate/due', (req, res) => pmTriggerController.evaluateDueTriggers(req, res));
router.get('/evaluate/usage/:assetId', (req, res) => pmTriggerController.evaluateUsageBasedTriggers(req, res));
router.post('/evaluate/condition/:assetId', (req, res) => pmTriggerController.evaluateConditionBasedTriggers(req, res));

// Mark trigger as fired
router.post('/:id/fired', (req, res) => pmTriggerController.markTriggerFired(req, res));

// Get upcoming triggers
router.get('/upcoming', (req, res) => pmTriggerController.getUpcomingTriggers(req, res));

export default router;