// lib/auth.ts
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production'
const JWT_EXPIRY = '7d'

export interface JWTPayload {
  userId: string
  email: string
  role: 'ADMIN' | 'NURSE' | 'DISPATCHER'
  iat?: number
  exp?: number
}

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export async function getTokenFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    return token || null
  } catch (error) {
    return null
  }
}

export async function getAuthUser(): Promise<JWTPayload | null> {
  try {
    const token = await getTokenFromCookies()
    if (!token) return null
    return verifyToken(token)
  } catch (error) {
    return null
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
  } catch (error) {
    console.error('Failed to set auth cookie:', error)
  }
}

export async function clearAuthCookie(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('auth-token')
  } catch (error) {
    console.error('Failed to clear auth cookie:', error)
  }
}

export async function authorize(allowedRoles?: ('ADMIN' | 'NURSE' | 'DISPATCHER')[]) {
  const user = await getAuthUser()
  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      ),
    }
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      user,
      errorResponse: NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You do not have permission to access this resource' } },
        { status: 403 }
      ),
    }
  }

  return { user, errorResponse: null }
}

