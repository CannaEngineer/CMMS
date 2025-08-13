import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  organizationId: number;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}