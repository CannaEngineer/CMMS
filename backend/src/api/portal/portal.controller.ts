import { Request, Response } from 'express';
import { PortalService } from './portal.service';
import type { CreatePortalRequest, UpdatePortalRequest, SubmitPortalRequest } from './portal.types';

const portalService = new PortalService();

// Portal Management (Admin)
export const getPortals = async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const filters = {
      type: req.query.type as string,
      status: req.query.status as string,
      searchTerm: req.query.search as string,
      organizationId,
      createdAfter: req.query.createdAfter as string,
      createdBefore: req.query.createdBefore as string
    };

    const portals = await portalService.getAllPortals(organizationId, filters);
    res.json(portals);
  } catch (error) {
    console.error('Error getting portals:', error);
    res.status(500).json({ error: 'Failed to retrieve portals' });
  }
};

export const getPortalById = async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).user?.organizationId;
    const id = parseInt(req.params.id);

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const portal = await portalService.getPortalById(id, organizationId);
    if (!portal) {
      return res.status(404).json({ error: 'Portal not found' });
    }

    res.json(portal);
  } catch (error) {
    console.error('Error getting portal:', error);
    res.status(500).json({ error: 'Failed to retrieve portal' });
  }
};

export const createPortal = async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const portalData: CreatePortalRequest = req.body;
    
    // Log the received data for debugging
    console.log('Received portal data:', JSON.stringify(portalData, null, 2));
    
    // Validate required fields
    if (!portalData.name || !portalData.type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const portal = await portalService.createPortal(portalData, organizationId);
    res.status(201).json(portal);
  } catch (error) {
    console.error('Error creating portal:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Failed to create portal' });
  }
};

export const updatePortal = async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).user?.organizationId;
    const id = parseInt(req.params.id);

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const updateData: UpdatePortalRequest = req.body;
    const portal = await portalService.updatePortal(id, updateData, organizationId);
    
    if (!portal) {
      return res.status(404).json({ error: 'Portal not found' });
    }

    res.json(portal);
  } catch (error) {
    console.error('Error updating portal:', error);
    res.status(500).json({ error: 'Failed to update portal' });
  }
};

export const deletePortal = async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).user?.organizationId;
    const id = parseInt(req.params.id);

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const success = await portalService.deletePortal(id, organizationId);
    
    if (!success) {
      return res.status(404).json({ error: 'Portal not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting portal:', error);
    res.status(500).json({ error: 'Failed to delete portal' });
  }
};

// Portal Fields Management
export const updatePortalFields = async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).user?.organizationId;
    const portalId = parseInt(req.params.id);

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const { fields } = req.body;
    if (!Array.isArray(fields)) {
      return res.status(400).json({ error: 'Fields must be an array' });
    }

    const updatedFields = await portalService.updatePortalFields(portalId, fields, organizationId);
    res.json(updatedFields);
  } catch (error) {
    console.error('Error updating portal fields:', error);
    res.status(500).json({ error: 'Failed to update portal fields' });
  }
};

// Public Portal Access (No Auth Required)
export const getPublicPortal = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const portal = await portalService.getPortalBySlug(slug);
    
    if (!portal || !portal.isActive) {
      return res.status(404).json({ error: 'Portal not found or inactive' });
    }

    // Only return public fields for anonymous access
    const publicPortal = {
      id: portal.id,
      name: portal.name,
      description: portal.description,
      type: portal.type,
      fields: portal.fields,
      branding: {
        primaryColor: portal.primaryColor,
        secondaryColor: portal.secondaryColor,
        accentColor: portal.accentColor,
        logoUrl: portal.logoUrl,
        backgroundImageUrl: portal.backgroundImageUrl,
        customCss: portal.customCss
      },
      allowAnonymous: portal.allowAnonymous,
      qrEnabled: portal.qrEnabled
    };

    res.json(publicPortal);
  } catch (error) {
    console.error('Error getting public portal:', error);
    res.status(500).json({ error: 'Failed to retrieve portal' });
  }
};

export const submitPortal = async (req: Request, res: Response) => {
  try {
    const submitData: SubmitPortalRequest = req.body;
    
    // Add client information
    submitData.clientInfo = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer')
    };

    const result = await portalService.submitPortal(submitData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error submitting portal:', error);
    res.status(500).json({ error: 'Failed to submit portal request' });
  }
};

// Portal Submissions Management (Admin)
export const getSubmissions = async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const filters = {
      portalId: req.query.portalId ? parseInt(req.query.portalId as string) : undefined,
      status: req.query.status as string,
      organizationId,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50
    };

    const result = await portalService.getSubmissions(filters);
    res.json(result);
  } catch (error) {
    console.error('Error getting submissions:', error);
    res.status(500).json({ error: 'Failed to retrieve submissions' });
  }
};

export const updateSubmissionStatus = async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).user?.organizationId;
    const id = parseInt(req.params.id);
    const { status, reviewNotes } = req.body;

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const submission = await portalService.updateSubmissionStatus(id, status, reviewNotes, organizationId);
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Error updating submission status:', error);
    res.status(500).json({ error: 'Failed to update submission status' });
  }
};

export const createWorkOrderFromSubmission = async (req: Request, res: Response) => {
  try {
    const submissionId = parseInt(req.params.id);
    const result = await portalService.createWorkOrderFromSubmission(submissionId);
    res.json(result);
  } catch (error) {
    console.error('Error creating work order from submission:', error);
    res.status(500).json({ error: 'Failed to create work order' });
  }
};

// Portal Analytics
export const getPortalAnalytics = async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).user?.organizationId;
    const portalId = parseInt(req.params.id);
    const timeframe = req.query.timeframe as string || '30d';

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    // Verify portal ownership
    const portal = await portalService.getPortalById(portalId, organizationId);
    if (!portal) {
      return res.status(404).json({ error: 'Portal not found' });
    }

    const analytics = await portalService.getPortalAnalytics(portalId, timeframe);
    res.json(analytics);
  } catch (error) {
    console.error('Error getting portal analytics:', error);
    res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
};

// Rate Limiting Check
export const checkRateLimit = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const ipAddress = req.ip;

    // Simple rate limiting implementation
    // In production, use Redis or similar for distributed rate limiting
    const allowed = true; // Mock implementation
    const remainingRequests = 95;
    const resetTime = new Date(Date.now() + 3600000).toISOString();

    res.json({
      allowed,
      remainingRequests,
      resetTime
    });
  } catch (error) {
    console.error('Error checking rate limit:', error);
    res.status(500).json({ error: 'Failed to check rate limit' });
  }
};