/**
 * Portal data validation utilities
 */
import { isValidFieldType, isValidPortalType } from './portalTransforms';

/**
 * Validate portal data for backend submission
 */
export function validatePortalForBackend(portalData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!portalData.name?.trim()) {
    errors.push('Portal name is required');
  }

  if (!portalData.type) {
    errors.push('Portal type is required');
  } else if (!isValidPortalType(portalData.type)) {
    errors.push(`Invalid portal type: ${portalData.type}`);
  }

  // Validate fields if present
  if (portalData.fields && Array.isArray(portalData.fields)) {
    portalData.fields.forEach((field: any, index: number) => {
      if (!field.name) {
        errors.push(`Field ${index + 1}: name is required`);
      }
      if (!field.label) {
        errors.push(`Field ${index + 1}: label is required`);
      }
      if (!field.type) {
        errors.push(`Field ${index + 1}: type is required`);
      } else if (!isValidFieldType(field.type)) {
        errors.push(`Field ${index + 1}: invalid type "${field.type}"`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize portal data by removing invalid properties
 */
export function sanitizePortalData(portalData: any): any {
  const sanitized = {
    ...portalData,
    name: portalData.name?.trim() || '',
    description: portalData.description?.trim() || '',
  };

  // Remove undefined values
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });

  // Sanitize fields
  if (sanitized.fields && Array.isArray(sanitized.fields)) {
    sanitized.fields = sanitized.fields.filter((field: any) => field.name && field.label && field.type);
  }

  return sanitized;
}