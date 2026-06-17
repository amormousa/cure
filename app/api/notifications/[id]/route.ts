import { NextRequest, NextResponse } from 'next/server'
import { authorize } from '@/lib/auth'
import { ApiError } from '@/backend/utils/errors'
import { createLogger } from '@/backend/utils/logger'
import * as notificationService from '@/backend/services/notification.service'

const log = createLogger('API:notifications/:id')

export async function PATCH(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, errorResponse } = await authorize()
    if (errorResponse) return errorResponse

    const { id } = await context.params
    const notification = await notificationService.markNotificationRead(id, user!.userId)
    return NextResponse.json({ data: notification, message: 'Notification marked as read' }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json(error.toJSON(), { status: error.statusCode })
    log.error('PATCH /api/notifications/:id failed', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, errorResponse } = await authorize()
    if (errorResponse) return errorResponse

    const { id } = await context.params
    const notification = await notificationService.deleteNotification(id, user!.userId)
    return NextResponse.json({ data: notification, message: 'Notification deleted' }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json(error.toJSON(), { status: error.statusCode })
    log.error('DELETE /api/notifications/:id failed', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 })
  }
}
