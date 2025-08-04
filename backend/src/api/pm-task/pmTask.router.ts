import { Router } from 'express';
import { PMTaskController } from './pmTask.controller';

const router = Router();
const pmTaskController = new PMTaskController();

// PM Task CRUD
router.get('/', (req, res) => pmTaskController.getAllPMTasks(req, res));
router.get('/:id', (req, res) => pmTaskController.getPMTaskById(req, res));
router.post('/', (req, res) => pmTaskController.createPMTask(req, res));
router.put('/:id', (req, res) => pmTaskController.updatePMTask(req, res));
router.delete('/:id', (req, res) => pmTaskController.deletePMTask(req, res));

// Task Templates
router.get('/templates/type/:type', (req, res) => pmTaskController.getTaskTemplatesByType(req, res));
router.post('/:id/clone', (req, res) => pmTaskController.cloneTask(req, res));

// PM Schedule Tasks
router.get('/schedule/:scheduleId/tasks', (req, res) => pmTaskController.getTasksByPMSchedule(req, res));
router.post('/schedule/:scheduleId/tasks', (req, res) => pmTaskController.linkTaskToPMSchedule(req, res));
router.delete('/schedule/:scheduleId/tasks/:taskId', (req, res) => pmTaskController.unlinkTaskFromPMSchedule(req, res));
router.put('/schedule/:scheduleId/tasks/reorder', (req, res) => pmTaskController.reorderTasksInPMSchedule(req, res));

export default router;