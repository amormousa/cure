// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { signToken, authorize } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createLogger } from '@/backend/utils/logger'

const log = createLogger('API:auth/refresh')

export async function POST(req: NextRequest) {
  try {
    const { user: authUser, errorResponse } = await authorize()
    if (errorResponse) return errorResponse

    const user = await prisma.user.findUnique({
      where: { id: authUser!.userId }
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'User not found or inactive' } },
        { status: 401 }
      )
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const response = NextResponse.json({ message: 'Token refreshed' })
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    log.error('POST /api/auth/refresh failed', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
