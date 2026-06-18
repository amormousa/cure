// app/(dashboard)/admin/users/types.ts
// Shared types for users module

export interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'DISPATCHER' | 'NURSE'
  phone?: string | null
  isActive?: boolean
  isOnline?: boolean
  avatar?: string | null
  departmentId?: string | null
  department?: Department | null
  specializations?: UserSpecialization[]
  _count?: { dispatches: number }
  createdAt: string
  updatedAt?: string
}

export interface Department {
  id: string
  name: string
  description?: string | null
  isActive: boolean
}

export interface Specialization {
  id: string
  name: string
  description?: string | null
  isActive: boolean
}

export interface UserSpecialization {
  userId: string
  specializationId: string
  yearsExperience: number
  specialization?: Specialization
}