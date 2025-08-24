import { Router } from 'express';
import { 
  emailController, 
  testEmailValidation, 
  welcomeEmailValidation, 
  passwordResetEmailValidation 
} from './email.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all email routes
router.use(authMiddleware);

/**
 * @route GET /api/email/status
 * @desc Get email service status
 * @access Private
 */
router.get('/status', emailController.getEmailStatus.bind(emailController));

/**
 * @route GET /api/email/test-config
 * @desc Test email configuration
 * @access Private (Admin only)
 */
router.get('/test-config', emailController.testEmailConfig.bind(emailController));

/**
 * @route GET /api/email/diagnostics
 * @desc Get email environment diagnostics
 * @access Private (Admin only)
 */
router.get('/diagnostics', emailController.getEmailDiagnostics.bind(emailController));

/**
 * @route POST /api/email/test
 * @desc Send test email
 * @access Private (Admin only)
 */
router.post('/test', testEmailValidation, emailController.sendTestEmail.bind(emailController));

/**
 * @route POST /api/email/welcome
 * @desc Send welcome email to new user
 * @access Private (Admin only)
 */
router.post('/welcome', welcomeEmailValidation, emailController.sendWelcomeEmail.bind(emailController));

/**
 * @route POST /api/email/password-reset
 * @desc Send password reset email
 * @access Private
 */
router.post('/password-reset', passwordResetEmailValidation, emailController.sendPasswordResetEmail.bind(emailController));

/**
 * @route POST /api/email/test-delivery
 * @desc Test email delivery with detailed logging
 * @access Private (Admin only)
 */
router.post('/test-delivery', emailController.testEmailDelivery.bind(emailController));

export default router;