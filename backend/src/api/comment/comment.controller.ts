import { Request, Response } from 'express';
import { commentService, CreateCommentRequest, UpdateCommentRequest } from './comment.service';

// Get comments for a specific entity
export const getComments = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const { 
      isInternal, 
      isPinned, 
      userId, 
      includeReplies = 'true' 
    } = req.query;

    const filters = {
      isInternal: isInternal === 'true' ? true : isInternal === 'false' ? false : undefined,
      isPinned: isPinned === 'true' ? true : isPinned === 'false' ? false : undefined,
      userId: userId ? parseInt(userId as string) : undefined,
      includeReplies: includeReplies === 'true',
    };

    const comments = await commentService.getCommentsForEntity(
      entityType,
      parseInt(entityId),
      filters
    );

    res.json({
      success: true,
      data: comments,
      count: comments.length,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get a single comment by ID
export const getComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const comment = await commentService.getCommentById(parseInt(id));

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
    }

    res.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error('Error fetching comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comment',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Create a new comment
export const createComment = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const { content, isInternal, isPinned, parentId, attachments } = req.body;

    // Get user ID from auth middleware (assuming it's set in req.user)
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Validate required fields
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required',
      });
    }

    // Validate entity type
    const validEntityTypes = ['workOrder', 'asset', 'location', 'part', 'pmSchedule'];
    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid entity type',
        validTypes: validEntityTypes,
      });
    }

    const commentData: CreateCommentRequest = {
      entityType: entityType as any,
      entityId: parseInt(entityId),
      content: content.trim(),
      isInternal: isInternal || false,
      isPinned: isPinned || false,
      userId,
      parentId: parentId ? parseInt(parentId) : undefined,
      attachments: attachments || [],
    };

    const comment = await commentService.createComment(commentData);

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment created successfully',
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create comment',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Update a comment
export const updateComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, isInternal, isPinned, attachments } = req.body;

    // Get user ID from auth middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Check if comment exists and user owns it or is admin
    const existingComment = await commentService.getCommentById(parseInt(id));
    if (!existingComment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
    }

    // Check permissions (comment owner or admin/manager)
    const userRole = (req as any).user?.role;
    if (existingComment.userId !== userId && !['ADMIN', 'MANAGER'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this comment',
      });
    }

    const updateData: UpdateCommentRequest = {
      editedById: userId,
    };

    if (content !== undefined) updateData.content = content.trim();
    if (isInternal !== undefined) updateData.isInternal = isInternal;
    if (isPinned !== undefined) updateData.isPinned = isPinned;
    if (attachments !== undefined) updateData.attachments = attachments;

    const updatedComment = await commentService.updateComment(parseInt(id), updateData);

    res.json({
      success: true,
      data: updatedComment,
      message: 'Comment updated successfully',
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update comment',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Delete a comment
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get user ID from auth middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Check if comment exists and user owns it or is admin
    const existingComment = await commentService.getCommentById(parseInt(id));
    if (!existingComment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
    }

    // Check permissions (comment owner or admin/manager)
    const userRole = (req as any).user?.role;
    if (existingComment.userId !== userId && !['ADMIN', 'MANAGER'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this comment',
      });
    }

    const deleted = await commentService.deleteComment(parseInt(id));

    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete comment',
      });
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get comment count for an entity
export const getCommentCount = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const { includeInternal = 'true' } = req.query;

    const count = await commentService.getCommentCount(
      entityType,
      parseInt(entityId),
      includeInternal === 'true'
    );

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Error fetching comment count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comment count',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Toggle pin status
export const togglePin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isPinned } = req.body;

    // Get user ID from auth middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Check if user has permission to pin (admin/manager only)
    const userRole = (req as any).user?.role;
    if (!['ADMIN', 'MANAGER'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to pin/unpin comments',
      });
    }

    const comment = await commentService.togglePin(parseInt(id), isPinned, userId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
    }

    res.json({
      success: true,
      data: comment,
      message: `Comment ${isPinned ? 'pinned' : 'unpinned'} successfully`,
    });
  } catch (error) {
    console.error('Error toggling pin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle pin status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Toggle internal status
export const toggleInternal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isInternal } = req.body;

    // Get user ID from auth middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Check if user has permission to mark as internal (admin/manager only)
    const userRole = (req as any).user?.role;
    if (!['ADMIN', 'MANAGER'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to mark comments as internal',
      });
    }

    const comment = await commentService.toggleInternal(parseInt(id), isInternal, userId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
    }

    res.json({
      success: true,
      data: comment,
      message: `Comment marked as ${isInternal ? 'internal' : 'public'} successfully`,
    });
  } catch (error) {
    console.error('Error toggling internal status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle internal status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Search comments
export const searchComments = async (req: Request, res: Response) => {
  try {
    const { q, entityType, entityId, limit = '50' } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    const comments = await commentService.searchComments(
      q.trim(),
      entityType as string,
      entityId ? parseInt(entityId as string) : undefined,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: comments,
      count: comments.length,
      query: q.trim(),
    });
  } catch (error) {
    console.error('Error searching comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search comments',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get recent comments for an entity
export const getRecentComments = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const { limit = '5', includeInternal = 'true' } = req.query;

    const comments = await commentService.getRecentComments(
      entityType,
      parseInt(entityId),
      parseInt(limit as string),
      includeInternal === 'true'
    );

    res.json({
      success: true,
      data: comments,
      count: comments.length,
    });
  } catch (error) {
    console.error('Error fetching recent comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent comments',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get comments by user
export const getCommentsByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = '50' } = req.query;

    const comments = await commentService.getCommentsByUser(
      parseInt(userId),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: comments,
      count: comments.length,
    });
  } catch (error) {
    console.error('Error fetching user comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user comments',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};