import { Router, Response } from 'express';
import { PMScheduleController } from './pmSchedule.controller';
import { AuthenticatedRequest } from '../../types/auth';

const router = Router();
const pmScheduleController = new PMScheduleController();

router.get('/', (req: AuthenticatedRequest, res: Response) => pmScheduleController.getAllPMSchedules(req, res));
router.get('/:id', (req: AuthenticatedRequest, res: Response) => pmScheduleController.getPMScheduleById(req, res));
router.post('/', (req: AuthenticatedRequest, res: Response) => pmScheduleController.createPMSchedule(req, res));
router.put('/:id', (req: AuthenticatedRequest, res: Response) => pmScheduleController.updatePMSchedule(req, res));
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => pmScheduleController.deletePMSchedule(req, res));

export default router;