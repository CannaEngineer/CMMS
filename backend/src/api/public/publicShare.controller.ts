import { Request, Response } from 'express';
import { WorkOrderShareService } from '../work-order/workOrderShare.service';

const shareService = new WorkOrderShareService();

// Middleware to get client IP address properly
const getClientIp = (req: Request): string => {
  return req.ip || 
    req.connection?.remoteAddress || 
    req.socket?.remoteAddress || 
    (req.connection as any)?.socket?.remoteAddress ||
    '127.0.0.1';
};

export const getPublicWorkOrder = async (req: Request, res: Response) => {
  try {
    const { shareToken } = req.params;
    const clientIp = getClientIp(req);

    if (!shareToken || !/^[A-Za-z0-9_-]+$/.test(shareToken)) {
      return res.status(400).json({ 
        error: 'Invalid share token format' 
      });
    }

    const result = await shareService.getPublicWorkOrder(shareToken, clientIp);

    if (!result) {
      return res.status(404).json({ 
        error: 'Work order not found or share has expired' 
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching public work order:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
};

export const addPublicComment = async (req: Request, res: Response) => {
  try {
    const { shareToken } = req.params;
    const { content, authorName, authorEmail } = req.body;
    const clientIp = getClientIp(req);
    const userAgent = req.get('User-Agent');

    if (!shareToken || !/^[A-Za-z0-9_-]+$/.test(shareToken)) {
      return res.status(400).json({ 
        error: 'Invalid share token format' 
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Comment content is required' 
      });
    }

    // First, verify the share exists and allows comments
    const share = await shareService.getShareByToken(shareToken);
    if (!share) {
      return res.status(404).json({ 
        error: 'Share not found or expired' 
      });
    }

    if (!share.allowComments) {
      return res.status(403).json({ 
        error: 'Comments are not allowed for this share' 
      });
    }

    const comment = await shareService.addPublicComment(
      share.id,
      content,
      authorName || null,
      authorEmail || null,
      clientIp,
      userAgent
    );

    // Return limited comment data (excluding sensitive info)
    res.status(201).json({
      id: comment.id,
      content: comment.content,
      authorName: comment.authorName,
      status: comment.status,
      createdAt: comment.createdAt,
      message: 'Comment submitted successfully and is pending moderation'
    });
  } catch (error) {
    console.error('Error adding public comment:', error);
    
    if (error.message.includes('too long') || error.message.includes('empty') || error.message.includes('prohibited')) {
      return res.status(400).json({ 
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
};

export const getPublicComments = async (req: Request, res: Response) => {
  try {
    const { shareToken } = req.params;
    const { status = 'APPROVED' } = req.query;

    if (!shareToken || !/^[A-Za-z0-9_-]+$/.test(shareToken)) {
      return res.status(400).json({ 
        error: 'Invalid share token format' 
      });
    }

    // Verify the share exists first
    const share = await shareService.getShareByToken(shareToken);
    if (!share) {
      return res.status(404).json({ 
        error: 'Share not found or expired' 
      });
    }

    const comments = await shareService.getPublicComments(share.id, status as string);

    res.json({
      comments,
      total: comments.length
    });
  } catch (error) {
    console.error('Error fetching public comments:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
};