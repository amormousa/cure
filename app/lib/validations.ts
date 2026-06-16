// lib/validations.ts

import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const CreateDispatchSchema = z.object({
  patientId: z.string().cuid('Invalid patient ID'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  scheduledFor: z.string().datetime('Invalid datetime'),
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
})

export const UpdateDispatchSchema = z.object({
  status: z.enum(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  nurseId: z.string().cuid('Invalid nurse ID').nullable().optional(),
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
  completedAt: z.string().datetime('Invalid datetime').nullable().optional(),
})

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(60, 'Name must not exceed 60 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'NURSE', 'DISPATCHER']),
  phone: z.string().regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Invalid phone number').optional().or(z.literal('')),
})

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  role: z.enum(['ADMIN', 'NURSE', 'DISPATCHER']).optional(),
  isActive: z.boolean().optional(),
  phone: z.string().regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Invalid phone number').optional().or(z.literal('')),
})

export const CreatePatientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  phone: z.string().regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Invalid phone number'),
  condition: z.string().min(3, 'Condition must be at least 3 characters'),
  notes: z.string().optional(),
})

export const UpdatePatientSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  address: z.string().min(5).optional(),
  phone: z.string().regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Invalid phone number').optional(),
  condition: z.string().min(3).optional(),
  notes: z.string().optional().nullable(),
})

export const AISuggestSchema = z.object({
  dispatchId: z.string().cuid('Invalid dispatch ID').optional(),
  patientId: z.string().cuid('Invalid patient ID').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  scheduledFor: z.string().datetime('Invalid datetime').optional(),
})

// Type exports for forms and API
export type LoginInput = z.infer<typeof LoginSchema>
export type CreateDispatchInput = z.infer<typeof CreateDispatchSchema>
export type UpdateDispatchInput = z.infer<typeof UpdateDispatchSchema>
export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
export type CreatePatientInput = z.infer<typeof CreatePatientSchema>
export type UpdatePatientInput = z.infer<typeof UpdatePatientSchema>
export type AISuggestInput = z.infer<typeof AISuggestSchema>
