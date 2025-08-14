import { Request, Response } from 'express';
import { z } from 'zod';
import * as organizationService from './organization.service';

const inviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['ADMIN', 'MANAGER', 'TECHNICIAN']).default('TECHNICIAN'),
});

const updateOrganizationSchema = z.object({
  name: z.string().optional(),
  settings: z.object({
    timezone: z.string().optional(),
    dateFormat: z.string().optional(),
    currency: z.string().optional(),
  }).optional(),
});

// Get current organization details
export const getOrganization = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const organization = await organizationService.getOrganizationById(user.organizationId);
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.json(organization);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Update organization settings (admin only)
export const updateOrganization = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can update organization settings' });
    }
    
    const data = updateOrganizationSchema.parse(req.body);
    const organization = await organizationService.updateOrganization(user.organizationId, data);
    
    res.json(organization);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get all users in organization (admin/manager only)
export const getOrganizationUsers = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const users = await organizationService.getOrganizationUsers(user.organizationId);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Invite user to organization (admin only)
export const inviteUser = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can invite users' });
    }
    
    const data = inviteUserSchema.parse(req.body);
    
    // Check if user already exists with this email
    const existingUser = await organizationService.getUserByEmail(data.email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    const invitation = await organizationService.createUserInvitation({
      ...data,
      organizationId: user.organizationId,
      invitedById: user.id,
    });
    
    res.status(201).json(invitation);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    res.status(500).json({ error: error.message });
  }
};

// Remove user from organization (admin only)
export const removeUser = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { userId } = req.params;
    
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can remove users' });
    }
    
    if (parseInt(userId) === user.id) {
      return res.status(400).json({ error: 'Cannot remove yourself from the organization' });
    }
    
    await organizationService.removeUserFromOrganization(parseInt(userId), user.organizationId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Update user role (admin only)
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { userId } = req.params;
    const { role } = req.body;
    
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can update user roles' });
    }
    
    if (parseInt(userId) === user.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }
    
    if (!['ADMIN', 'MANAGER', 'TECHNICIAN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const updatedUser = await organizationService.updateUserRole(parseInt(userId), role, user.organizationId);
    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};