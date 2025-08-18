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
  pmConversionSummary?: string;
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
      { key: 'workType', label: 'Work Type', required: false, type: 'string' },
      { key: 'recurrence', label: 'Recurrence', required: false, type: 'string' },
      { key: 'assetName', label: 'Asset', required: false, type: 'string', relationField: 'assetId', relationTable: 'asset' },
      { key: 'assignedTo', label: 'Assigned to', required: false, type: 'string', relationField: 'assignedToId', relationTable: 'user' },
      { key: 'estimatedHours', label: 'Estimated Hours', required: false, type: 'number' }
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
  },
  pmtasks: {
    tableName: 'pMTask',
    fields: [
      { key: 'title', label: 'Title', required: true, type: 'string' },
      { key: 'description', label: 'Description', required: false, type: 'string' },
      { key: 'type', label: 'Type', required: false, type: 'enum', enumValues: ['INSPECTION', 'CLEANING', 'LUBRICATION', 'REPLACEMENT', 'CALIBRATION', 'TESTING', 'REPAIR', 'OTHER'] },
      { key: 'procedure', label: 'Procedure', required: false, type: 'string' },
      { key: 'safetyRequirements', label: 'Safety Requirements', required: false, type: 'string' },
      { key: 'toolsRequired', label: 'Tools Required', required: false, type: 'string' },
      { key: 'partsRequired', label: 'Parts Required', required: false, type: 'string' },
      { key: 'estimatedMinutes', label: 'Estimated Minutes', required: false, type: 'number' }
    ]
  },
  pmschedules: {
    tableName: 'pMSchedule',
    fields: [
      { key: 'title', label: 'Title', required: true, type: 'string' },
      { key: 'description', label: 'Description', required: false, type: 'string' },
      { key: 'frequency', label: 'Frequency', required: true, type: 'string' },
      { key: 'nextDue', label: 'Next Due', required: false, type: 'date' },
      { key: 'assetName', label: 'Asset Name', required: false, type: 'string', relationField: 'assetId', relationTable: 'asset' },
      { key: 'locationName', label: 'Location Name', required: false, type: 'string', relationField: 'locationId', relationTable: 'location' }
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
        
        // Only auto-assign if confidence is 100% (perfect match)
        // This requires exact matches like "name" -> "name" or "email" -> "email"
        const shouldAutoAssign = confidence >= 100;
        
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

        const value = mapping.csvColumn ? row[mapping.csvColumn] : undefined;
        
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
              if (field.enumValues) {
                // Special validation for work order status field
                if (mapping.targetField === 'status' && entityType === 'workorders') {
                  const statusValue = String(value).replace(/ /g, '_').toUpperCase();
                  const isValidStatus = field.enumValues.includes(statusValue) || 
                                      ['DONE', 'COMPLETE', 'APPROVED', 'PENDING', 'REJECTED'].includes(statusValue);
                  if (!isValidStatus) {
                    warnings.push(`Row ${i + 1}: ${field.label} value "${value}" will be normalized. Valid values: ${field.enumValues.join(', ')}, DONE, COMPLETE`);
                  }
                } else {
                  // Standard enum validation for other fields
                  if (!field.enumValues.includes(value.toUpperCase())) {
                    warnings.push(`Row ${i + 1}: ${field.label} value "${value}" will be normalized. Valid values: ${field.enumValues.join(', ')}`);
                  }
                }
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
        
        const value = mapping.csvColumn ? row[mapping.csvColumn] : undefined;
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
        const names = nameMapping?.csvColumn ? csvData.map(row => row[nameMapping.csvColumn]).filter(Boolean) : [];
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
        const emails = emailMapping?.csvColumn ? csvData.map(row => row[emailMapping.csvColumn]).filter(Boolean) : [];
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
        const skus = skuMapping?.csvColumn ? csvData.map(row => row[skuMapping.csvColumn]).filter(Boolean) : [];
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

    // Get metadata fields that should be filtered out during transformation
    const metadataFields = new Set(['workType', 'recurrence']);

    return csvData.map(row => {
      const transformed: Record<string, any> = {};
      
      mappings.forEach(mapping => {
        if (!mapping || !mapping.targetField || !mapping.csvColumn) return;
        
        const field = config.fields.find(f => f.key === mapping.targetField);
        if (!field) return;

        // Keep workType for linking PM work orders to schedules, but skip recurrence
        if (mapping.targetField === 'recurrence') {
          return; // Skip recurrence as it's not stored in work orders
        }

        // Use bracket notation with trimmed field name to avoid any string issues
        let fieldName: string;
        try {
          fieldName = mapping.csvColumn.trim();
        } catch (error) {
          console.error('Error trimming csvColumn:', mapping.csvColumn, error);
          return;
        }
        
        if (!fieldName) return;
        let value = row[fieldName];
        
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

        // Special handling for estimatedHours field to convert time strings to hours
        if (mapping.targetField === 'estimatedHours' && typeof value === 'string') {
          // Convert time string like "2:30:00" or "1.5" to hours as float
          if (value.includes(':')) {
            const parts = value.split(':');
            const hours = parseInt(parts[0]) || 0;
            const minutes = parseInt(parts[1]) || 0;
            const seconds = parseInt(parts[2]) || 0;
            value = hours + (minutes / 60) + (seconds / 3600);
          } else {
            value = parseFloat(value) || null;
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
              // Special handling for WorkOrder status field - include DONE/Complete for compliance
              if (mapping.targetField === 'status' && entityType === 'workorders') {
                const originalValue = String(value);
                const statusValue = originalValue.trim().replace(/ /g, '_').toUpperCase();
                
                console.log(`[STATUS TRANSFORM] Original: "${originalValue}" → Normalized: "${statusValue}"`);
                
                // Map known status values
                if (statusValue === 'DONE' || statusValue === 'COMPLETE') {
                  value = 'COMPLETED';
                  console.log(`[STATUS TRANSFORM] ✅ Mapped DONE/COMPLETE to: ${value}`);
                } else if (statusValue === 'APPROVED' || statusValue === 'PENDING') {
                  value = 'OPEN';
                  console.log(`[STATUS TRANSFORM] Mapped APPROVED/PENDING to: ${value}`);
                } else if (statusValue === 'REJECTED') {
                  value = 'CANCELED';
                  console.log(`[STATUS TRANSFORM] Mapped REJECTED to: ${value}`);
                } else if (field.enumValues.includes(statusValue)) {
                  // If it's already a valid enum value, use it
                  value = statusValue;
                  console.log(`[STATUS TRANSFORM] Already valid enum: ${value}`);
                } else {
                  // Try case-insensitive match as last resort
                  const matchedEnum = field.enumValues.find(
                    enumVal => enumVal.toLowerCase() === statusValue.toLowerCase()
                  );
                  value = matchedEnum || 'OPEN'; // Default to OPEN for work orders
                  console.log(`[STATUS TRANSFORM] ⚠️ Defaulted to: ${value} (unrecognized: "${statusValue}")`);
                }
              } else {
                // Standard enum handling for other fields
                const matchedEnum = field.enumValues.find(
                  enumVal => enumVal.toLowerCase() === String(value).toLowerCase()
                );
                value = matchedEnum || field.enumValues[0]; // Default to first enum value if no match
              }
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

  // Smart PM Task Detection - converts preventative/routine work orders to PM tasks and schedules
  static detectAndConvertPMTasks(
    csvData: Record<string, any>[],
    mappings: ColumnMapping[],
    entityType: string
  ): { pmTasks: Record<string, any>[]; pmSchedules: Record<string, any>[]; remainingWorkOrders: Record<string, any>[] } {
    if (entityType !== 'workorders') {
      return { pmTasks: [], pmSchedules: [], remainingWorkOrders: csvData };
    }

    const pmTasks: Record<string, any>[] = [];
    const pmSchedules: Record<string, any>[] = [];
    const remainingWorkOrders: Record<string, any>[] = [];

    // Get field mappings for analysis
    const titleMapping = mappings.find(m => m.targetField === 'title');
    const descriptionMapping = mappings.find(m => m.targetField === 'description');
    const assetMapping = mappings.find(m => m.targetField === 'assetName');
    const locationMapping = mappings.find(m => m.targetField === 'locationName');
    const statusMapping = mappings.find(m => m.targetField === 'status');
    
    // Look for Work Type and Recurrence fields specifically
    const workTypeMapping = mappings.find(m => m.targetField === 'workType');
    const recurrenceMapping = mappings.find(m => m.targetField === 'recurrence');

    csvData.forEach((row, index) => {
      const title = titleMapping?.csvColumn ? row[titleMapping.csvColumn] : '';
      const description = descriptionMapping?.csvColumn ? row[descriptionMapping.csvColumn] : '';
      const assetName = assetMapping?.csvColumn ? row[assetMapping.csvColumn] : '';
      const locationName = locationMapping?.csvColumn ? row[locationMapping.csvColumn] : '';
      const workType = workTypeMapping?.csvColumn ? row[workTypeMapping.csvColumn] : '';
      const recurrence = recurrenceMapping?.csvColumn ? row[recurrenceMapping.csvColumn] : '';
      const status = statusMapping?.csvColumn ? row[statusMapping.csvColumn] : '';

      // Check if this is a PREVENTIVE work order
      const isPreventive = workType && workType.toUpperCase() === 'PREVENTIVE';

      if (isPreventive) {
        // IMPORTANT: Always keep the work order for compliance tracking
        // If it's DONE/COMPLETED, it will be imported as a completed work order
        remainingWorkOrders.push(row);
        
        // Also create PM Task for future reference
        const pmTask = {
          title: title || `PM Task ${index + 1}`,
          description: description || '',
          type: this.mapToTaskType(title, description, workType),
          procedure: description || '',
          estimatedMinutes: this.estimateTaskDuration(title, description, workType),
          organizationId: 0 // Will be set during import
        };
        pmTasks.push(pmTask);

        // Create PM Schedule if we have recurrence and a valid asset
        // PM Schedules require an asset to be linked to
        if (recurrence && assetName && assetName.trim() !== '') {
          const pmSchedule = {
            title: title,
            description: description || `Preventive maintenance: ${title}`,
            frequency: this.normalizeRecurrence(recurrence),
            assetName: assetName.trim(),
            locationName: locationName || undefined,
            nextDue: this.calculateNextDueFromRecurrence(recurrence),
            organizationId: 0, // Will be set during import
            // Store original status to track if this PM was completed
            originalStatus: status
          };
          pmSchedules.push(pmSchedule);
        } else if (recurrence && !assetName) {
          // Log that we're skipping PM schedule creation due to missing asset
          console.log(`Skipping PM schedule for "${title}" - no asset specified`);
        }
      } else {
        // Keep as regular work order (REACTIVE, etc.)
        remainingWorkOrders.push(row);
      }
    });

    return { pmTasks, pmSchedules, remainingWorkOrders };
  }

  // Check if a work order should be converted to a PM task
  private static isPMTaskCandidate(title: string, description: string, type: string, frequency: string): boolean {
    const text = `${title} ${description} ${type} ${frequency}`.toLowerCase();
    
    // Look for preventative/routine indicators
    const pmIndicators = [
      'preventive', 'preventative', 'routine', 'scheduled', 'maintenance',
      'inspection', 'check', 'service', 'cleaning', 'lubrication',
      'calibration', 'test', 'replace', 'change', 'filter'
    ];

    // Look for frequency indicators
    const frequencyIndicators = [
      'daily', 'weekly', 'monthly', 'quarterly', 'annually', 'yearly',
      'days', 'weeks', 'months', 'hours', 'recurring', 'recurrence',
      'every', 'schedule', 'regular', 'periodic'
    ];

    const hasPMIndicator = pmIndicators.some(indicator => text.includes(indicator));
    const hasFrequencyIndicator = frequencyIndicators.some(indicator => text.includes(indicator));

    return hasPMIndicator || hasFrequencyIndicator;
  }

  // Map text to TaskType enum
  private static mapToTaskType(title: string, description: string, type: string): string {
    const text = `${title} ${description} ${type}`.toLowerCase();
    
    if (text.includes('inspect') || text.includes('check')) return 'INSPECTION';
    if (text.includes('clean')) return 'CLEANING';
    if (text.includes('lubricate') || text.includes('oil') || text.includes('grease')) return 'LUBRICATION';
    if (text.includes('replace') || text.includes('change')) return 'REPLACEMENT';
    if (text.includes('calibrat')) return 'CALIBRATION';
    if (text.includes('test')) return 'TESTING';
    if (text.includes('repair') || text.includes('fix')) return 'REPAIR';
    
    return 'OTHER';
  }

  // Estimate task duration based on type and description
  private static estimateTaskDuration(title: string, description: string, type: string): number {
    const text = `${title} ${description} ${type}`.toLowerCase();
    
    // Basic estimation based on task type
    if (text.includes('inspect') || text.includes('check')) return 30;
    if (text.includes('clean')) return 60;
    if (text.includes('lubricate')) return 45;
    if (text.includes('replace') || text.includes('change')) return 120;
    if (text.includes('calibrat')) return 90;
    if (text.includes('test')) return 60;
    if (text.includes('repair')) return 180;
    
    return 60; // Default 1 hour
  }

  // Normalize recurrence format from MaintainX CSV (e.g., "Weekly|6|Monday", "Monthly|3|1", "Yearly|1")
  private static normalizeRecurrence(recurrence: string): string {
    if (!recurrence) return 'monthly';
    
    const parts = recurrence.split('|');
    const type = parts[0]?.toLowerCase().trim();
    const interval = parts[1] ? parseInt(parts[1]) : 1;
    const day = parts[2];
    
    switch (type) {
      case 'daily':
        return interval === 1 ? 'daily' : `${interval} days`;
      case 'weekly':
        return interval === 1 ? 'weekly' : `${interval} weeks`;
      case 'monthly':
        return interval === 1 ? 'monthly' : `${interval} months`;
      case 'yearly':
        return interval === 1 ? 'annually' : `${interval} years`;
      default:
        return recurrence; // Return original if format is unknown
    }
  }

  // Normalize frequency text to standard format (legacy method for backwards compatibility)
  private static normalizeFrequency(frequency: string): string {
    const freq = frequency.toLowerCase().trim();
    
    if (freq.includes('daily') || freq.includes('day')) return 'daily';
    if (freq.includes('weekly') || freq.includes('week')) return 'weekly';
    if (freq.includes('monthly') || freq.includes('month')) return 'monthly';
    if (freq.includes('quarterly') || freq.includes('quarter')) return 'quarterly';
    if (freq.includes('annually') || freq.includes('yearly') || freq.includes('year')) return 'annually';
    
    // Try to extract number patterns like "30 days", "2 weeks"
    const numberMatch = freq.match(/(\d+)\s*(day|week|month|hour)/);
    if (numberMatch) {
      const num = parseInt(numberMatch[1]);
      const unit = numberMatch[2];
      
      if (unit === 'day') return `${num} days`;
      if (unit === 'week') return `${num} weeks`;
      if (unit === 'month') return `${num} months`;
      if (unit === 'hour') return `${num} hours`;
    }
    
    return frequency; // Return original if no pattern matches
  }

  // Calculate next due date from MaintainX recurrence format
  private static calculateNextDueFromRecurrence(recurrence: string): Date {
    const now = new Date();
    
    if (!recurrence) {
      // Default to 30 days from now
      now.setDate(now.getDate() + 30);
      return now;
    }
    
    const parts = recurrence.split('|');
    const type = parts[0]?.toLowerCase().trim();
    const interval = parts[1] ? parseInt(parts[1]) : 1;
    
    switch (type) {
      case 'daily':
        now.setDate(now.getDate() + interval);
        break;
      case 'weekly':
        now.setDate(now.getDate() + (interval * 7));
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + interval);
        break;
      case 'yearly':
        now.setFullYear(now.getFullYear() + interval);
        break;
      default:
        // Default to 30 days
        now.setDate(now.getDate() + 30);
    }
    
    return now;
  }

  // Calculate next due date based on frequency (legacy method)
  private static calculateNextDue(frequency: string): Date {
    const now = new Date();
    const freq = frequency.toLowerCase();
    
    if (freq.includes('daily')) {
      now.setDate(now.getDate() + 1);
    } else if (freq.includes('weekly')) {
      now.setDate(now.getDate() + 7);
    } else if (freq.includes('monthly')) {
      now.setMonth(now.getMonth() + 1);
    } else if (freq.includes('quarterly')) {
      now.setMonth(now.getMonth() + 3);
    } else if (freq.includes('annually') || freq.includes('yearly')) {
      now.setFullYear(now.getFullYear() + 1);
    } else {
      // Try to extract number patterns
      const numberMatch = freq.match(/(\d+)\s*(day|week|month)/);
      if (numberMatch) {
        const num = parseInt(numberMatch[1]);
        const unit = numberMatch[2];
        
        if (unit === 'day') now.setDate(now.getDate() + num);
        if (unit === 'week') now.setDate(now.getDate() + (num * 7));
        if (unit === 'month') now.setMonth(now.getMonth() + num);
      } else {
        // Default to 30 days
        now.setDate(now.getDate() + 30);
      }
    }
    
    return now;
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
      console.log('Starting smart PM task detection...');
      // Smart PM detection for work orders
      const pmConversion = this.detectAndConvertPMTasks(csvData, mappings, entityType);
      console.log('PM Detection results:', {
        pmTasks: pmConversion.pmTasks.length,
        pmSchedules: pmConversion.pmSchedules.length,
        remainingWorkOrders: pmConversion.remainingWorkOrders.length
      });

      // Use remaining work orders for regular import if doing work orders
      const dataToImport = entityType === 'workorders' ? pmConversion.remainingWorkOrders : csvData;

      console.log('Starting data transformation...');
      console.log('Raw data to transform:', JSON.stringify(dataToImport.slice(0, 2), null, 2));
      console.log('Mappings:', JSON.stringify(mappings, null, 2));
      // Transform data
      const transformedData = this.transformData(dataToImport, mappings, entityType);
      console.log('Transformed data sample:', transformedData.slice(0, 2));
      
      console.log('Starting relationship resolution...');
      // Resolve relationships
      const resolvedData = await this.resolveRelationships(transformedData, entityType, organizationId);
      console.log('Resolved data sample:', resolvedData.slice(0, 2));

      console.log('Starting batch import with', resolvedData.length, 'records...');
      
      // Process data in smaller batches to avoid transaction timeouts
      const BATCH_SIZE = 50; // Process 50 records at a time
      const batches = [];
      for (let i = 0; i < resolvedData.length; i += BATCH_SIZE) {
        batches.push(resolvedData.slice(i, i + BATCH_SIZE));
      }
      
      console.log(`Processing ${batches.length} batches of up to ${BATCH_SIZE} records each`);

      // Process PM tasks and schedules first (smaller transaction)
      if (pmConversion.pmTasks.length > 0 || pmConversion.pmSchedules.length > 0) {
        await prisma.$transaction(async (tx) => {
          // First import PM tasks if detected
          if (pmConversion.pmTasks.length > 0) {
            console.log(`Importing ${pmConversion.pmTasks.length} PM tasks...`);
            for (let i = 0; i < pmConversion.pmTasks.length; i++) {
              const pmTask = pmConversion.pmTasks[i];
              pmTask.organizationId = organizationId;
              
              try {
                const createdPMTask = await (tx as any).pMTask.create({
                  data: pmTask
                });
                console.log(`Successfully created PM task with ID:`, createdPMTask.id);
                importedRecordIds.push(createdPMTask.id);
                importedCount++;
              } catch (error: any) {
                console.error(`Error importing PM task ${i + 1}:`, error);
                if (error.code === 'P2002') {
                  duplicates.push(`PM Task ${i + 1}: Duplicate record`);
                } else {
                  errors.push(`PM Task ${i + 1}: ${error.message}`);
                }
                skippedCount++;
              }
            }
          }

          // Then import PM schedules if detected
          if (pmConversion.pmSchedules.length > 0) {
            console.log(`Importing ${pmConversion.pmSchedules.length} PM schedules...`);
            for (let i = 0; i < pmConversion.pmSchedules.length; i++) {
              const pmSchedule = pmConversion.pmSchedules[i];
              
              try {
                // Resolve asset relationship
                const resolvedPMSchedule = await this.resolveRelationships([pmSchedule], 'pmschedules', organizationId);
                if (resolvedPMSchedule.length > 0) {
                  // Remove organizationId and locationId as PMSchedule doesn't have these fields
                  const { organizationId: _, locationId: __, dueDate: ___, ...scheduleData } = resolvedPMSchedule[0];
                  
                  console.log('Resolved PM Schedule Data:', JSON.stringify(resolvedPMSchedule[0], null, 2));
                  console.log('Cleaned Schedule Data:', JSON.stringify(scheduleData, null, 2));
                  
                  // Check if required assetId was resolved
                  if (!scheduleData.assetId) {
                    console.log(`Skipping PM schedule ${i + 1}: Asset not found for "${pmSchedule.assetName}"`);
                    errors.push(`PM Schedule ${i + 1}: Asset "${pmSchedule.assetName}" not found - schedule skipped`);
                    skippedCount++;
                    continue;
                  }
                  
                  const createdPMSchedule = await (tx as any).pMSchedule.create({
                    data: scheduleData
                  });
                  console.log(`Successfully created PM schedule with ID:`, createdPMSchedule.id);
                  
                  // Only create a new OPEN work order if the original PM wasn't completed
                  // Completed PM work orders will be imported separately with COMPLETED status
                  const originalStatus = pmSchedule.originalStatus ? String(pmSchedule.originalStatus).toUpperCase() : '';
                  const isCompleted = originalStatus === 'DONE' || originalStatus === 'COMPLETE' || originalStatus === 'COMPLETED';
                  
                  if (!isCompleted) {
                    // Create a new OPEN work order for future PM
                    const pmWorkOrderData = {
                      title: pmSchedule.title || `PM: ${scheduleData.title || 'Maintenance Task'}`,
                      description: pmSchedule.description,
                      status: 'OPEN',
                      priority: pmSchedule.priority || 'MEDIUM',
                      assetId: scheduleData.assetId,
                      assignedToId: scheduleData.assignedToId,
                      pmScheduleId: createdPMSchedule.id,
                      organizationId: organizationId,
                      estimatedHours: pmSchedule.estimatedHours || null
                    };
                    
                    console.log('Creating new OPEN PM Work Order:', JSON.stringify(pmWorkOrderData, null, 2));
                    
                    const createdWorkOrder = await (tx as any).workOrder.create({
                      data: pmWorkOrderData
                    });
                    console.log(`Successfully created work order ${createdWorkOrder.id} for PM schedule ${createdPMSchedule.id}`);
                  } else {
                    console.log(`PM schedule ${createdPMSchedule.id} was originally completed - work order will be imported with COMPLETED status`);
                  }
                  
                  importedRecordIds.push(createdPMSchedule.id);
                  importedCount++;
                } else {
                  console.log(`Skipping PM schedule ${i + 1}: Could not resolve relationships`);
                  errors.push(`PM Schedule ${i + 1}: Could not resolve asset or location relationships`);
                  skippedCount++;
                }
              } catch (error: any) {
                console.error(`Error importing PM schedule ${i + 1}:`, error);
                if (error.code === 'P2002') {
                  duplicates.push(`PM Schedule ${i + 1}: Duplicate record`);
                } else {
                  errors.push(`PM Schedule ${i + 1}: ${error.message}`);
                }
                skippedCount++;
              }
            }
          }
        }, { timeout: 30000 }); // 30 second timeout for PM tasks
      }

      // Process regular data in batches
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} records...`);
        
        await prisma.$transaction(async (tx) => {
          for (let i = 0; i < batch.length; i++) {
            const row = batch[i];
            const globalIndex = (batchIndex * BATCH_SIZE) + i + 1; // Global row number for error reporting
            console.log(`Processing row ${globalIndex}:`, row);
            
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
                case 'workorders':
                  console.log(`[WO IMPORT] Processing work order: "${row.title}" with status: "${row.status}"`);
                  
                  // Set completion timestamp for COMPLETED work orders for compliance tracking
                  if (row.status === 'COMPLETED' && !row.completedAt) {
                    row.completedAt = row.updatedAt || row.createdAt || new Date();
                    console.log(`[WO IMPORT] ✅ Set completedAt timestamp for COMPLETED work order`);
                  }
                  
                  // Link PM work orders to their PM schedules if applicable
                  // This is for preventive work orders that have been imported
                  if (row.workType === 'PREVENTIVE' && row.assetId) {
                    // Try to find a matching PM schedule
                    const pmSchedule = await tx.pMSchedule.findFirst({
                      where: {
                        assetId: row.assetId,
                        title: row.title
                      }
                    });
                    
                    if (pmSchedule) {
                      row.pmScheduleId = pmSchedule.id;
                      console.log(`[WO IMPORT] Linked work order "${row.title}" to PM schedule ${pmSchedule.id}`);
                    }
                  }
                  
                  // Remove workType as it's not a field in the WorkOrder model
                  delete row.workType;
                  break;
                case 'assets':
                  // For assets, ensure location relationship is handled properly
                  if (!row.locationId) {
                    // Create or find a default location if no location is specified
                    let defaultLocation = await tx.location.findFirst({
                      where: {
                        organizationId: organizationId,
                        name: 'Default Location'
                      }
                    });
                    
                    if (!defaultLocation) {
                      defaultLocation = await tx.location.create({
                        data: {
                          name: 'Default Location',
                          description: 'Auto-created default location for assets without specified location',
                          organizationId: organizationId
                        }
                      });
                      console.log(`Created default location with ID: ${defaultLocation.id}`);
                    }
                    
                    row.locationId = defaultLocation.id;
                    console.log(`Assigned default location ${defaultLocation.id} to asset`);
                  }
                  break;
              }

              // Check for duplicates before creating
              const isDuplicate = await this.checkForDuplicate(tx, entityType, row, organizationId);
              if (isDuplicate) {
                console.log(`Skipping row ${globalIndex}: Duplicate record detected`);
                duplicates.push(`Row ${globalIndex}: Duplicate record - already exists in database`);
                skippedCount++;
                continue;
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
              console.error(`Error importing row ${globalIndex}:`, error);
              console.error('Error code:', error.code);
              console.error('Error meta:', error.meta);
              
              let userFriendlyMessage = '';
              
              if (error.code === 'P2002') {
                // Duplicate key error
                const field = error.meta?.target?.[0] || 'unique field';
                duplicates.push(`Row ${globalIndex}: Duplicate ${field} - this record already exists`);
              } else if (error.message.includes('Unknown argument')) {
                // Field doesn't exist in database
                const match = error.message.match(/Unknown argument `(\w+)`/);
                const fieldName = match ? match[1] : 'field';
                userFriendlyMessage = `Invalid field "${fieldName}" - this field is not supported in the database`;
              } else if (error.message.includes('Invalid enum value')) {
                // Invalid enum value
                userFriendlyMessage = error.message.replace(/Invalid.*?enum/, 'Invalid value for');
              } else if (error.message.includes('Foreign key constraint')) {
                // Missing related record
                userFriendlyMessage = 'Related record not found - please check asset, location, or user references';
              } else if (error.message.includes('required field')) {
                userFriendlyMessage = 'Required field is missing or empty';
              } else {
                // Generic error
                userFriendlyMessage = `Database error: ${error.message}`;
              }
              
              errors.push(`Row ${globalIndex}: ${userFriendlyMessage}`);
              skippedCount++;
            }
          }
        }, { timeout: 30000 }); // 30 second timeout per batch
        
        console.log(`Completed batch ${batchIndex + 1}/${batches.length}. Running total: ${importedCount} imported, ${skippedCount} skipped`);
      }
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

      // Add PM conversion summary to import result
      const pmConversionSummary = entityType === 'workorders' && (pmConversion.pmTasks.length > 0 || pmConversion.pmSchedules.length > 0) 
        ? `Smart PM Detection: ${pmConversion.pmTasks.length} PM tasks and ${pmConversion.pmSchedules.length} PM schedules created from preventative/routine work orders. `
        : '';

      return {
        success: errors.length === 0,
        importedCount,
        skippedCount,
        errors,
        duplicates,
        importId,
        pmConversionSummary
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

  // Check for duplicate records based on key identifying fields
  private static async checkForDuplicate(
    tx: any,
    entityType: string,
    row: Record<string, any>,
    organizationId: number
  ): Promise<boolean> {
    const config = entityConfigs[entityType];
    if (!config) return false;

    try {
      // Define key fields to check for duplicates per entity type
      const duplicateCheckFields: Record<string, string[]> = {
        workorders: ['title', 'organizationId'],
        assets: ['name', 'organizationId'],
        locations: ['name', 'organizationId'],
        users: ['email'],
        parts: ['name', 'organizationId'],
        suppliers: ['name', 'organizationId'],
        pmtasks: ['title', 'organizationId'],
        pmschedules: ['title', 'assetId']
      };

      const checkFields = duplicateCheckFields[entityType];
      if (!checkFields) return false;

      // Build where clause for duplicate check
      const whereClause: Record<string, any> = {};
      
      for (const field of checkFields) {
        if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
          whereClause[field] = row[field];
        }
      }

      // If we don't have enough data to check for duplicates, allow creation
      if (Object.keys(whereClause).length === 0) return false;

      // Check if record already exists
      const existingRecord = await tx[config.tableName].findFirst({
        where: whereClause
      });

      return !!existingRecord;
      
    } catch (error) {
      console.error(`Error checking for duplicates in ${entityType}:`, error);
      return false; // If we can't check, allow creation
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