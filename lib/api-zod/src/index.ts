import { z } from 'zod';

/**
 * User role validation schema
 */
export const UserRoleSchema = z.enum([
  'student',
  'member',
  'executive',
  'president',
  'higher_official'
]);

/**
 * User schema validation
 */
export const UserSchema = z.object({
  user_id: z.string().uuid(),
  full_name: z.string(),
  email: z.string().email(),
  role: UserRoleSchema,
  student_id: z.string(),
  phone: z.string(),
  is_approved: z.boolean(),
  is_active: z.boolean()
});

/**
 * Report category schema
 */
export const ReportCategorySchema = z.enum([
  'physical',
  'verbal',
  'property',
  'mental_health',
  'other'
]);

/**
 * Report status schema
 */
export const ReportStatusSchema = z.enum([
  'pending',
  'in_progress',
  'on_hold',
  'resolved',
  'rejected',
  'escalated'
]);

export type UserRole = z.infer<typeof UserRoleSchema>;
export type User = z.infer<typeof UserSchema>;
export type ReportCategory = z.infer<typeof ReportCategorySchema>;
export type ReportStatus = z.infer<typeof ReportStatusSchema>;
