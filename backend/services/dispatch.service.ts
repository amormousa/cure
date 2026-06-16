// backend/services/dispatch.service.ts
// Business logic for Dispatch CRUD, separated from HTTP routing.

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/backend/utils/logger'
import { Errors } from '@/backend/utils/errors'
import { emitSocketEvent } from '@/backend/lib/socket'
import type {
  DispatchWithRelations,
  DispatchDetail,
  PaginationMeta,
} from '@/backend/types/models'

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

  const dispatch = await prisma.dispatch.create({
    data: {
      patientId: data.patientId,
      priority: data.priority,
      scheduledFor: new Date(data.scheduledFor),
      notes: data.notes,
    },
    include: DISPATCH_INCLUDE,
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'DISPATCH_CREATED',
      entityType: 'Dispatch',
      entityId: dispatch.id,
      dispatchId: dispatch.id,
      details: dispatch,
    },
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

export async function updateDispatch(id: string, data: UpdateDispatchData, userId: string) {
  const dispatch = await prisma.dispatch.findUnique({ where: { id } })
  if (!dispatch) throw Errors.notFound('Dispatch')

  // Verify nurse if provided
  if (data.nurseId) {
    const nurse = await prisma.user.findUnique({ where: { id: data.nurseId } })
    if (!nurse) throw Errors.notFound('Nurse')
  }

  const updated = await prisma.dispatch.update({
    where: { id },
    data: {
      status: data.status,
      nurseId: data.nurseId,
      notes: data.notes,
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      updatedAt: new Date(),
    },
    include: DISPATCH_INCLUDE,
  })

  // Audit log
  const action = data.status ? 'DISPATCH_STATUS_CHANGED' : 'DISPATCH_UPDATED'
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType: 'Dispatch',
      entityId: dispatch.id,
      dispatchId: dispatch.id,
      details: {
        before: dispatch,
        after: updated,
        changedFields: Object.keys(data).filter(
          (key) => (data as Record<string, unknown>)[key] !== (dispatch as Record<string, unknown>)[key],
        ),
      },
    },
  })

  // Socket events
  if (data.status) {
    await emitSocketEvent('dispatch:status_changed', {
      id: updated.id, status: updated.status, nurseId: updated.nurseId,
    })
  } else if (data.nurseId !== undefined) {
    await emitSocketEvent('dispatch:nurse_assigned', {
      id: updated.id, nurseId: updated.nurseId,
    })
  }

  log.info('Dispatch updated', { id, action })
  return updated
}

// ─── Cancel (soft delete) ──────────────────────────────
export async function cancelDispatch(id: string, userId: string) {
  const dispatch = await prisma.dispatch.findUnique({ where: { id } })
  if (!dispatch) throw Errors.notFound('Dispatch')

  const cancelled = await prisma.dispatch.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: DISPATCH_INCLUDE,
  })

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'DISPATCH_CANCELLED',
      entityType: 'Dispatch',
      entityId: dispatch.id,
      dispatchId: dispatch.id,
    },
  })

  await emitSocketEvent('dispatch:status_changed', {
    id: cancelled.id, status: 'CANCELLED', nurseId: cancelled.nurseId,
  })

  log.info('Dispatch cancelled', { id })
  return cancelled
}
