import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import * as commentController from './comment.controller';

const router = Router();

// Entity-specific comment routes
router.get('/:entityType/:entityId', commentController.getComments);
router.post('/:entityType/:entityId', commentController.createComment);
router.get('/:entityType/:entityId/count', commentController.getCommentCount);
router.get('/:entityType/:entityId/recent', commentController.getRecentComments);

// Individual comment routes
router.get('/comment/:id', commentController.getComment);
router.put('/comment/:id', commentController.updateComment);
router.delete('/comment/:id', commentController.deleteComment);

// Comment management routes
router.patch('/comment/:id/pin', commentController.togglePin);
router.patch('/comment/:id/internal', commentController.toggleInternal);

// Search and user-specific routes
router.get('/search', commentController.searchComments);
router.get('/user/:userId', commentController.getCommentsByUser);

export default router;