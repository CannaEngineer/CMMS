import { z } from 'zod';

// Email validation regex pattern
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Login form validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .regex(emailRegex, 'Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
});

// Asset form validation schema
export const assetSchema = z.object({
  id: z.number().int().optional(),
  legacyId: z.number().int().optional(),
  name: z
    .string()
    .min(1, 'Asset name is required')
    .max(100, 'Asset name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
  serialNumber: z
    .string()
    .max(50, 'Serial number must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  modelNumber: z
    .string()
    .max(50, 'Model number must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  manufacturer: z
    .string()
    .max(100, 'Manufacturer must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  year: z
    .number()
    .int('Year must be a whole number')
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 1, `Year cannot be later than ${new Date().getFullYear() + 1}`)
    .optional()
    .nullable(),
  status: z.enum(['ONLINE', 'OFFLINE'], {
    message: 'Status must be either Online or Offline'
  }),
  criticality: z.enum(['LOW', 'MEDIUM', 'HIGH', 'IMPORTANT'], {
    message: 'Please select a valid criticality level'
  }),
  barcode: z
    .string()
    .max(50, 'Barcode must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  imageUrl: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  attachments: z.any().optional(),
  locationId: z
    .number()
    .int('Location must be selected')
    .min(1, 'Please select a location'),
  organizationId: z
    .number()
    .int()
    .optional(),
  parentId: z
    .number()
    .int()
    .optional(),
  purchaseDate: z
    .string()
    .optional(),
  purchaseCost: z
    .number()
    .optional(),
  warrantyExpiry: z
    .string()
    .optional(),
  category: z
    .string()
    .optional(),
});

// Part form validation schema with flexible input handling
export const partSchema = z.object({
  id: z.union([z.number(), z.string()]).optional().transform(val => val ? Number(val) : undefined),
  legacyId: z.any().optional(),
  name: z
    .string()
    .min(1, 'Part name is required')
    .max(100, 'Part name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val),
  sku: z.any().optional(),
  stockLevel: z
    .union([z.number(), z.string()])
    .transform(val => Number(val))
    .refine(val => !isNaN(val), 'Stock level must be a number')
    .refine(val => val >= 0, 'Stock level cannot be negative')
    .refine(val => val <= 1000000, 'Stock level cannot exceed 1,000,000')
    .refine(val => Number.isInteger(val), 'Stock level must be a whole number'),
  reorderPoint: z
    .union([z.number(), z.string()])
    .transform(val => Number(val))
    .refine(val => !isNaN(val), 'Reorder point must be a number')
    .refine(val => val >= 0, 'Reorder point cannot be negative')
    .refine(val => val <= 100000, 'Reorder point cannot exceed 100,000')
    .refine(val => Number.isInteger(val), 'Reorder point must be a whole number'),
  unitCost: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .optional()
    .transform(val => {
      if (val === null || val === undefined || val === '') return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    })
    .refine(val => val === undefined || val >= 0, 'Unit cost cannot be negative')
    .refine(val => val === undefined || val <= 1000000, 'Unit cost cannot exceed $1,000,000'),
  unitOfMeasure: z
    .string()
    .max(20, 'Unit of measure must be less than 20 characters')
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val),
  category: z
    .string()
    .max(50, 'Category must be less than 50 characters')
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val),
  manufacturer: z
    .string()
    .max(100, 'Manufacturer must be less than 100 characters')
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val),
  location: z
    .string()
    .max(100, 'Location must be less than 100 characters')
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val),
  leadTime: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .optional()
    .transform(val => {
      if (val === null || val === undefined || val === '') return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    })
    .refine(val => val === undefined || val >= 0, 'Lead time cannot be negative')
    .refine(val => val === undefined || val <= 365, 'Lead time cannot exceed 365 days')
    .refine(val => val === undefined || Number.isInteger(val), 'Lead time must be a whole number'),
  organizationId: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .optional()
    .transform(val => {
      if (val === null || val === undefined || val === '') return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    }),
  supplierId: z.any().optional(),
});

// Work Order form validation schema
export const workOrderSchema = z.object({
  title: z
    .string()
    .min(1, 'Work order title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters')
    .trim(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
    message: 'Please select a valid priority level'
  }),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], {
    message: 'Please select a valid status'
  }),
  assetId: z
    .number()
    .int('Asset must be selected')
    .min(1, 'Please select an asset')
    .optional(),
  assignedUserId: z
    .number()
    .int()
    .optional(),
  scheduledDate: z
    .string()
    .datetime('Please enter a valid date and time')
    .optional(),
  estimatedHours: z
    .number()
    .min(0, 'Estimated hours cannot be negative')
    .max(1000, 'Estimated hours cannot exceed 1000')
    .optional(),
  actualHours: z
    .number()
    .min(0, 'Actual hours cannot be negative')
    .max(1000, 'Actual hours cannot exceed 1000')
    .optional(),
  cost: z
    .number()
    .min(0, 'Cost cannot be negative')
    .max(1000000, 'Cost cannot exceed $1,000,000')
    .optional(),
});

// User form validation schema
export const userSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .regex(emailRegex, 'Please enter a valid email address'),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .trim(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .trim(),
  role: z.enum(['ADMIN', 'MANAGER', 'TECHNICIAN'], {
    message: 'Please select a valid role'
  }),
  phone: z
    .string()
    .regex(/^[\d\s\-\+\(\)\.]+$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .optional(),
  confirmPassword: z
    .string()
    .optional(),
}).refine((data) => {
  if (data.password && data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Location form validation schema
export const locationSchema = z.object({
  name: z
    .string()
    .min(1, 'Location name is required')
    .max(100, 'Location name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  address: z
    .string()
    .max(200, 'Address must be less than 200 characters')
    .optional(),
  parentLocationId: z
    .number()
    .int()
    .optional(),
});

// Signup form validation schema (stricter than user schema)
export const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .regex(emailRegex, 'Please enter a valid email address'),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .trim(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  termsAccepted: z
    .boolean()
    .refine(val => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Type exports for TypeScript
export type LoginFormData = z.infer<typeof loginSchema>;
export type AssetFormData = z.infer<typeof assetSchema>;
export type PartFormData = z.infer<typeof partSchema>;
export type WorkOrderFormData = z.infer<typeof workOrderSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type LocationFormData = z.infer<typeof locationSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;

// PM Schedule validation schema
export const pmScheduleSchema = z.object({
  id: z.union([z.number(), z.string()]).optional().transform(val => val ? Number(val) : undefined),
  legacyId: z.any().optional(),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val),
  frequency: z
    .string()
    .min(1, 'Frequency is required'),
  nextDue: z
    .string()
    .min(1, 'Next due date is required'),
  assetId: z
    .union([z.number(), z.string()])
    .transform(val => Number(val))
    .refine(val => !isNaN(val) && val > 0, 'Asset is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  estimatedHours: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .optional()
    .transform(val => {
      if (val === null || val === undefined || val === '') return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    })
    .refine(val => val === undefined || val >= 0, 'Estimated hours cannot be negative'),
  assignedToId: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .optional()
    .transform(val => {
      if (val === null || val === undefined || val === '') return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    }),
  organizationId: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .optional()
    .transform(val => {
      if (val === null || val === undefined || val === '') return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    }),
});

export type PMScheduleFormData = z.infer<typeof pmScheduleSchema>;