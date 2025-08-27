import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

// Prisma client imported from singleton

interface AuthenticatedSocket extends Socket {
  userId?: number;
  organizationId?: number;
}

export class WebSocketService {
  private io: SocketIOServer | null = null;
  private static instance: WebSocketService;
  private userConnections: Map<number, Set<string>> = new Map();
  private socketUsers: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public initialize(server: HttpServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });

    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          console.log('WebSocket connection rejected: No token provided');
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
        
        // Verify user exists and get organization info
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, organizationId: true, email: true, name: true }
        });

        if (!user) {
          console.log('WebSocket connection rejected: User not found');
          return next(new Error('Authentication error: User not found'));
        }

        socket.userId = user.id;
        socket.organizationId = user.organizationId;
        
        console.log(`WebSocket authenticated: ${user.email} (${user.id})`);
        next();
      } catch (error) {
        console.log('WebSocket authentication failed:', error);
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      const organizationId = socket.organizationId!;

      console.log(`User ${userId} connected via WebSocket (${socket.id})`);

      // Track user connections
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
        // Update user status to online in database
        prisma.user.update({
          where: { id: userId },
          data: {
            isOnline: true,
            lastSeen: new Date(),
            lastActivity: new Date()
          }
        }).catch(error => {
          console.error('Error updating user online status:', error);
        });
      }
      this.userConnections.get(userId)!.add(socket.id);
      this.socketUsers.set(socket.id, userId);

      // Join user-specific room
      socket.join(`user_${userId}`);
      // Join organization-specific room
      socket.join(`org_${organizationId}`);

      // Send connection confirmation
      socket.emit('connected', {
        message: 'WebSocket connection established',
        userId,
        organizationId,
        timestamp: new Date().toISOString()
      });

      // Handle notification acknowledgment
      socket.on('notification_received', (data) => {
        console.log(`Notification acknowledged by user ${userId}:`, data);
      });

      // Handle notification read status update
      socket.on('notification_read', async (data) => {
        try {
          const { notificationId } = data;
          console.log(`User ${userId} marked notification ${notificationId} as read`);
          
          // Update notification in database
          await prisma.notification.updateMany({
            where: {
              id: notificationId,
              userId
            },
            data: {
              isRead: true,
              readAt: new Date()
            }
          });

          // Broadcast updated stats to all user's connections
          this.sendNotificationStatsUpdate(userId);
        } catch (error) {
          console.error('Error updating notification read status:', error);
        }
      });

      // Handle preference updates
      socket.on('preference_updated', (data) => {
        console.log(`User ${userId} updated preferences:`, data);
      });

      // Handle ping-pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });

      // Handle disconnection
      socket.on('disconnect', async (reason) => {
        console.log(`User ${userId} disconnected (${socket.id}): ${reason}`);
        
        // Clean up user connections
        const userSockets = this.userConnections.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            this.userConnections.delete(userId);
            // Update user status to offline when all connections are closed
            try {
              await prisma.user.update({
                where: { id: userId },
                data: {
                  isOnline: false,
                  lastSeen: new Date()
                }
              });
            } catch (error) {
              console.error('Error updating user offline status:', error);
            }
          }
        }
        this.socketUsers.delete(socket.id);
      });

      // Handle connection errors
      socket.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
      });
    });

    console.log('WebSocket service initialized');
  }

  // Send notification to specific user
  public sendNotificationToUser(userId: number, notification: any): void {
    if (!this.io) {
      console.error('WebSocket service not initialized');
      return;
    }

    try {
      this.io.to(`user_${userId}`).emit('new_notification', {
        type: 'notification',
        data: notification,
        timestamp: new Date().toISOString()
      });

      console.log(`Notification sent to user ${userId}:`, notification.title);
    } catch (error) {
      console.error('Error sending notification to user:', error);
    }
  }

  // Send notification stats update to user
  public sendNotificationStatsToUser(userId: number, stats: any): void {
    if (!this.io) {
      console.error('WebSocket service not initialized');
      return;
    }

    try {
      this.io.to(`user_${userId}`).emit('notification_stats_updated', {
        type: 'stats_update',
        data: stats,
        timestamp: new Date().toISOString()
      });

      console.log(`Notification stats sent to user ${userId}:`, stats);
    } catch (error) {
      console.error('Error sending notification stats to user:', error);
    }
  }

  // Send notification to all users in organization
  public sendNotificationToOrganization(organizationId: number, notification: any): void {
    if (!this.io) {
      console.error('WebSocket service not initialized');
      return;
    }

    try {
      this.io.to(`org_${organizationId}`).emit('organization_notification', {
        type: 'org_notification',
        data: notification,
        timestamp: new Date().toISOString()
      });

      console.log(`Organization notification sent to org ${organizationId}:`, notification.title);
    } catch (error) {
      console.error('Error sending organization notification:', error);
    }
  }

  // Broadcast system-wide notification
  public broadcastSystemNotification(notification: any): void {
    if (!this.io) {
      console.error('WebSocket service not initialized');
      return;
    }

    try {
      this.io.emit('system_notification', {
        type: 'system',
        data: notification,
        timestamp: new Date().toISOString()
      });

      console.log('System notification broadcasted:', notification.title);
    } catch (error) {
      console.error('Error broadcasting system notification:', error);
    }
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.userConnections.size;
  }

  // Get user connection status
  public isUserConnected(userId: number): boolean {
    const userSockets = this.userConnections.get(userId);
    return userSockets !== undefined && userSockets.size > 0;
  }

  // Send connection status update
  public sendConnectionStatus(userId: number, status: 'online' | 'offline'): void {
    if (!this.io) {
      console.error('WebSocket service not initialized');
      return;
    }

    try {
      this.io.to(`user_${userId}`).emit('connection_status', {
        status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending connection status:', error);
    }
  }

  // Private helper method to send notification stats update
  private async sendNotificationStatsUpdate(userId: number): Promise<void> {
    try {
      // Calculate updated stats
      const stats = await prisma.notification.aggregate({
        where: {
          userId,
          isArchived: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        _count: { id: true }
      });

      const unreadCount = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
          isArchived: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });

      const updatedStats = {
        total: stats._count.id,
        unread: unreadCount
      };

      this.sendNotificationStatsToUser(userId, updatedStats);
    } catch (error) {
      console.error('Error calculating notification stats:', error);
    }
  }

  // Cleanup method
  public cleanup(): void {
    if (this.io) {
      this.io.close();
      this.io = null;
    }
    this.userConnections.clear();
    this.socketUsers.clear();
    console.log('WebSocket service cleaned up');
  }
}