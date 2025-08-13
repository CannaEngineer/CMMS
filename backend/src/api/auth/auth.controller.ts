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
        res.status(400).json({ error: error.message });
    } else {
        res.status(400).json({ error: 'An unknown error occurred' });
    }
  }
};