import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as publicShareController from './publicShare.controller';

const router = Router();

// Rate limiting middleware for public share access
const shareAccessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please try again later.'
  }
});

// Stricter rate limiting for comment posting
const commentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 comments per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many comments. Please try again later.'
  }
});

// Apply rate limiting to all public share routes
router.use(shareAccessLimiter);

// Public work order access (no authentication required)
router.get('/share/:shareToken', publicShareController.getPublicWorkOrder);
router.get('/share/:shareToken/comments', publicShareController.getPublicComments);

// Comment posting with stricter rate limiting
router.post('/share/:shareToken/comments', commentLimiter, publicShareController.addPublicComment);

export default router;