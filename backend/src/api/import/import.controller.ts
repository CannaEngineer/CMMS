import { Request, Response } from 'express';
import { parse } from 'csv-parse/sync';
import { ImportService, ImportRequest } from './import.service';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    organizationId: number;
    role: string;
  };
}

export class ImportController {
  // Parse and analyze CSV file
  static async analyzeCSV(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No CSV file uploaded' });
      }

      const { entityType } = req.body;
      if (!entityType) {
        return res.status(400).json({ error: 'Entity type is required' });
      }

      // Parse CSV file
      const csvContent = req.file.buffer.toString('utf-8');
      const parsedData = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      if (!parsedData || parsedData.length === 0) {
        return res.status(400).json({ error: 'CSV file is empty or invalid' });
      }

      const headers = Object.keys(parsedData[0]);
      
      // Generate intelligent column mappings
      const columnMappings = ImportService.generateColumnMappings(headers, entityType);

      // Basic data preview
      const preview = parsedData.slice(0, 10);

      res.json({
        success: true,
        data: {
          fileName: req.file.originalname,
          totalRows: parsedData.length,
          headers,
          columnMappings,
          preview,
          entityType
        }
      });

    } catch (error: any) {
      console.error('CSV analysis error:', error);
      res.status(500).json({ error: error.message || 'Failed to analyze CSV file' });
    }
  }

  // Validate CSV data and mappings
  static async validateImport(req: AuthenticatedRequest, res: Response) {
    try {
      const { csvData, mappings, entityType } = req.body;
      const organizationId = req.user?.organizationId!;

      if (!csvData || !mappings || !entityType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Validate data
      const validation = await ImportService.validateData(csvData, mappings, entityType, organizationId);
      
      // Check for duplicates
      const duplicateCheck = await ImportService.checkDuplicates(csvData, mappings, entityType, organizationId);

      res.json({
        success: true,
        validation,
        duplicates: duplicateCheck.duplicates,
        conflicts: duplicateCheck.conflicts,
        canProceed: validation.valid && duplicateCheck.conflicts.length === 0
      });

    } catch (error: any) {
      console.error('Import validation error:', error);
      res.status(500).json({ error: error.message || 'Failed to validate import data' });
    }
  }

  // Execute the import
  static async executeImport(req: AuthenticatedRequest, res: Response) {
    try {
      console.log('Import request received:', {
        hasBody: !!req.body,
        bodyKeys: Object.keys(req.body || {}),
        userInfo: req.user
      });

      const { csvData, mappings, entityType } = req.body;
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;

      console.log('Import parameters:', {
        entityType,
        mappingsCount: mappings?.length,
        csvDataCount: csvData?.length,
        userId,
        organizationId
      });

      if (!csvData || !mappings || !entityType) {
        console.error('Missing required fields:', { csvData: !!csvData, mappings: !!mappings, entityType });
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (!userId || !organizationId) {
        console.error('Missing user authentication info:', { userId, organizationId });
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const importRequest: ImportRequest = {
        entityType,
        mappings,
        csvData
      };

      console.log('Calling ImportService.executeImport...');
      const result = await ImportService.executeImport(importRequest, userId, organizationId);
      console.log('Import completed with result:', result);

      res.json(result);

    } catch (error: any) {
      console.error('Import execution error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        error: error.message || 'Failed to execute import',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Get available entity types and their configurations
  static async getEntityConfigs(req: AuthenticatedRequest, res: Response) {
    try {
      const configs = ImportService.getEntityConfigs();
      res.json({
        success: true,
        entityTypes: configs
      });
    } catch (error: any) {
      console.error('Error getting entity configs:', error);
      res.status(500).json({ error: error.message || 'Failed to get entity configurations' });
    }
  }

  // Get import template for an entity type
  static async getImportTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const { entityType } = req.params;
      
      const configs = ImportService.getEntityConfigs();
      const config = configs.find(c => c.value === entityType);
      
      if (!config) {
        return res.status(404).json({ error: 'Entity type not found' });
      }

      // Generate CSV template
      const headers = config.fields.map(field => field.label);
      const csvTemplate = headers.join(',') + '\n';
      
      // Add example row
      const exampleRow = config.fields.map(field => {
        switch (field.type) {
          case 'string':
            return `Example ${field.label}`;
          case 'number':
            return '123';
          case 'date':
            return new Date().toISOString().split('T')[0];
          case 'enum':
            return field.enumValues?.[0] || 'EXAMPLE';
          case 'boolean':
            return 'true';
          default:
            return 'example';
        }
      });
      
      const csvContent = csvTemplate + exampleRow.join(',');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${entityType}_template.csv"`);
      res.send(csvContent);

    } catch (error: any) {
      console.error('Template generation error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate template' });
    }
  }

  // Get import history
  static async getImportHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const organizationId = req.user?.organizationId!;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const imports = await ImportService.getImportHistory(organizationId, limit, offset);
      
      res.json({
        success: true,
        imports
      });

    } catch (error: any) {
      console.error('Import history error:', error);
      res.status(500).json({ error: error.message || 'Failed to get import history' });
    }
  }

  // Rollback an import
  static async rollbackImport(req: AuthenticatedRequest, res: Response) {
    try {
      const { importId } = req.params;
      const organizationId = req.user?.organizationId!;
      const userId = req.user?.id!;

      if (!importId) {
        return res.status(400).json({ error: 'Import ID is required' });
      }

      const result = await ImportService.rollbackImport(importId, userId, organizationId);
      
      res.json({
        success: true,
        result
      });

    } catch (error: any) {
      console.error('Import rollback error:', error);
      res.status(500).json({ error: error.message || 'Failed to rollback import' });
    }
  }
}