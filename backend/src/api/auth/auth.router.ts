
import { Router } from 'express';
import * as authController from './auth.controller';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

// Validation endpoints
router.get('/check-email/:email', authController.checkEmail);
router.get('/check-organization/:name', authController.checkOrganization);

export default router;
