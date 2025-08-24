import { Request, Response } from 'express';
import { emailService } from '../../services/email.service';
import { body, validationResult } from 'express-validator';

export class EmailController {
  // Helper method to safely check if email service is configured
  private async checkEmailServiceConfigured(): Promise<boolean> {
    try {
      return await emailService.isConfigured();
    } catch (error) {
      console.error('Error checking email service configuration:', error);
      return false;
    }
  }
  // Test email configuration
  async testEmailConfig(req: Request, res: Response) {
    try {
      const testResult = await emailService.testConnection();
      
      if (testResult.success) {
        res.json({
          success: true,
          message: 'Email service is configured and working properly',
          configured: await this.checkEmailServiceConfigured()
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Email service configuration test failed',
          error: testResult.error,
          configured: await this.checkEmailServiceConfigured()
        });
      }
    } catch (error) {
      console.error('Email test error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test email configuration',
        error: error instanceof Error ? error.message : 'Unknown error',
        configured: false
      });
    }
  }

  // Send test email
  async sendTestEmail(req: Request, res: Response) {
    try {
      // Validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { to, subject, message } = req.body;
      const user = req.user; // Assuming auth middleware populates this

      if (!(await this.checkEmailServiceConfigured())) {
        return res.status(400).json({
          success: false,
          message: 'Email service is not configured'
        });
      }

      const emailData = {
        to,
        subject: subject || 'Test Email from CMMS',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: white; padding: 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">📧 Test Email</h1>
            </div>
            <div style="padding: 24px; background-color: white;">
              <h2 style="color: #1976d2;">Email Configuration Test</h2>
              <p>This is a test email sent from your Elevated Compliance CMMS application.</p>
              ${message ? `<div style="background-color: #f8f9fa; border-left: 4px solid #1976d2; padding: 16px; margin: 16px 0;"><strong>Your Message:</strong><br>${message}</div>` : ''}
              <p style="color: #666; font-size: 14px;">Sent by: ${user?.name || 'CMMS Admin'} on ${new Date().toLocaleString()}</p>
            </div>
            <div style="background-color: #f8f9fa; padding: 16px; text-align: center; color: #666; font-size: 12px;">
              Elevated Compliance CMMS • elevatedcompliance.tech
            </div>
          </div>
        `,
        text: `
Email Configuration Test

This is a test email sent from your Elevated Compliance CMMS application.

${message ? `Your Message: ${message}` : ''}

Sent by: ${user?.name || 'CMMS Admin'} on ${new Date().toLocaleString()}

---
Elevated Compliance CMMS
elevatedcompliance.tech
        `,
      };

      const success = await emailService.sendEmail(emailData);

      if (success) {
        res.json({
          success: true,
          message: `Test email sent successfully to ${to}`,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send test email',
          error: 'Email service returned false - check server logs for SMTP details'
        });
      }
    } catch (error) {
      console.error('Test email error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get email service status
  async getEmailStatus(req: Request, res: Response) {
    try {
      let isConfigured = false;
      try {
        isConfigured = await emailService.isConfigured();
      } catch (err) {
        console.error('Error checking email service configuration:', err);
        isConfigured = false;
      }
      
      res.json({
        success: true,
        configured: isConfigured,
        status: isConfigured ? 'ready' : 'not_configured',
        message: isConfigured 
          ? 'Email service is configured and ready' 
          : 'Email service requires configuration'
      });
    } catch (error) {
      console.error('Email status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get email status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Diagnostic endpoint to check environment variables (admin only)
  async getEmailDiagnostics(req: Request, res: Response) {
    try {
      const requiredVars = [
        'SMTP_HOST',
        'SMTP_PORT', 
        'SMTP_USER',
        'SMTP_PASS',
        'SMTP_FROM',
        'SMTP_FROM_NAME'
      ];

      const envStatus = requiredVars.map(varName => ({
        name: varName,
        present: !!process.env[varName],
        value: varName === 'SMTP_PASS' ? '[HIDDEN]' : (process.env[varName] || 'NOT SET')
      }));

      const missingVars = envStatus.filter(v => !v.present).map(v => v.name);

      res.json({
        success: true,
        environmentVariables: envStatus,
        missingVariables: missingVars,
        allConfigured: missingVars.length === 0,
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform
      });
    } catch (error) {
      console.error('Email diagnostics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get email diagnostics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Send welcome email to user
  async sendWelcomeEmail(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { userEmail, userName, tempPassword, loginUrl } = req.body;

      if (!(await this.checkEmailServiceConfigured())) {
        return res.status(400).json({
          success: false,
          message: 'Email service is not configured'
        });
      }

      const success = await emailService.sendWelcomeEmail(
        userEmail, 
        userName, 
        tempPassword, 
        loginUrl
      );

      if (success) {
        res.json({
          success: true,
          message: `Welcome email sent successfully to ${userEmail}`,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send welcome email',
        });
      }
    } catch (error) {
      console.error('Welcome email error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send welcome email',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { userEmail, userName, resetUrl } = req.body;

      if (!(await this.checkEmailServiceConfigured())) {
        return res.status(400).json({
          success: false,
          message: 'Email service is not configured'
        });
      }

      const success = await emailService.sendPasswordResetEmail(
        userEmail, 
        userName, 
        resetUrl
      );

      if (success) {
        res.json({
          success: true,
          message: `Password reset email sent successfully to ${userEmail}`,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send password reset email',
        });
      }
    } catch (error) {
      console.error('Password reset email error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Validation middleware
export const testEmailValidation = [
  body('to').isEmail().withMessage('Valid email address is required'),
  body('subject').optional().isLength({ min: 1, max: 200 }).withMessage('Subject must be between 1 and 200 characters'),
  body('message').optional().isLength({ max: 1000 }).withMessage('Message must be less than 1000 characters'),
];

export const welcomeEmailValidation = [
  body('userEmail').isEmail().withMessage('Valid email address is required'),
  body('userName').isLength({ min: 1, max: 100 }).withMessage('User name is required and must be less than 100 characters'),
  body('tempPassword').optional().isLength({ min: 1 }).withMessage('Temporary password is required if provided'),
  body('loginUrl').optional().isURL().withMessage('Login URL must be a valid URL'),
];

export const passwordResetEmailValidation = [
  body('userEmail').isEmail().withMessage('Valid email address is required'),
  body('userName').isLength({ min: 1, max: 100 }).withMessage('User name is required and must be less than 100 characters'),
  body('resetUrl').isURL().withMessage('Reset URL must be a valid URL'),
];

export const emailController = new EmailController();