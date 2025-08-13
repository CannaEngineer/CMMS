/**
 * Portal data transformation utilities for frontend/backend compatibility
 */

// Map frontend field types to backend field types
const FIELD_TYPE_MAP: Record<string, string> = {
  // Common frontend field types used in wizard
  'select': 'SELECT',
  'priority': 'PRIORITY',
  'location': 'LOCATION',
  'textarea': 'TEXTAREA',
  'image': 'IMAGE',
  'text': 'TEXT',
  
  // Hyphenated frontend types
  'PRIORITY-SELECTOR': 'PRIORITY',
  'LOCATION-PICKER': 'LOCATION', 
  'PHOTO-CAPTURE': 'IMAGE',
  'ASSET-PICKER': 'ASSET_PICKER',
  'USER-PICKER': 'USER_PICKER',
  'MULTI-SELECT': 'MULTI_SELECT',
  
  // Keep valid types as-is (uppercase)
  'TEXT': 'TEXT',
  'TEXTAREA': 'TEXTAREA',
  'EMAIL': 'EMAIL',
  'PHONE': 'PHONE',
  'NUMBER': 'NUMBER',
  'SELECT': 'SELECT',
  'RADIO': 'RADIO',
  'CHECKBOX': 'CHECKBOX',
  'DATE': 'DATE',
  'TIME': 'TIME',
  'DATETIME': 'DATETIME',
  'FILE': 'FILE',
  'IMAGE': 'IMAGE',
  'LOCATION': 'LOCATION',
  'ASSET_PICKER': 'ASSET_PICKER',
  'USER_PICKER': 'USER_PICKER',
  'PRIORITY': 'PRIORITY',
  'RATING': 'RATING',
  'SIGNATURE': 'SIGNATURE',
  'URL': 'URL',
  'CURRENCY': 'CURRENCY'
};

// Map portal types to backend format
const PORTAL_TYPE_MAP: Record<string, string> = {
  'maintenance-request': 'MAINTENANCE_REQUEST',
  'asset-registration': 'ASSET_REGISTRATION',
  'equipment-info': 'EQUIPMENT_INFO',
  'general-inquiry': 'GENERAL_INQUIRY',
  'inspection-report': 'INSPECTION_REPORT',
  'safety-incident': 'SAFETY_INCIDENT',
  // Keep valid types as-is
  'MAINTENANCE_REQUEST': 'MAINTENANCE_REQUEST',
  'ASSET_REGISTRATION': 'ASSET_REGISTRATION',
  'EQUIPMENT_INFO': 'EQUIPMENT_INFO',
  'GENERAL_INQUIRY': 'GENERAL_INQUIRY',
  'INSPECTION_REPORT': 'INSPECTION_REPORT',
  'SAFETY_INCIDENT': 'SAFETY_INCIDENT'
};

// Reverse mapping for backend to frontend
const BACKEND_TO_FRONTEND_PORTAL_TYPE: Record<string, string> = {
  'MAINTENANCE_REQUEST': 'maintenance-request',
  'ASSET_REGISTRATION': 'asset-registration',
  'EQUIPMENT_INFO': 'equipment-info',
  'GENERAL_INQUIRY': 'general-inquiry',
  'INSPECTION_REPORT': 'inspection-report',
  'SAFETY_INCIDENT': 'safety-incident'
};

/**
 * Transform field type from frontend to backend format
 */
export function transformFieldType(frontendType: string): string {
  const mapped = FIELD_TYPE_MAP[frontendType];
  if (!mapped) {
    console.warn(`Unknown field type: ${frontendType}, using TEXT as fallback`);
    return 'TEXT';
  }
  return mapped;
}

/**
 * Transform portal type from frontend to backend format
 */
export function transformPortalType(frontendType: string): string {
  console.log('Portal type mapping:', frontendType, '->', PORTAL_TYPE_MAP[frontendType]);
  const mapped = PORTAL_TYPE_MAP[frontendType];
  if (!mapped) {
    console.warn(`Unknown portal type: ${frontendType}, using MAINTENANCE_REQUEST as fallback`);
    return 'MAINTENANCE_REQUEST';
  }
  return mapped;
}

/**
 * Transform portal type from backend to frontend format
 */
export function transformPortalTypeToFrontend(backendType: string): string {
  return BACKEND_TO_FRONTEND_PORTAL_TYPE[backendType] || backendType.toLowerCase().replace(/_/g, '-');
}

/**
 * Transform portal fields array for backend submission
 */
export function transformPortalFields(fields: any[]): any[] {
  return fields.map((field, index) => ({
    ...field,
    type: transformFieldType(field.type || 'TEXT'),
    orderIndex: field.orderIndex !== undefined ? field.orderIndex : index,
    isRequired: Boolean(field.required || field.isRequired),
    options: Array.isArray(field.options) ? field.options : undefined
  }));
}

/**
 * Transform complete portal data for backend submission
 */
export function transformPortalForBackend(portalData: any): any {
  console.log('Transforming portal type from:', portalData.type, 'to:', transformPortalType(portalData.type));
  const transformed = {
    ...portalData,
    type: transformPortalType(portalData.type),
    fields: portalData.fields ? transformPortalFields(portalData.fields) : undefined
  };

  // Remove frontend-only properties that backend doesn't expect
  delete transformed.id; // Backend generates this
  delete transformed.slug; // Backend generates this
  delete transformed.publicUrl; // Backend generates this
  delete transformed.adminUrl; // Backend generates this
  delete transformed.submissionCount; // Backend calculates this
  delete transformed.lastSubmissionAt; // Backend tracks this
  delete transformed.createdAt; // Backend sets this
  delete transformed.updatedAt; // Backend sets this
  delete transformed.createdBy; // Backend sets this
  delete transformed.organizationId; // Backend sets this from auth context

  // Clean up undefined values
  Object.keys(transformed).forEach(key => {
    if (transformed[key] === undefined) {
      delete transformed[key];
    }
  });

  return transformed;
}

/**
 * Validate field type is supported
 */
export function isValidFieldType(type: string): boolean {
  return Object.values(FIELD_TYPE_MAP).includes(type);
}

/**
 * Validate portal type is supported
 */
export function isValidPortalType(type: string): boolean {
  return Object.values(PORTAL_TYPE_MAP).includes(type);
}

/**
 * Transform portal type from frontend to backend (alias for consistency)
 */
export function transformPortalTypeToBackend(frontendType: string): string {
  return transformPortalType(frontendType);
}

/**
 * Transform portal from backend to frontend format
 */
export function transformPortalFromBackend(backendPortal: any): any {
  const transformed = {
    ...backendPortal,
    // Ensure ID is a string for frontend consistency
    id: backendPortal.id?.toString(),
    organizationId: backendPortal.organizationId?.toString(),
    // Transform portal type to frontend format
    type: transformPortalTypeToFrontend(backendPortal.type),
    // Ensure fields is always an array
    fields: backendPortal.fields ? backendPortal.fields : [],
    // Ensure submission count exists
    submissionCount: backendPortal._count?.submissions || backendPortal.submissionCount || 0
  };

  return transformed;
}

/**
 * Transform portal field for backend submission
 */
export function transformPortalFieldForBackend(field: any): any {
  return {
    ...field,
    type: transformFieldType(field.type || 'TEXT'),
    isRequired: Boolean(field.required || field.isRequired)
  };
}

/**
 * Transform portal field from backend to frontend format
 */
export function transformPortalFieldFromBackend(backendField: any): any {
  return {
    ...backendField,
    required: backendField.isRequired
  };
}