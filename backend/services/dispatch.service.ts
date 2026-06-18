// backend/services/dispatch.service.ts
// Business logic for Dispatch CRUD, separated from HTTP routing.

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { createLogger } from '@/backend/utils/logger'
import { Errors } from '@/backend/utils/errors'
import { emitSocketEvent } from '@/backend/lib/socket'
import type { PaginationMeta } from '@/backend/types/models'

const log = createLogger('DispatchService')

// Shared include fragments
const DISPATCH_INCLUDE = {
  patient: true,
  nurse: { select: { id: true, name: true, avatar: true } },
} as const

const DISPATCH_DETAIL_INCLUDE = {
  ...DISPATCH_INCLUDE,
  auditLogs: {
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
} as const

// ─── Audit-log user resolution ──────────────────────────
/** Walk a list of candidate user IDs; return the first that exists in the DB, or null. */
async function resolveAuditUserId(
  tx: Prisma.TransactionClient,
  ...candidates: (string | null | undefined)[]
): Promise<string | null> {
  const seen = new Set<string>()
  for (const id of candidates) {
    if (!id || seen.has(id)) continue
    seen.add(id)
    const user = await tx.user.findUnique({ where: { id }, select: { id: true } })
    if (user) return user.id
  }
  return null
}

// ─── List ──────────────────────────────────────────────
export interface ListDispatchesParams {
  status?: string | null
  priority?: string | null
  nurseId?: string | null
  search?: string | null
  page?: number
  limit?: number
}

export async function listDispatches(params: ListDispatchesParams) {
  const { status, priority, nurseId, search, page = 1, limit = 1000 } = params
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (priority) where.priority = priority
  if (nurseId) where.nurseId = nurseId
  if (search) {
    where.OR = [
      { patient: { name: { contains: search, mode: 'insensitive' } } },
      { patient: { phone: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [total, dispatches] = await Promise.all([
    prisma.dispatch.count({ where }),
    prisma.dispatch.findMany({
      where,
      include: DISPATCH_INCLUDE,
      orderBy: { scheduledFor: 'asc' },
      skip,
      take: limit,
    }),
  ])

  const pagination: PaginationMeta = {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  }

  log.info('Listed dispatches', { total, page })
  return { data: dispatches, pagination }
}

// ─── Get by ID ─────────────────────────────────────────
export async function getDispatchById(id: string) {
  const dispatch = await prisma.dispatch.findUnique({
    where: { id },
    include: DISPATCH_DETAIL_INCLUDE,
  })

  if (!dispatch) throw Errors.notFound('Dispatch')
  return dispatch
}

// ─── Create ────────────────────────────────────────────
export interface CreateDispatchData {
  patientId: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  scheduledFor: string
  notes?: string
}

export async function createDispatch(data: CreateDispatchData, userId: string) {
  // Verify patient exists
  const patient = await prisma.patient.findUnique({
    where: { id: data.patientId },
  })
  if (!patient) throw Errors.notFound('Patient')

  const dispatch = await prisma.$transaction(async (tx) => {
    const created = await tx.dispatch.create({
      data: {
        patientId: data.patientId,
        priority: data.priority,
        scheduledFor: new Date(data.scheduledFor),
        notes: data.notes,
      },
      include: DISPATCH_INCLUDE,
    })

    await tx.auditLog.create({
      data: {
        userId,
        action: 'DISPATCH_CREATED',
        entityType: 'Dispatch',
        entityId: created.id,
        dispatchId: created.id,
        newValue: created,
        details: { after: created },
      },
    })

    return created
  })

  await emitSocketEvent('dispatch:created', dispatch)
  log.info('Dispatch created', { id: dispatch.id })
  return dispatch
}

// ─── Update ────────────────────────────────────────────
export interface UpdateDispatchData {
  status?: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  nurseId?: string | null
  notes?: string
  completedAt?: string | null
}

export async function updateDispatch(
  id: string,
  data: UpdateDispatchData,
  userId: string,
  authRole: 'ADMIN' | 'NURSE' | 'DISPATCHER',
) {
  const dispatch = await prisma.dispatch.findUnique({ where: { id } })
  if (!dispatch) throw Errors.notFound('Dispatch')

  if (authRole === 'NURSE') {
    // Nurse can only update: status/notes/completedAt
    if (data.nurseId !== undefined) {
      throw Errors.forbidden('Cannot change nurse assignment')
    }

    // Nurse can only update their own dispatch
    if (dispatch.nurseId !== userId) {
      throw Errors.forbidden('Not your assigned dispatch')
    }
  } else {
    // Verify nurse if provided (Admin/Dispatcher flow)
    if (data.nurseId !== undefined && data.nurseId !== null) {
      const nurse = await prisma.user.findUnique({ where: { id: data.nurseId } })
      if (!nurse || nurse.role !== 'NURSE' || !nurse.isActive) throw Errors.notFound('Active nurse')
    }
  }

  const action =
    data.status !== undefined || data.completedAt !== undefined
      ? 'DISPATCH_STATUS_CHANGED'
      : 'DISPATCH_ASSIGNED'

  const completedAtValue =
    data.completedAt === null
      ? undefined
      : data.completedAt
        ? new Date(data.completedAt)
        : undefined

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.dispatch.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(completedAtValue !== undefined ? { completedAt: completedAtValue } : {}),
        ...(data.notes === undefined ? {} : {}), // keep object stable for strict TS
        updatedAt: new Date(),
        ...(authRole !== 'NURSE' && data.nurseId !== undefined && data.nurseId !== null
          ? { nurseId: data.nurseId }
          : {}),
      },
      include: DISPATCH_INCLUDE,
    })

    // Resolve a valid user for audit log (nullable — FK accepts null)
    const auditUserId = await resolveAuditUserId(tx, userId, data.nurseId || dispatch.nurseId)
    await tx.auditLog.create({
      data: {
        userId: auditUserId,
        action,
        entityType: 'Dispatch',
        entityId: dispatch.id,
        dispatchId: dispatch.id,
        previousValue: dispatch,
        newValue: result,
        details: {
          before: dispatch,
          after: result,
          changedFields: Object.keys(data).filter((key) => {
            return (data as Record<string, unknown>)[key] !== (dispatch as Record<string, unknown>)[key]
          }),
        },
      },
    })

    return result
  })

  const isStatusLikeUpdate = data.status !== undefined || data.completedAt !== undefined

  if (isStatusLikeUpdate) {
    await emitSocketEvent('dispatch:status_changed', {
      id: updated.id,
      status: updated.status,
      nurseId: updated.nurseId,
    })
  } else if (data.nurseId !== undefined) {
    await emitSocketEvent('dispatch:nurse_assigned', {
      id: updated.id,
      nurseId: updated.nurseId,
    })
  }

  log.info('Dispatch updated', { id, action })
  return updated
}

// ─── Cancel (soft delete) ──────────────────────────────
export async function cancelDispatch(id: string, userId: string) {
  const dispatch = await prisma.dispatch.findUnique({ where: { id } })
  if (!dispatch) throw Errors.notFound('Dispatch')

  const cancelled = await prisma.$transaction(async (tx) => {
    const result = await tx.dispatch.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: DISPATCH_INCLUDE,
    })

    const auditUserId = await resolveAuditUserId(tx, userId, dispatch.nurseId)
    await tx.auditLog.create({
      data: {
        userId: auditUserId,
        action: 'DISPATCH_CANCELLED',
        entityType: 'Dispatch',
        entityId: dispatch.id,
        dispatchId: dispatch.id,
        previousValue: dispatch,
        newValue: result,
        details: { before: dispatch, after: result },
      },
    })

    return result
  })

  await emitSocketEvent('dispatch:status_changed', {
    id: cancelled.id,
    status: 'CANCELLED',
    nurseId: cancelled.nurseId,
  })

  log.info('Dispatch cancelled', { id })
  return cancelled
}
