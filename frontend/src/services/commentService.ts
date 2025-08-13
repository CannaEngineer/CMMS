// Comments service for CMMS commenting system
import { apiClient } from './api';

// Comment types
export interface Comment {
  id: number;
  entityType: 'workOrder' | 'asset' | 'location' | 'part' | 'pmSchedule';
  entityId: number;
  content: string;
  isInternal: boolean;
  isPinned: boolean;
  userId: number;
  parentId?: number;
  attachments?: string[];
  editedAt?: string;
  editedById?: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  editedBy?: {
    id: number;
    name: string;
    email: string;
  };
  parent?: {
    id: number;
    content: string;
    user: {
      id: number;
      name: string;
    };
  };
  replies: Comment[];
}

export interface CreateCommentRequest {
  content: string;
  isInternal?: boolean;
  isPinned?: boolean;
  parentId?: number;
  attachments?: string[];
}

export interface UpdateCommentRequest {
  content?: string;
  isInternal?: boolean;
  isPinned?: boolean;
  attachments?: string[];
}

export interface CommentFilters {
  isInternal?: boolean;
  isPinned?: boolean;
  userId?: number;
  includeReplies?: boolean;
}

export interface CommentResponse {
  success: boolean;
  data: Comment | Comment[];
  count?: number;
  message?: string;
}

// Comments service
export const commentService = {
  // Get comments for a specific entity
  async getComments(
    entityType: string,
    entityId: number,
    filters?: CommentFilters
  ): Promise<Comment[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.isInternal !== undefined) {
        queryParams.append('isInternal', filters.isInternal.toString());
      }
      if (filters?.isPinned !== undefined) {
        queryParams.append('isPinned', filters.isPinned.toString());
      }
      if (filters?.userId) {
        queryParams.append('userId', filters.userId.toString());
      }
      if (filters?.includeReplies !== undefined) {
        queryParams.append('includeReplies', filters.includeReplies.toString());
      }

      const queryString = queryParams.toString();
      const endpoint = `/api/comments/${entityType}/${entityId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<CommentResponse>(endpoint);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn(`Comments API not available for ${entityType}:${entityId}`);
      return [];
    }
  },

  // Get a single comment by ID
  async getComment(id: number): Promise<Comment | null> {
    try {
      const response = await apiClient.get<CommentResponse>(`/api/comments/comment/${id}`);
      return response.data as Comment;
    } catch (error) {
      throw new Error(`Failed to fetch comment ${id}`);
    }
  },

  // Create a new comment
  async createComment(
    entityType: string,
    entityId: number,
    commentData: CreateCommentRequest
  ): Promise<Comment> {
    try {
      const response = await apiClient.post<CommentResponse>(
        `/api/comments/${entityType}/${entityId}`,
        commentData
      );
      return response.data as Comment;
    } catch (error) {
      throw new Error('Failed to create comment');
    }
  },

  // Update a comment
  async updateComment(id: number, commentData: UpdateCommentRequest): Promise<Comment> {
    try {
      const response = await apiClient.put<CommentResponse>(
        `/api/comments/comment/${id}`,
        commentData
      );
      return response.data as Comment;
    } catch (error) {
      throw new Error(`Failed to update comment ${id}`);
    }
  },

  // Delete a comment
  async deleteComment(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/comments/comment/${id}`);
    } catch (error) {
      throw new Error(`Failed to delete comment ${id}`);
    }
  },

  // Get comment count for an entity
  async getCommentCount(
    entityType: string,
    entityId: number,
    includeInternal: boolean = true
  ): Promise<number> {
    try {
      const queryParams = includeInternal ? '' : '?includeInternal=false';
      const response = await apiClient.get<CommentResponse>(
        `/api/comments/${entityType}/${entityId}/count${queryParams}`
      );
      return (response.data as any).count || 0;
    } catch (error) {
      console.warn(`Comment count API not available for ${entityType}:${entityId}`);
      return 0;
    }
  },

  // Get recent comments for an entity
  async getRecentComments(
    entityType: string,
    entityId: number,
    limit: number = 5,
    includeInternal: boolean = true
  ): Promise<Comment[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('limit', limit.toString());
      queryParams.append('includeInternal', includeInternal.toString());

      const response = await apiClient.get<CommentResponse>(
        `/api/comments/${entityType}/${entityId}/recent?${queryParams.toString()}`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn(`Recent comments API not available for ${entityType}:${entityId}`);
      return [];
    }
  },

  // Toggle pin status
  async togglePin(id: number, isPinned: boolean): Promise<Comment> {
    try {
      const response = await apiClient.put<CommentResponse>(
        `/api/comments/comment/${id}/pin`,
        { isPinned }
      );
      return response.data as Comment;
    } catch (error) {
      throw new Error(`Failed to ${isPinned ? 'pin' : 'unpin'} comment ${id}`);
    }
  },

  // Toggle internal status
  async toggleInternal(id: number, isInternal: boolean): Promise<Comment> {
    try {
      const response = await apiClient.put<CommentResponse>(
        `/api/comments/comment/${id}/internal`,
        { isInternal }
      );
      return response.data as Comment;
    } catch (error) {
      throw new Error(`Failed to mark comment ${id} as ${isInternal ? 'internal' : 'public'}`);
    }
  },

  // Search comments
  async searchComments(
    searchTerm: string,
    entityType?: string,
    entityId?: number,
    limit: number = 50
  ): Promise<Comment[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('q', searchTerm);
      queryParams.append('limit', limit.toString());
      
      if (entityType) {
        queryParams.append('entityType', entityType);
      }
      if (entityId) {
        queryParams.append('entityId', entityId.toString());
      }

      const response = await apiClient.get<CommentResponse>(
        `/api/comments/search?${queryParams.toString()}`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn('Comment search API not available');
      return [];
    }
  },

  // Get comments by user
  async getCommentsByUser(userId: number, limit: number = 50): Promise<Comment[]> {
    try {
      const response = await apiClient.get<CommentResponse>(
        `/api/comments/user/${userId}?limit=${limit}`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn(`Comments by user ${userId} API not available`);
      return [];
    }
  },

  // Reply to a comment
  async replyToComment(
    entityType: string,
    entityId: number,
    parentId: number,
    content: string,
    isInternal: boolean = false
  ): Promise<Comment> {
    try {
      const response = await apiClient.post<CommentResponse>(
        `/api/comments/${entityType}/${entityId}`,
        {
          content,
          isInternal,
          parentId,
        }
      );
      return response.data as Comment;
    } catch (error) {
      throw new Error('Failed to reply to comment');
    }
  },

  // Get entity comment summary (for dashboard/overview)
  async getEntityCommentSummary(entityType: string, entityId: number): Promise<{
    total: number;
    pinned: number;
    internal: number;
    recent: Comment[];
  }> {
    try {
      const [total, recent] = await Promise.all([
        this.getCommentCount(entityType, entityId),
        this.getRecentComments(entityType, entityId, 3),
      ]);

      const pinned = recent.filter(c => c.isPinned).length;
      const internal = recent.filter(c => c.isInternal).length;

      return {
        total,
        pinned,
        internal,
        recent,
      };
    } catch (error) {
      console.warn(`Failed to get comment summary for ${entityType}:${entityId}`);
      return {
        total: 0,
        pinned: 0,
        internal: 0,
        recent: [],
      };
    }
  },

  // Batch operations
  async batchUpdateComments(
    commentIds: number[],
    updates: Partial<UpdateCommentRequest>
  ): Promise<Comment[]> {
    try {
      const promises = commentIds.map(id => this.updateComment(id, updates));
      return await Promise.all(promises);
    } catch (error) {
      throw new Error('Failed to batch update comments');
    }
  },

  async batchDeleteComments(commentIds: number[]): Promise<void> {
    try {
      const promises = commentIds.map(id => this.deleteComment(id));
      await Promise.all(promises);
    } catch (error) {
      throw new Error('Failed to batch delete comments');
    }
  },

  // Get comment thread (parent + all replies)
  async getCommentThread(id: number): Promise<Comment> {
    try {
      const comment = await this.getComment(id);
      if (!comment) {
        throw new Error('Comment not found');
      }

      // If this is a reply, get the parent comment with all replies
      if (comment.parentId) {
        return await this.getComment(comment.parentId);
      }

      // This is already a parent comment with replies
      return comment;
    } catch (error) {
      throw new Error(`Failed to fetch comment thread for ${id}`);
    }
  },

  // Helper function to format comment for display
  formatCommentForDisplay(comment: Comment): {
    id: number;
    content: string;
    author: string;
    authorRole: string;
    timestamp: string;
    isEdited: boolean;
    isPinned: boolean;
    isInternal: boolean;
    replyCount: number;
    canEdit: boolean;
    canDelete: boolean;
  } {
    return {
      id: comment.id,
      content: comment.content,
      author: comment.user.name,
      authorRole: comment.user.role,
      timestamp: comment.createdAt,
      isEdited: !!comment.editedAt,
      isPinned: comment.isPinned,
      isInternal: comment.isInternal,
      replyCount: comment.replies?.length || 0,
      canEdit: true, // Will be determined by permissions in component
      canDelete: true, // Will be determined by permissions in component
    };
  },

  // Helper function to get user avatar initials
  getUserInitials(userName: string): string {
    return userName
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  },

  // Helper function to get role color
  getRoleColor(role: string): string {
    const roleColors: Record<string, string> = {
      ADMIN: '#f44336',
      MANAGER: '#ff9800',
      TECHNICIAN: '#2196f3',
    };
    return roleColors[role] || '#9e9e9e';
  },

  // Helper function to format relative time
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  },
};