import { Router } from 'express';
import { settingsController } from './settings.controller';

const router = Router();

// Get organization settings
router.get('/', settingsController.getSettings);

// Clean slate - delete all data (admin only)
router.post('/clean-slate', settingsController.cleanSlate);

export default router;