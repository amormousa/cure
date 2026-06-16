// backend/services/auth.service.ts
// Handles all authentication business logic.

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { ApiError } from '@/backend/utils/errors'
import { createLogger } from '@/backend/utils/logger'

const log = createLogger('AuthService')

// ── Types ──────────────────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string
  password: string
}

export interface TokenPayload {
  userId: string
  email: string
  role: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

const USER_PUBLIC_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  isOnline: true,
  avatar: true,
  phone: true,
  createdAt: true,
} as const

// ── Service functions ──────────────────────────────────────────────────────

/**
 * Validate credentials and return a signed JWT + user profile.
 */
export async function login(credentials: LoginCredentials) {
  const { email, password } = credentials

  log.debug('Login attempt', { email })

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  })

  if (!user) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
  }

  if (!user.isActive) {
    throw new ApiError(403, 'ACCOUNT_INACTIVE', 'Your account has been deactivated. Contact an administrator.')
  }

  const passwordMatch = await bcrypt.compare(password, user.password)
  if (!passwordMatch) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  })

  log.info(`User logged in: ${user.id} (${user.role})`)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...safeUser } = user
  return { token, user: safeUser }
}

/**
 * Issue a new token for the authenticated user (token rotation).
 */
export async function refreshToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user || !user.isActive) {
    throw new ApiError(401, 'UNAUTHORIZED', 'User not found or inactive')
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  })

  log.debug(`Token refreshed for user ${userId}`)
  return token
}

/**
 * Get the current authenticated user's profile.
 */
export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_PUBLIC_SELECT,
  })

  if (!user || !user.isActive) {
    throw new ApiError(401, 'UNAUTHORIZED', 'User not found or inactive')
  }

  return user
}
