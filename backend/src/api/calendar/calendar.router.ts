import { Router } from 'express';
import { calendarController } from './calendar.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all calendar routes
router.use(authenticate);

// Calendar items endpoints
router.get('/items', calendarController.getCalendarItems);
router.get('/items/:date', calendarController.getCalendarItemsForDate);

// Calendar statistics for dashboard
router.get('/stats', calendarController.getCalendarStats);

// Month view data
router.get('/month/:year/:month', calendarController.getMonthData);
router.get('/current-month', calendarController.getCurrentMonthData);

// Today's items convenience endpoint
router.get('/today', calendarController.getTodaysItems);

// Item management
router.post('/pm/:pmId/create-work-order', calendarController.createWorkOrderFromPM);
router.put('/reschedule', calendarController.rescheduleItem);

export default router;