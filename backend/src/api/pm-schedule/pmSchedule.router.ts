import { Router } from 'express';
import { PMScheduleController } from './pmSchedule.controller';

const router = Router();
const pmScheduleController = new PMScheduleController();

router.get('/', (req: any, res: any) => pmScheduleController.getAllPMSchedules(req, res));
router.get('/:id', (req, res) => pmScheduleController.getPMScheduleById(req, res));
router.post('/', (req, res) => pmScheduleController.createPMSchedule(req, res));
router.put('/:id', (req, res) => pmScheduleController.updatePMSchedule(req, res));
router.delete('/:id', (req, res) => pmScheduleController.deletePMSchedule(req, res));

export default router;