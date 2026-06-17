// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookie, authorize } from '@/lib/auth'
import { createLogger } from '@/backend/utils/logger'
import { prisma } from '@/lib/prisma'


const log = createLogger('API:auth/logout')

export async function POST(req: NextRequest) {
  try {
    const { user: authUser, errorResponse } = await authorize()
    if (errorResponse) return errorResponse

    const ip = req.headers.get('x-forwarded-for') || 'unknown'

    await prisma.auditLog.create({
      data: {
        userId: authUser!.userId,
        action: 'LOGOUT',
        entityType: 'Auth',
        entityId: authUser!.userId,
        newValue: { userId: authUser!.userId, role: authUser!.role },
        details: { ip },
      },
    })

    await clearAuthCookie()
    return NextResponse.json({ data: null, message: 'Logged out successfully' }, { status: 200 })
  } catch (error) {

    log.error('POST /api/auth/logout failed', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
