import { NextRequest, NextResponse } from 'next/server'
import { authorize } from '@/lib/auth'
import { ApiError } from '@/backend/utils/errors'
import { createLogger } from '@/backend/utils/logger'
import * as notificationService from '@/backend/services/notification.service'

const log = createLogger('API:notifications')

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = await authorize()
    if (errorResponse) return errorResponse

    const unreadOnly = new URL(req.url).searchParams.get('unreadOnly') === 'true'
    const notifications = await notificationService.listNotifications(user!.userId, unreadOnly)
    return NextResponse.json({ data: notifications }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json(error.toJSON(), { status: error.statusCode })
    log.error('GET /api/notifications failed', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 })
  }
}
