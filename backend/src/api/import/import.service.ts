import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import Fuse from 'fuse.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export interface ColumnMapping {
  csvColumn: string;
  targetField: string;
  confidence: number;
  required: boolean;
}

export interface ImportRequest {
  entityType: string;
  mappings: ColumnMapping[];
  csvData: Record<string, any>[];
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errors: string[];
  duplicates: string[];
  importId: string;
}

export interface EntityConfig {
  tableName: string;
  fields: Array<{
    key: string;
    label: string;
    required: boolean;
    type: 'string' | 'number' | 'date' | 'enum' | 'boolean';
    enumValues?: string[];
    relationField?: string; // For foreign key lookups
    relationTable?: string;
  }>;
}

// Entity configurations based on Prisma schema and actual CSV structure
const entityConfigs: Record<string, EntityConfig> = {
  assets: {
    tableName: 'asset',
    fields: [
      { key: 'name', label: 'Name', required: true, type: 'string' },
      { key: 'description', label: 'Description', required: false, type: 'string' },
      { key: 'serialNumber', label: 'Serial Number', required: false, type: 'string' },
      { key: 'modelNumber', label: 'Model', required: false, type: 'string' },
      { key: 'manufacturer', label: 'Manufacturer', required: false, type: 'string' },
      { key: 'year', label: 'Year', required: false, type: 'number' },
      { key: 'status', label: 'Status', required: false, type: 'enum', enumValues: ['ONLINE', 'OFFLINE'] },
      { key: 'criticality', label: 'Criticality', required: false, type: 'enum', enumValues: ['LOW', 'MEDIUM', 'HIGH', 'IMPORTANT'] },
      { key: 'barcode', label: 'Barcode', required: false, type: 'string' },
      { key: 'imageUrl', label: 'Thumbnail', required: false, type: 'string' },
      { key: 'location', label: 'Location', required: true, type: 'string', relationField: 'locationId', relationTable: 'location' },
      // Additional fields from MaintainX CSV
      { key: 'legacyId', label: 'ID', required: false, type: 'number' },
      { key: 'parent', label: 'Parent', required: false, type: 'string', relationField: 'parentId', relationTable: 'asset' },
      // Note: URL and types fields not in Asset schema, removing them
    ]
  },
  workorders: {
    tableName: 'workOrder',
    fields: [
      { key: 'title', label: 'Title', required: true, type: 'string' },
      { key: 'description', label: 'Description', required: false, type: 'string' },
      { key: 'status', label: 'Status', required: false, type: 'enum', enumValues: ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELED'] },
      { key: 'priority', label: 'Priority', required: false, type: 'enum', enumValues: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
      { key: 'assetName', label: 'Asset Name', required: false, type: 'string', relationField: 'assetId', relationTable: 'asset' },
      { key: 'assignedTo', label: 'Assigned To', required: false, type: 'string', relationField: 'assignedToId', relationTable: 'user' }
    ]
  },
  users: {
    tableName: 'user',
    fields: [
      { key: 'name', label: 'Full Name', required: true, type: 'string' },
      { key: 'email', label: 'Email', required: true, type: 'string' },
      { key: 'role', label: 'Role', required: false, type: 'enum', enumValues: ['ADMIN', 'MANAGER', 'TECHNICIAN'] }
    ]
  },
  locations: {
    tableName: 'location',
    fields: [
      { key: 'name', label: 'Name', required: true, type: 'string' },
      { key: 'description', label: 'Description', required: false, type: 'string' },
      { key: 'address', label: 'Address', required: false, type: 'string' },
      { key: 'parent', label: 'Parent', required: false, type: 'string', relationField: 'parentId', relationTable: 'location' },
      { key: 'legacyId', label: 'ID', required: false, type: 'number' },
      { key: 'parentId', label: 'Parent ID', required: false, type: 'number', relationField: 'parentId', relationTable: 'location' },
      { key: 'barcode', label: 'QR/Bar code', required: false, type: 'string' },
      { key: 'url', label: 'URL', required: false, type: 'string' }
    ]
  },
  parts: {
    tableName: 'part',
    fields: [
      { key: 'name', label: 'Name', required: true, type: 'string' },
      { key: 'description', label: 'Description', required: false, type: 'string' },
      { key: 'sku', label: 'Part Numbers', required: false, type: 'string' },
      { key: 'stockLevel', label: 'Quantity in Stock', required: false, type: 'number' },
      { key: 'reorderPoint', label: 'Minimum Quantity', required: false, type: 'number' },
      { key: 'legacyId', label: 'ID', required: false, type: 'number' },
      { key: 'location', label: 'Location', required: false, type: 'string' },
      { key: 'barcode', label: 'QR/Bar code', required: false, type: 'string' },
      { key: 'unitCost', label: 'Unit Cost', required: false, type: 'number' },
      { key: 'totalCost', label: 'Total Cost', required: false, type: 'number' }
    ]
  },
  suppliers: {
    tableName: 'supplier',
    fields: [
      { key: 'name', label: 'Vendor', required: true, type: 'string' },
      { key: 'contactInfo', label: 'Contact Name', required: false, type: 'string' },
      { key: 'address', label: 'Description', required: false, type: 'string' },
      { key: 'legacyId', label: 'ID', required: false, type: 'number' },
      { key: 'phone', label: 'Phone Number', required: false, type: 'string' },
      { key: 'email', label: 'Email', required: false, type: 'string' }
    ]
  }
};

export class ImportService {
  // Generate intelligent column mappings using fuzzy search
  static generateColumnMappings(csvHeaders: string[], entityType: string): ColumnMapping[] {
    const config = entityConfigs[entityType];
    if (!config) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    const fuse = new Fuse(config.fields, {
      keys: ['key', 'label'],
      threshold: 0.3, // Stricter threshold for better matches
      includeScore: true
    });

    return csvHeaders.map(csvColumn => {
      const searchResults = fuse.search(csvColumn);
      if (searchResults.length > 0) {
        const bestMatch = searchResults[0];
        const confidence = Math.round((1 - (bestMatch.score || 0)) * 100);
        
        // Only auto-assign if confidence is 85% or higher (near-perfect match)
        // This requires very close matches like "name" -> "name" or "email" -> "email"
        const shouldAutoAssign = confidence >= 85;
        
        return {
          csvColumn,
          targetField: shouldAutoAssign ? bestMatch.item.key : '',
          confidence,
          required: bestMatch.item.required
        };
      }
      return {
        csvColumn,
        targetField: '',
        confidence: 0,
        required: false
      };
    });
  }

  // Validate CSV data against schema
  static async validateData(
    csvData: Record<string, any>[],
    mappings: ColumnMapping[],
    entityType: string,
    organizationId: number
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const config = entityConfigs[entityType];
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config) {
      errors.push(`Unknown entity type: ${entityType}`);
      return { valid: false, errors, warnings };
    }

    // VALIDATION FIX: Check for conflicting relationship field mappings
    const relationFields = config.fields.filter(field => field.relationField);
    relationFields.forEach(relationField => {
      const relationMapping = mappings.find(m => m.targetField === relationField.key);
      const targetMapping = mappings.find(m => m.targetField === relationField.relationField);
      
      if (relationMapping && targetMapping) {
        warnings.push(
          `Conflicting mappings detected: Both '${relationField.key}' (lookup field) and '${relationField.relationField}' (target field) are mapped. ` +
          `The lookup field '${relationField.key}' will be used for relationship resolution, and '${relationField.relationField}' will be ignored.`
        );
      }
    });

    // Check required fields
    const requiredFields = config.fields.filter(field => field.required);
    const mappedRequiredFields = requiredFields.filter(field =>
      mappings.some(mapping => mapping.targetField === field.key)
    );

    if (mappedRequiredFields.length < requiredFields.length) {
      const missing = requiredFields.filter(field =>
        !mappings.some(mapping => mapping.targetField === field.key)
      );
      errors.push(`Missing required fields: ${missing.map(f => f.label).join(', ')}`);
    }

    // Validate data types and enum values
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      
      for (const mapping of mappings) {
        if (!mapping.targetField) continue;
        
        const field = config.fields.find(f => f.key === mapping.targetField);
        if (!field) continue;

        const value = row[mapping.csvColumn];
        
        // Skip validation for empty optional fields
        if (!value && !field.required) continue;
        
        // Required field validation
        if (field.required && !value) {
          errors.push(`Row ${i + 1}: ${field.label} is required but empty`);
          continue;
        }

        // Type validation
        if (value) {
          switch (field.type) {
            case 'number':
              if (isNaN(Number(value))) {
                errors.push(`Row ${i + 1}: ${field.label} must be a number, got "${value}"`);
              }
              break;
            case 'enum':
              if (field.enumValues && !field.enumValues.includes(value.toUpperCase())) {
                warnings.push(`Row ${i + 1}: ${field.label} value "${value}" will be normalized. Valid values: ${field.enumValues.join(', ')}`);
              }
              break;
            case 'date':
              if (isNaN(Date.parse(value))) {
                errors.push(`Row ${i + 1}: ${field.label} must be a valid date, got "${value}"`);
              }
              break;
          }
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // Check for duplicates in the data and database
  static async checkDuplicates(
    csvData: Record<string, any>[],
    mappings: ColumnMapping[],
    entityType: string,
    organizationId: number
  ): Promise<{ duplicates: string[]; conflicts: string[] }> {
    const config = entityConfigs[entityType];
    const duplicates: string[] = [];
    const conflicts: string[] = [];

    if (!config) return { duplicates, conflicts };

    // Check for duplicates within CSV data
    const uniqueFields = ['name', 'email', 'sku']; // Common unique fields
    const seenValues = new Map<string, number>();

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      
      for (const mapping of mappings) {
        if (!mapping.targetField || !uniqueFields.includes(mapping.targetField)) continue;
        
        const value = row[mapping.csvColumn];
        if (!value) continue;

        const key = `${mapping.targetField}:${value.toLowerCase()}`;
        if (seenValues.has(key)) {
          duplicates.push(`Duplicate ${mapping.targetField}: "${value}" found in rows ${seenValues.get(key)! + 1} and ${i + 1}`);
        } else {
          seenValues.set(key, i);
        }
      }
    }

    // Check for conflicts with existing database records
    try {
      const nameMapping = mappings.find(m => m.targetField === 'name');
      const emailMapping = mappings.find(m => m.targetField === 'email');
      const skuMapping = mappings.find(m => m.targetField === 'sku');

      if (nameMapping) {
        const names = csvData.map(row => row[nameMapping.csvColumn]).filter(Boolean);
        if (names.length > 0) {
          const existing = await (prisma as any)[config.tableName].findMany({
            where: {
              organizationId,
              name: { in: names }
            },
            select: { name: true }
          });
          
          existing.forEach((record: any) => {
            conflicts.push(`${config.tableName} with name "${record.name}" already exists`);
          });
        }
      }

      if (emailMapping && entityType === 'users') {
        const emails = csvData.map(row => row[emailMapping.csvColumn]).filter(Boolean);
        if (emails.length > 0) {
          const existing = await prisma.user.findMany({
            where: {
              organizationId,
              email: { in: emails }
            },
            select: { email: true }
          });
          
          existing.forEach(record => {
            conflicts.push(`User with email "${record.email}" already exists`);
          });
        }
      }

      if (skuMapping && entityType === 'parts') {
        const skus = csvData.map(row => row[skuMapping.csvColumn]).filter(Boolean);
        if (skus.length > 0) {
          const existing = await prisma.part.findMany({
            where: {
              organizationId,
              sku: { in: skus }
            },
            select: { sku: true }
          });
          
          existing.forEach(record => {
            conflicts.push(`Part with SKU "${record.sku}" already exists`);
          });
        }
      }
    } catch (error) {
      console.error('Error checking database conflicts:', error);
    }

    return { duplicates, conflicts };
  }

  // Transform and normalize data
  static transformData(
    csvData: Record<string, any>[],
    mappings: ColumnMapping[],
    entityType: string
  ): Record<string, any>[] {
    const config = entityConfigs[entityType];
    if (!config) return [];

    // DEFENSIVE PROGRAMMING: Get relationship fields to prevent conflicts during transformation
    const relationFields = config.fields.filter(field => field.relationField);
    const relationFieldTargets = new Set(relationFields.map(field => field.relationField));

    return csvData.map(row => {
      const transformed: Record<string, any> = {};
      
      mappings.forEach(mapping => {
        if (!mapping.targetField) return;
        
        const field = config.fields.find(f => f.key === mapping.targetField);
        if (!field) return;

        let value = row[mapping.csvColumn];
        if (value === undefined || value === null || value === '') return;

        // DEFENSIVE CHECK: Skip processing target fields of relationships if the lookup field is also mapped
        // This prevents conflicts where both 'parent' and 'parentId' are mapped
        if (relationFieldTargets.has(mapping.targetField)) {
          const hasRelationshipMapping = mappings.some(m => {
            const relField = config.fields.find(f => f.key === m.targetField);
            return relField?.relationField === mapping.targetField;
          });
          
          if (hasRelationshipMapping) {
            // Skip this field - the relationship resolution will handle it
            return;
          }
        }

        // Transform based on field type
        switch (field.type) {
          case 'number':
            value = Number(value);
            break;
          case 'boolean':
            value = ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
            break;
          case 'enum':
            if (field.enumValues) {
              // Try to match enum values (case insensitive)
              const matchedEnum = field.enumValues.find(
                enumVal => enumVal.toLowerCase() === String(value).toLowerCase()
              );
              value = matchedEnum || field.enumValues[0]; // Default to first enum value if no match
            }
            break;
          case 'date':
            value = new Date(value);
            break;
          default:
            value = String(value).trim();
        }

        transformed[mapping.targetField] = value;
      });

      return transformed;
    });
  }

  // Resolve foreign key relationships
  static async resolveRelationships(
    transformedData: Record<string, any>[],
    entityType: string,
    organizationId: number
  ): Promise<Record<string, any>[]> {
    const config = entityConfigs[entityType];
    if (!config) return transformedData;

    // Build lookup maps for related entities
    const relationMaps = new Map<string, Map<string, number>>();

    // Get all relation fields
    const relationFields = config.fields.filter(field => field.relationTable);

    for (const field of relationFields) {
      if (!field.relationTable) continue;

      const lookupMap = new Map<string, number>();
      
      try {
        // Dynamic field selection based on table type
        const selectFields: any = { id: true, legacyId: true };
        
        if (field.relationTable === 'location') {
          selectFields.name = true;
        } else if (field.relationTable === 'user') {
          selectFields.name = true;
          selectFields.email = true;
        } else if (field.relationTable === 'asset') {
          selectFields.name = true;
        } else {
          // Default for other tables
          selectFields.name = true;
        }

        const records = await (prisma as any)[field.relationTable].findMany({
          where: { organizationId },
          select: selectFields
        });

        records.forEach((record: any) => {
          if (record.name) lookupMap.set(record.name.toLowerCase(), record.id);
          if (record.email) lookupMap.set(record.email.toLowerCase(), record.id);
          if (record.legacyId) lookupMap.set(record.legacyId.toString(), record.id);
        });

        relationMaps.set(field.relationTable, lookupMap);
      } catch (error) {
        console.error(`Error loading ${field.relationTable} relationships:`, error);
      }
    }

    // Resolve relationships in data
    return transformedData.map(row => {
      const resolved = { ...row };

      relationFields.forEach(field => {
        if (!field.relationField || !field.relationTable) return;

        const value = row[field.key];
        
        if (!value) {
          // Only delete the field if it actually exists in the original row
          if (row.hasOwnProperty(field.key)) {
            delete resolved[field.key];
          }
          return;
        }

        const lookupMap = relationMaps.get(field.relationTable);
        if (!lookupMap) {
          delete resolved[field.key];
          return;
        }

        // Try to find relationship by name (string, lowercase) or legacyId (number)
        let relationId = lookupMap.get(String(value).toLowerCase());
        if (!relationId && typeof value === 'number') {
          relationId = lookupMap.get(value.toString());
        }
        
        if (relationId) {
          resolved[field.relationField] = relationId;
        }
        
        // Always remove the lookup field
        delete resolved[field.key];
      });

      // Add organization ID
      resolved.organizationId = organizationId;
      
      return resolved;
    });
  }

  // Execute the import
  static async executeImport(request: ImportRequest, userId: number, organizationId: number): Promise<ImportResult> {
    console.log('ImportService.executeImport called with:', {
      entityType: request.entityType,
      mappingsCount: request.mappings?.length,
      csvDataCount: request.csvData?.length,
      userId,
      organizationId
    });

    const { entityType, mappings, csvData } = request;
    const config = entityConfigs[entityType];
    
    if (!config) {
      console.error('Unknown entity type:', entityType);
      return {
        success: false,
        importedCount: 0,
        skippedCount: 0,
        errors: ['Unknown entity type'],
        duplicates: [],
        importId: ''
      };
    }

    const errors: string[] = [];
    const duplicates: string[] = [];
    let importedCount = 0;
    let skippedCount = 0;
    const startTime = Date.now();

    // Generate unique import ID
    const importId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const importedRecordIds: number[] = [];

    // Verify user and organization exist before creating import history
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true }
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    if (user.organizationId !== organizationId) {
      throw new Error(`User does not belong to organization ${organizationId}`);
    }

    // Create import history record
    const importHistory = await prisma.importHistory.create({
      data: {
        importId,
        entityType,
        fileName: `${entityType}_import.csv`,
        totalRows: csvData.length,
        importedCount: 0,
        skippedCount: 0,
        status: 'IN_PROGRESS',
        columnMappings: mappings as any,
        userId,
        organizationId,
        startedAt: new Date(),
      }
    });

    try {
      console.log('Starting data transformation...');
      // Transform data
      const transformedData = this.transformData(csvData, mappings, entityType);
      console.log('Transformed data sample:', transformedData.slice(0, 2));
      
      console.log('Starting relationship resolution...');
      // Resolve relationships
      const resolvedData = await this.resolveRelationships(transformedData, entityType, organizationId);
      console.log('Resolved data sample:', resolvedData.slice(0, 2));

      console.log('Starting transaction with', resolvedData.length, 'records...');
      // Import data within a transaction
      await prisma.$transaction(async (tx) => {
        for (let i = 0; i < resolvedData.length; i++) {
          const row = resolvedData[i];
          console.log(`Processing row ${i + 1}:`, row);
          
          // CRITICAL: Ensure organizationId is ALWAYS included for organization isolation
          row.organizationId = organizationId;
          
          try {
            // Special handling for different entity types
            switch (entityType) {
              case 'users':
                // Hash password for users
                if (!row.password) {
                  row.password = await bcrypt.hash('defaultpassword', 10);
                }
                break;
            }

            console.log(`Creating ${config.tableName} record with data:`, row);
            // Create record
            const createdRecord = await (tx as any)[config.tableName].create({
              data: row
            });
            console.log(`Successfully created record with ID:`, createdRecord.id);
            
            importedRecordIds.push(createdRecord.id);
            importedCount++;
          } catch (error: any) {
            console.error(`Error importing row ${i + 1}:`, error);
            console.error('Error code:', error.code);
            console.error('Error meta:', error.meta);
            if (error.code === 'P2002') {
              duplicates.push(`Row ${i + 1}: Duplicate record (${error.meta?.target || 'unique constraint'})`);
            } else {
              errors.push(`Row ${i + 1}: ${error.message}`);
            }
            skippedCount++;
          }
        }
      });
      console.log('Transaction completed successfully');

      const endTime = Date.now();
      const durationMs = endTime - startTime;
      const status = errors.length === 0 ? 'COMPLETED' : (importedCount > 0 ? 'PARTIAL' : 'FAILED');

      // Update import history with results
      await prisma.importHistory.update({
        where: { id: importHistory.id },
        data: {
          importedCount,
          skippedCount,
          status,
          errors: errors.length > 0 ? errors as any : undefined,
          duplicates: duplicates.length > 0 ? duplicates as any : undefined,
          completedAt: new Date(),
          durationMs,
          canRollback: importedCount > 0 && status !== 'FAILED'
        }
      });

      console.log(`Import ${importId} completed: ${importedCount} imported, ${skippedCount} skipped`);

      return {
        success: errors.length === 0,
        importedCount,
        skippedCount,
        errors,
        duplicates,
        importId
      };

    } catch (error: any) {
      console.error('Import execution error:', error);
      
      // Update import history with failure
      await prisma.importHistory.update({
        where: { id: importHistory.id },
        data: {
          status: 'FAILED',
          errors: [error.message] as any,
          completedAt: new Date(),
          durationMs: Date.now() - startTime,
          canRollback: false
        }
      });

      return {
        success: false,
        importedCount,
        skippedCount,
        errors: [error.message],
        duplicates,
        importId
      };
    }
  }

  // Get import history for an organization
  static async getImportHistory(organizationId: number, limit: number = 50, offset: number = 0) {
    return await prisma.importHistory.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        rolledBackBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  }

  // Rollback an import
  static async rollbackImport(importId: string, userId: number, organizationId: number) {
    // Find the import history record
    const importHistory = await prisma.importHistory.findFirst({
      where: {
        importId,
        organizationId,
        canRollback: true,
        rolledBack: false
      }
    });

    if (!importHistory) {
      throw new Error('Import not found or cannot be rolled back');
    }

    const config = entityConfigs[importHistory.entityType];
    if (!config) {
      throw new Error('Unknown entity type for rollback');
    }

    try {
      let deletedCount = 0;

      // Find and delete records created by this import
      // Note: This assumes we added importId tracking to records
      const recordsToDelete = await (prisma as any)[config.tableName].findMany({
        where: {
          organizationId,
          // We would need to add importId field to all tables for this to work
          // For now, we'll use creation time window as a fallback
          createdAt: {
            gte: importHistory.startedAt,
            lte: importHistory.completedAt || new Date()
          }
        }
      });

      // Delete records in a transaction
      await prisma.$transaction(async (tx) => {
        for (const record of recordsToDelete) {
          await (tx as any)[config.tableName].delete({
            where: { id: record.id }
          });
          deletedCount++;
        }
      });

      // Mark import as rolled back
      await prisma.importHistory.update({
        where: { id: importHistory.id },
        data: {
          rolledBack: true,
          rolledBackAt: new Date(),
          rolledBackById: userId
        }
      });

      return {
        success: true,
        deletedCount,
        message: `Successfully rolled back import ${importId}. Deleted ${deletedCount} records.`
      };

    } catch (error: any) {
      console.error('Rollback error:', error);
      throw new Error(`Failed to rollback import: ${error.message}`);
    }
  }

  // Get entity configurations for frontend
  static getEntityConfigs() {
    return Object.entries(entityConfigs).map(([key, config]) => ({
      value: key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      fields: config.fields.map(field => ({
        key: field.key,
        label: field.label,
        required: field.required,
        type: field.type,
        enumValues: field.enumValues
      }))
    }));
  }
}