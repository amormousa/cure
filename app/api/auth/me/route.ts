// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authorize } from '@/lib/auth'
import { createLogger } from '@/backend/utils/logger'

const log = createLogger('API:auth/me')

export async function GET(req: NextRequest) {
  try {
    const { user: authUser, errorResponse } = await authorize()
    if (errorResponse) return errorResponse

    const user = await prisma.user.findUnique({
      where: { id: authUser!.userId },
      select: {
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
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'User not found or inactive' } },
        { status: 401 }
      )
    }

    return NextResponse.json({ data: user }, { status: 200 })
  } catch (error) {
    log.error('GET /api/auth/me failed', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
