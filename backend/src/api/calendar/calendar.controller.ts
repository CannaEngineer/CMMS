import { Request, Response } from 'express';
import { calendarService } from './calendar.service';
import dayjs from 'dayjs';

export const calendarController = {
  // GET /api/calendar/items - Get calendar items with filtering
  async getCalendarItems(req: Request, res: Response) {
    try {
      const { organizationId } = req.user;
      const {
        startDate,
        endDate,
        type,
        assetId,
        locationId,
        assignedToId,
      } = req.query;

      const items = await calendarService.getCalendarItems(
        organizationId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        type as 'PM_SCHEDULE' | 'WORK_ORDER' | 'ALL',
        assetId ? parseInt(assetId as string) : undefined,
        locationId ? parseInt(locationId as string) : undefined,
        assignedToId ? parseInt(assignedToId as string) : undefined
      );

      res.json(items);
    } catch (error) {
      console.error('Error fetching calendar items:', error);
      res.status(500).json({ error: 'Failed to fetch calendar items' });
    }
  },

  // GET /api/calendar/items/:date - Get calendar items for specific date
  async getCalendarItemsForDate(req: Request, res: Response) {
    try {
      const { organizationId } = req.user;
      const { date } = req.params;
      const { type } = req.query;

      const items = await calendarService.getCalendarItemsForDate(
        organizationId,
        new Date(date),
        type as 'PM_SCHEDULE' | 'WORK_ORDER' | 'ALL'
      );

      res.json(items);
    } catch (error) {
      console.error('Error fetching calendar items for date:', error);
      res.status(500).json({ error: 'Failed to fetch calendar items for date' });
    }
  },

  // GET /api/calendar/stats - Get calendar statistics for dashboard
  async getCalendarStats(req: Request, res: Response) {
    try {
      const { organizationId } = req.user;

      const stats = await calendarService.getCalendarStats(organizationId);

      res.json(stats);
    } catch (error) {
      console.error('Error fetching calendar stats:', error);
      res.status(500).json({ error: 'Failed to fetch calendar statistics' });
    }
  },

  // GET /api/calendar/month/:year/:month - Get optimized month view data
  async getMonthData(req: Request, res: Response) {
    try {
      const { organizationId } = req.user;
      const { year, month } = req.params;

      const monthData = await calendarService.getMonthData(
        organizationId,
        parseInt(year),
        parseInt(month)
      );

      res.json(monthData);
    } catch (error) {
      console.error('Error fetching month data:', error);
      res.status(500).json({ error: 'Failed to fetch month data' });
    }
  },

  // POST /api/calendar/pm/:pmId/create-work-order - Create work order from PM
  async createWorkOrderFromPM(req: Request, res: Response) {
    try {
      const { organizationId } = req.user;
      const { pmId } = req.params;
      const { assignedToId, dueDate } = req.body;

      const workOrder = await calendarService.createWorkOrderFromPM(
        organizationId,
        parseInt(pmId),
        assignedToId,
        dueDate ? new Date(dueDate) : undefined
      );

      res.status(201).json(workOrder);
    } catch (error) {
      console.error('Error creating work order from PM:', error);
      res.status(500).json({ error: error.message || 'Failed to create work order from PM' });
    }
  },

  // PUT /api/calendar/reschedule - Reschedule calendar item
  async rescheduleItem(req: Request, res: Response) {
    try {
      const { organizationId } = req.user;
      const { itemId, itemType, newDate } = req.body;

      if (!itemId || !itemType || !newDate) {
        return res.status(400).json({ error: 'Missing required fields: itemId, itemType, newDate' });
      }

      if (itemType !== 'PM_SCHEDULE' && itemType !== 'WORK_ORDER') {
        return res.status(400).json({ error: 'Invalid itemType. Must be PM_SCHEDULE or WORK_ORDER' });
      }

      const result = await calendarService.rescheduleItem(
        organizationId,
        parseInt(itemId),
        itemType,
        new Date(newDate)
      );

      if (result.count === 0) {
        return res.status(404).json({ error: 'Item not found or not authorized' });
      }

      res.json({ success: true, rescheduled: result.count });
    } catch (error) {
      console.error('Error rescheduling item:', error);
      res.status(500).json({ error: 'Failed to reschedule item' });
    }
  },

  // GET /api/calendar/current-month - Get current month data (convenience endpoint)
  async getCurrentMonthData(req: Request, res: Response) {
    try {
      const { organizationId } = req.user;
      const now = dayjs();

      const monthData = await calendarService.getMonthData(
        organizationId,
        now.year(),
        now.month() + 1 // dayjs months are 0-indexed, but our service expects 1-indexed
      );

      res.json(monthData);
    } catch (error) {
      console.error('Error fetching current month data:', error);
      res.status(500).json({ error: 'Failed to fetch current month data' });
    }
  },

  // GET /api/calendar/today - Get today's calendar items (convenience endpoint)
  async getTodaysItems(req: Request, res: Response) {
    try {
      const { organizationId } = req.user;
      const { type } = req.query;

      const items = await calendarService.getCalendarItemsForDate(
        organizationId,
        new Date(),
        type as 'PM_SCHEDULE' | 'WORK_ORDER' | 'ALL'
      );

      res.json(items);
    } catch (error) {
      console.error('Error fetching today\'s items:', error);
      res.status(500).json({ error: 'Failed to fetch today\'s calendar items' });
    }
  },
};