import { Router } from 'express';
import { UserController } from './user.controller';

const router = Router();
const userController = new UserController();

router.get('/', (req, res) => userController.getAllUsers(req, res));
router.get('/stats', (req, res) => userController.getUserStats(req, res));
router.get('/:id', (req, res) => userController.getUserById(req, res));
router.get('/:id/work-orders', (req, res) => userController.getUserWorkOrders(req, res));
router.post('/', (req, res) => userController.createUser(req, res));
router.put('/:id', (req, res) => userController.updateUser(req, res));
router.delete('/:id', (req, res) => userController.deleteUser(req, res));

export default router;