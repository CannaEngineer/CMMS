import { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from './auth.service';

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  password: z.string().min(6),
  organizationId: z.number().optional(),
  organizationName: z.string().optional(),
  createOrganization: z.boolean().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'TECHNICIAN']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const emailVerificationSchema = z.object({
  token: z.string().min(1),
});

const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

const passwordResetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

export const register = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const user = await authService.register(data);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof Error) {
        res.status(400).json({ error: error.message });
    } else {
        res.status(400).json({ error: 'An unknown error occurred' });
    }
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    console.log("Attempting login..."); // Added console.log
    const data = loginSchema.parse(req.body);
    const { user, token } = await authService.login(data);
    res.status(200).json({ user, token });
  } catch (error) {
    console.error("Login error:", error); // Added console.error
    if (error instanceof Error) {
        if (error.message === 'EMAIL_NOT_VERIFIED') {
          return res.status(403).json({ 
            error: 'EMAIL_NOT_VERIFIED',
            message: 'Please verify your email address before logging in. We\'ve sent a new verification email to your inbox.',
            requiresEmailVerification: true
          });
        }
        res.status(400).json({ error: error.message });
    } else {
        res.status(400).json({ error: 'An unknown error occurred' });
    }
  }
};

// Check if email is available
export const checkEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    
    if (!email || !z.string().email().safeParse(email).success) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const existingUser = await authService.checkEmailExists(email);
    res.status(200).json({ available: !existingUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check email availability' });
  }
};

// Check if organization name is available
export const checkOrganization = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Organization name too short' });
    }

    const existingOrg = await authService.checkOrganizationExists(name);
    res.status(200).json({ available: !existingOrg });
  } catch (error) {
    console.error('checkOrganization controller error:', error);
    res.status(500).json({ error: 'Failed to check organization availability' });
  }
};

// Email verification endpoints
export const sendEmailVerification = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId || isNaN(Number(userId))) {
      return res.status(400).json({ error: 'Valid user ID is required' });
    }

    const success = await authService.sendEmailVerification(Number(userId));
    
    if (success) {
      res.status(200).json({ message: 'Verification email sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send verification email' });
    }
  } catch (error) {
    console.error('sendEmailVerification controller error:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to send verification email' });
    }
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const data = emailVerificationSchema.parse(req.body);
    const result = await authService.verifyEmail(data.token);
    
    res.status(200).json({
      message: 'Email verified successfully',
      user: result.user
    });
  } catch (error) {
    console.error('verifyEmail controller error:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: 'Email verification failed' });
    }
  }
};

// Password reset endpoints
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const data = passwordResetRequestSchema.parse(req.body);
    const success = await authService.initiatePasswordReset(data.email);
    
    // Always return success for security (don't reveal if email exists)
    res.status(200).json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });
  } catch (error) {
    console.error('requestPasswordReset controller error:', error);
    res.status(200).json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const data = passwordResetSchema.parse(req.body);
    const result = await authService.resetPassword(data.token, data.password);
    
    res.status(200).json({
      message: 'Password reset successfully',
      user: result.user
    });
  } catch (error) {
    console.error('resetPassword controller error:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: 'Password reset failed' });
    }
  }
};