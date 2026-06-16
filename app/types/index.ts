// types/index.ts

export type Role = 'ADMIN' | 'NURSE' | 'DISPATCHER'
export type DispatchStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  isActive: boolean
  isOnline: boolean
  avatar?: string | null
  phone?: string | null
  createdAt: string
  updatedAt: string
}

export interface Patient {
  id: string
  name: string
  address: string
  phone: string
  condition: string
  notes?: string
  createdAt: string
}

export interface Dispatch {
  id: string
  patientId: string
  patient: Patient
  status: DispatchStatus
  priority: Priority
  scheduledFor: string
  nurseId?: string | null
  nurse?: Pick<User, 'id' | 'name' | 'avatar'> | null
  notes?: string
  completedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface DispatchAuditLog {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string
  details?: {
    changedFields?: string[]
    after?: Partial<Dispatch>
    priority?: Priority
    [key: string]: unknown
  } | null
  createdAt: string
  dispatchId?: string | null
  user?: { name: string }
}

export interface DispatchDetail extends Dispatch {
  auditLogs: DispatchAuditLog[]
}

export interface NurseDetail extends User {
  dispatches: Dispatch[]
}

export interface AnalyticsPayload {
  dailySeries: { date: string; created: number; completed: number }[]
  statusBreakdown: Record<DispatchStatus, number>
  priorityBreakdown: Record<Priority, number>
  nursePerformance: { nurseId: string; name: string; completed: number }[]
}

export interface AuditLog {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string
  details?: Record<string, unknown>
  createdAt: string
  dispatchId?: string | null
}

// API wrapper types
export type ApiResponse<T> = { data: T; message?: string }
export type ApiError = { error: string; details?: unknown }

// Authentication
export interface JWTPayload {
  id: string
  email: string
  role: Role
  iat: number
  exp: number
}
