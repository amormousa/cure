// backend/services/user.service.ts
// Business logic for User CRUD.

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/backend/utils/logger'
import { Errors } from '@/backend/utils/errors'
import bcrypt from 'bcryptjs'
import type { Role } from '@/backend/types/models'

const log = createLogger('UserService')

// Safe select — never exposes password
export const SAFE_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  isOnline: true,
  avatar: true,
  phone: true,
  departmentId: true,
  department: true,
  specializations: {
    include: { specialization: true },
  },
  createdAt: true,
  updatedAt: true,
} as const

// ─── List ──────────────────────────────────────────────
export interface ListUsersParams {
  role?: string | null
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
  sortBy?: 'name' | 'createdAt' | 'email'
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedUsers {
  data: Awaited<ReturnType<typeof listUsers>>
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export async function listUsers(params?: ListUsersParams, callerRole?: string) {
  const {
    role,
    search,
    isActive,
    page = 1,
    limit = 10,
    sortBy = 'name',
    sortOrder = 'asc'
  } = params ?? {}

  let where: Record<string, unknown> = {}

  // Role filter
  if (callerRole === 'ADMIN') {
    if (role) {
      if (!['ADMIN', 'NURSE', 'DISPATCHER'].includes(role)) {
        throw Errors.validation([{ path: ['role'], message: 'Invalid role filter' }])
      }
      where.role = role as Role
    }
  } else {
    where = { role: 'NURSE', isActive: true }
    if (role && role !== 'NURSE') {
      throw Errors.forbidden('You do not have permission to view this role')
    }
  }

  // Search filter (name, email, phone)
  if (search && search.trim()) {
    const searchTerm = search.trim()
    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { email: { contains: searchTerm, mode: 'insensitive' } },
      { phone: { contains: searchTerm, mode: 'insensitive' } },
    ]
  }

  // Active status filter
  if (isActive !== undefined) {
    where.isActive = isActive
  }

  // Get total count for pagination
  const total = await prisma.user.count({ where })

  // Get paginated users
  const skip = (page - 1) * limit
  const users = await prisma.user.findMany({
    where,
    select: {
      ...SAFE_USER_SELECT,
      _count: {
        select: {
          dispatches: {
            where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
          },
        },
      },
    },
    orderBy: { [sortBy]: sortOrder },
    skip,
    take: limit,
  })

  const pagination = {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  }

  log.info('Listed users', { count: users.length, role, search, page, total })
  return { data: users, pagination }
}

// ─── Get by ID ─────────────────────────────────────────
export async function getUserById(id: string, callerUserId: string, callerRole: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...SAFE_USER_SELECT,
      dispatches: {
        orderBy: { scheduledFor: 'desc' },
        include: {
          patient: { select: { id: true, name: true, address: true, phone: true } },
        },
      },
    },
  })

  if (!user) throw Errors.notFound('User')

  // Security: non-admin can only see own profile or nurses
  if (callerRole !== 'ADMIN' && callerUserId !== user.id && user.role !== 'NURSE') {
    throw Errors.forbidden('You do not have permission to view this user')
  }

  return user
}

// ─── Create ────────────────────────────────────────────
export interface CreateUserData {
  email: string
  name: string
  password: string
  role: 'ADMIN' | 'NURSE' | 'DISPATCHER'
  phone?: string
  departmentId?: string | null
  specializationIds?: string[]
}

export async function createUser(data: CreateUserData, adminUserId: string) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) throw Errors.conflict('User with this email already exists')

  const hashedPassword = await bcrypt.hash(data.password, 10)
  const seedName = encodeURIComponent(data.name)
  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seedName}`

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: data.role,
        phone: data.phone || null,
        departmentId: data.departmentId ?? null,
        avatar,
        specializations: {
          create: (data.specializationIds ?? []).map((specializationId) => ({
            specializationId,
          })),
        },
      },
      select: SAFE_USER_SELECT,
    })

    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: created.id,
        newValue: created,
        details: { after: created },
      },
    })

    return created
  })

  log.info('User created', { id: user.id, role: user.role })
  return user
}

// ─── Update ────────────────────────────────────────────
export interface UpdateUserData {
  name?: string
  role?: 'ADMIN' | 'NURSE' | 'DISPATCHER'
  isActive?: boolean
  phone?: string
  departmentId?: string | null
  specializationIds?: string[]
}

export async function updateUser(id: string, data: UpdateUserData, adminUserId: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { specializations: true, department: true },
  })
  if (!user) throw Errors.notFound('User')

  const updated = await prisma.$transaction(async (tx) => {
    if (data.specializationIds) {
      await tx.userSpecialization.deleteMany({ where: { userId: id } })
      if (data.specializationIds.length > 0) {
        await tx.userSpecialization.createMany({
          data: data.specializationIds.map((specializationId) => ({ userId: id, specializationId })),
          skipDuplicates: true,
        })
      }
    }

    const result = await tx.user.update({
      where: { id },
      data: {
        name: data.name,
        role: data.role,
        isActive: data.isActive,
        phone: data.phone === undefined ? undefined : data.phone || null,
        departmentId: data.departmentId === undefined ? undefined : data.departmentId,
      },
      select: SAFE_USER_SELECT,
    })

    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'USER_UPDATED',
        entityType: 'User',
        entityId: user.id,
        previousValue: user,
        newValue: result,
        details: {
          before: user,
          after: result,
          changedFields: Object.keys(data),
        },
      },
    })

    return result
  })

  log.info('User updated', { id })
  return updated
}

// ─── Soft Delete ───────────────────────────────────────
export async function softDeleteUser(id: string, adminUserId: string) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw Errors.notFound('User')

  const deleted = await prisma.$transaction(async (tx) => {
    const result = await tx.user.update({
      where: { id },
      data: { isActive: false },
      select: SAFE_USER_SELECT,
    })

    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'USER_DELETED',
        entityType: 'User',
        entityId: user.id,
        previousValue: user,
        newValue: result,
        details: {
          before: user,
          after: result,
          changedFields: ['isActive'],
        },
      },
    })

    return result
  })

  log.info('User soft-deleted', { id })
  return deleted
}
