// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth'
import { createLogger } from '@/backend/utils/logger'

const log = createLogger('API:auth/logout')

export async function POST(req: NextRequest) {
  try {
    await clearAuthCookie()
    return NextResponse.json({ message: 'Logged out successfully' }, { status: 200 })
  } catch (error) {
    log.error('POST /api/auth/logout failed', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
