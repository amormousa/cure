// backend/services/user.service.ts
// Business logic for User CRUD.

import { prisma } from '@/backend/config/prisma'
import { createLogger } from '@/backend/utils/logger'
import { Errors } from '@/backend/utils/errors'
import bcrypt from 'bcryptjs'

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
  createdAt: true,
  updatedAt: true,
} as const

// ─── List ──────────────────────────────────────────────
export async function listUsers(role?: string | null, callerRole?: string) {
  let where: Record<string, unknown> = {}

  if (callerRole === 'ADMIN') {
    if (role) {
      if (!['ADMIN', 'NURSE', 'DISPATCHER'].includes(role)) {
        throw new (Errors.validation as any)('Invalid role filter')
      }
      where.role = role
    }
  } else {
    where = { role: 'NURSE', isActive: true }
    if (role && role !== 'NURSE') {
      throw Errors.forbidden('You do not have permission to view this role')
    }
  }

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
    orderBy: { name: 'asc' },
  })

  log.info('Listed users', { count: users.length, role })
  return users
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
}

export async function createUser(data: CreateUserData, adminUserId: string) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) throw Errors.conflict('User with this email already exists')

  const hashedPassword = await bcrypt.hash(data.password, 10)
  const seedName = encodeURIComponent(data.name)
  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seedName}`

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: hashedPassword,
      role: data.role,
      phone: data.phone || null,
      avatar,
    },
    select: SAFE_USER_SELECT,
  })

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: user.id,
      details: { email: user.email, name: user.name, role: user.role },
    },
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
}

export async function updateUser(id: string, data: UpdateUserData, adminUserId: string) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw Errors.notFound('User')

  const updated = await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      role: data.role,
      isActive: data.isActive,
      phone: data.phone || user.phone,
    },
    select: SAFE_USER_SELECT,
  })

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: user.id,
      details: {
        before: { name: user.name, role: user.role, isActive: user.isActive, phone: user.phone },
        after: { name: updated.name, role: updated.role, isActive: updated.isActive, phone: updated.phone },
        changedFields: Object.keys(data),
      },
    },
  })

  log.info('User updated', { id })
  return updated
}

// ─── Soft Delete ───────────────────────────────────────
export async function softDeleteUser(id: string, adminUserId: string) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw Errors.notFound('User')

  const deleted = await prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: SAFE_USER_SELECT,
  })

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'USER_DELETED',
      entityType: 'User',
      entityId: user.id,
      details: {
        email: user.email,
        name: user.name,
        role: user.role,
        isActiveBefore: user.isActive,
        isActiveAfter: false,
      },
    },
  })

  log.info('User soft-deleted', { id })
  return deleted
}
