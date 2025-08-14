
// Temporary auth types for deployment
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    organizationId: number;
    role: string;
    isOnline?: boolean;
    lastSeen?: Date;
    lastActivity?: Date;
  };
  sessionID?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
        organizationId: number;
        role: string;
        isOnline?: boolean;
        lastSeen?: Date;
        lastActivity?: Date;
      };
      sessionID?: string;
    }
  }
}
