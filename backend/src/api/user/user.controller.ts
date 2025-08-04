import { Request, Response } from 'express';
import { UserService } from './user.service';

const userService = new UserService();

export class UserController {
  async getAllUsers(req: Request, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const users = await userService.getAllUsers(organizationId);
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organizationId;
      
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const user = await userService.getUserById(parseInt(id), organizationId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  async createUser(req: Request, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      // Check if user has admin/manager permissions
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MANAGER') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const userData = {
        ...req.body,
        organizationId,
      };

      const user = await userService.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.code === 'P2002') {
        res.status(400).json({ error: 'Email already exists' });
      } else {
        res.status(500).json({ error: 'Failed to create user' });
      }
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organizationId;
      
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      // Check if user has admin/manager permissions or is updating themselves
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MANAGER' && req.user?.id !== parseInt(id)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const user = await userService.updateUser(parseInt(id), organizationId, req.body);
      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organizationId;
      
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      // Check if user has admin permissions
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Prevent users from deleting themselves
      if (req.user?.id === parseInt(id)) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      await userService.deleteUser(parseInt(id), organizationId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  async getUserWorkOrders(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organizationId;
      
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const workOrders = await userService.getUserWorkOrders(parseInt(id), organizationId);
      res.json(workOrders);
    } catch (error) {
      console.error('Error fetching user work orders:', error);
      res.status(500).json({ error: 'Failed to fetch user work orders' });
    }
  }

  async getUserStats(req: Request, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const stats = await userService.getUserStats(organizationId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ error: 'Failed to fetch user stats' });
    }
  }
}