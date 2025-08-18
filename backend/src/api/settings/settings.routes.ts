import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get organization settings
router.get('/', settingsController.getSettings);

// Clean slate - delete all data (admin only)
router.post('/clean-slate', settingsController.cleanSlate);

export default router;