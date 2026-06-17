// lib/validations.ts
// Centralised Zod schemas for request validation across all API routes.

import { z } from 'zod'

// ═══════════════════════════════════════════════════════════════════════════
// Auth
// ═══════════════════════════════════════════════════════════════════════════

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
})
export type LoginInput = z.infer<typeof LoginSchema>

// ═══════════════════════════════════════════════════════════════════════════
// Users
// ═══════════════════════════════════════════════════════════════════════════

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format').trim().toLowerCase(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'NURSE', 'DISPATCHER']).default('NURSE'),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
  departmentId: z.string().cuid().optional().nullable(),
  specializationIds: z.array(z.string().cuid()).optional(),
})
export type CreateUserInput = z.infer<typeof CreateUserSchema>

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().trim().toLowerCase().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'NURSE', 'DISPATCHER']).optional(),
  phone: z.string().optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
  departmentId: z.string().cuid().optional().nullable(),
  specializationIds: z.array(z.string().cuid()).optional(),
})
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>

// ═══════════════════════════════════════════════════════════════════════════
// Patients
// ═══════════════════════════════════════════════════════════════════════════

export const CreatePatientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  address: z.string().min(3, 'Address is required'),
  phone: z.string().min(5, 'Phone is required'),
  condition: z.string().min(1, 'Condition is required'),
  notes: z.string().optional(),
})
export type CreatePatientInput = z.infer<typeof CreatePatientSchema>

export const UpdatePatientSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  address: z.string().min(3).optional(),
  phone: z.string().min(5).optional(),
  condition: z.string().min(1).optional(),
  notes: z.string().optional().nullable(),
})
export type UpdatePatientInput = z.infer<typeof UpdatePatientSchema>

// ═══════════════════════════════════════════════════════════════════════════
// Dispatches
// ═══════════════════════════════════════════════════════════════════════════

export const CreateDispatchSchema = z.object({
  patientId: z.string().cuid('Invalid patient ID'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  scheduledFor: z.string().datetime({ message: 'scheduledFor must be a valid ISO 8601 date' }),
  nurseId: z.string().cuid().optional().nullable(),
  notes: z.string().optional(),
})
export type CreateDispatchInput = z.infer<typeof CreateDispatchSchema>

export const UpdateDispatchSchema = z.object({
  status: z.enum(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  scheduledFor: z.string().datetime().optional(),
  nurseId: z.string().cuid().optional().nullable(),
  notes: z.string().optional().nullable(),
})
export type UpdateDispatchInput = z.infer<typeof UpdateDispatchSchema>

// ═══════════════════════════════════════════════════════════════════════════
// AI Suggest
// ═══════════════════════════════════════════════════════════════════════════

export const AISuggestSchema = z.object({
  patientId: z.string().cuid().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  scheduledFor: z.string().datetime().optional(),
  dispatchId: z.string().cuid().optional(),
})
export type AISuggestInput = z.infer<typeof AISuggestSchema>

// Departments
export const CreateDepartmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
})
export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>

export const UpdateDepartmentSchema = CreateDepartmentSchema.partial()
export type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>

// Specializations
export const CreateSpecializationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
})
export type CreateSpecializationInput = z.infer<typeof CreateSpecializationSchema>

export const UpdateSpecializationSchema = CreateSpecializationSchema.partial()
export type UpdateSpecializationInput = z.infer<typeof UpdateSpecializationSchema>
