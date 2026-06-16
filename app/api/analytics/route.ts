// app/api/analytics/route.ts
// Thin controller — delegates to analytics service.
import { NextRequest, NextResponse } from 'next/server'
import { authorize } from '@/lib/auth'
import { createLogger } from '@/backend/utils/logger'
import { ApiError } from '@/backend/utils/errors'
import * as analyticsService from '@/backend/services/analytics.service'

const log = createLogger('API:analytics')

export async function GET(req: NextRequest) {
  try {
    const { user: authUser, errorResponse } = await authorize(['ADMIN', 'DISPATCHER'])
    if (errorResponse) return errorResponse

    const { searchParams } = new URL(req.url)
    const range = searchParams.get('range') || '30d'

    const data = await analyticsService.getAnalytics(range)
    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    log.error('GET /api/analytics failed', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 },
    )
  }
}
