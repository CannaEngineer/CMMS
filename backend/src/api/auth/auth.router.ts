
import { Router } from 'express';
import * as authController from './auth.controller';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

// Validation endpoints
router.get('/check-email/:email', authController.checkEmail);
router.get('/check-organization/:name', authController.checkOrganization);

// Email verification endpoints
router.post('/send-verification/:userId', authController.sendEmailVerification);
router.post('/verify-email', authController.verifyEmail);

// Password reset endpoints
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

export default router;
