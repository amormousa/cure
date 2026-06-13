import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    await clearAuthCookie()
    return NextResponse.json({ message: 'Logged out successfully' }, { status: 200 })
  } catch (error) {
    console.error('[POST /api/auth/logout]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
