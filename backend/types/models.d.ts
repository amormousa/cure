// backend/types/models.d.ts
// Shared domain types inferred from the Prisma schema.
// These complement the auto-generated Prisma types with API-level shapes.

import type {
  User as PrismaUser,
  Patient as PrismaPatient,
  Dispatch as PrismaDispatch,
  AuditLog as PrismaAuditLog,
  Role,
  DispatchStatus,
  Priority,
} from '@prisma/client'

// Re-export enums for convenience
export type { Role, DispatchStatus, Priority }

// ─── User ──────────────────────────────────────────────
/** User object returned by API (never includes password). */
export interface SafeUser {
  id: string
  email: string
  name: string
  role: Role
  isActive: boolean
  isOnline: boolean
  avatar: string | null
  phone: string | null
  createdAt: Date
  updatedAt: Date
}

/** Nurse summary used in dispatch responses. */
export interface NurseSummary {
  id: string
  name: string
  avatar: string | null
}

/** Nurse with active-dispatch count (used in user listing). */
export interface NurseWithWorkload extends SafeUser {
  _count: {
    dispatches: number
  }
}

// ─── Patient ───────────────────────────────────────────
export interface Patient extends PrismaPatient {}

export interface PatientWithDispatches extends Patient {
  dispatches: {
    id: string
    status: DispatchStatus
  }[]
}

// ─── Dispatch ──────────────────────────────────────────
/** Dispatch with included patient + nurse summary. */
export interface DispatchWithRelations {
  id: string
  patientId: string
  patient: Patient
  status: DispatchStatus
  priority: Priority
  scheduledFor: Date
  nurseId: string | null
  nurse: NurseSummary | null
  notes: string | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/** Dispatch with full audit-log trail. */
export interface DispatchDetail extends DispatchWithRelations {
  auditLogs: (AuditLogEntry & { user: { name: string } })[]
}

// ─── AuditLog ──────────────────────────────────────────
export interface AuditLogEntry {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string
  details: unknown
  createdAt: Date
  dispatchId: string | null
}

// ─── AI / Nurse Scoring ────────────────────────────────
export interface NurseDispatchInfo {
  id: string
  scheduledFor: Date
  status: DispatchStatus
  priority: Priority
}

export interface NurseForScoring {
  id: string
  name: string
  email: string
  avatar: string | null
  phone: string | null
  isOnline: boolean
  dispatches: NurseDispatchInfo[]
}

export interface NurseScoreResult {
  score: number
  reasons: string[]
}

export interface NurseSuggestion {
  nurse: Omit<NurseForScoring, 'dispatches'>
  score: number
  activeDispatchesCount: number
  reasons: string[]
}

// ─── Analytics ─────────────────────────────────────────
export interface DailySeries {
  date: string
  created: number
  completed: number
}

export interface StatusBreakdown {
  PENDING: number
  ASSIGNED: number
  IN_PROGRESS: number
  COMPLETED: number
  CANCELLED: number
}

export interface PriorityBreakdown {
  LOW: number
  MEDIUM: number
  HIGH: number
  URGENT: number
}

export interface NursePerformance {
  nurseId: string
  name: string
  completed: number
}

export interface AnalyticsResponse {
  dispatchesToday: number
  completionRate: number
  activeNurses: number
  urgentDispatches: number
  trends: DailySeries[]
  completedToday: number
  createdToday: number
  availableNurses: number
  onlineNurses: number
  urgentPending: number
  dailySeries: DailySeries[]
  statusBreakdown: StatusBreakdown
  priorityBreakdown: PriorityBreakdown
  nursePerformance: NursePerformance[]
}

// ─── JWT / Auth ────────────────────────────────────────
export interface JWTPayload {
  userId: string
  email: string
  role: Role
  iat?: number
  exp?: number
}

// ─── Socket Events ─────────────────────────────────────
export interface SocketDispatchUpdate {
  id: string
  status?: string
  nurseId?: string | null
}

export interface SocketNursePresence {
  userId: string
}

// ─── Pagination ────────────────────────────────────────
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}
