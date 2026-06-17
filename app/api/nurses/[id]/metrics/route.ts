import { NextRequest, NextResponse } from 'next/server'
import { authorize } from '@/lib/auth'
import { ApiError } from '@/backend/utils/errors'
import { createLogger } from '@/backend/utils/logger'
import { getNursePerformanceMetrics } from '@/backend/services/advanced-data.service'

const log = createLogger('API:nurses/:id/metrics')

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await authorize(['ADMIN', 'DISPATCHER'])
    if (errorResponse) return errorResponse

    const { id } = await context.params
    const days = Math.max(1, parseInt(new URL(req.url).searchParams.get('days') || '30', 10))
    const data = await getNursePerformanceMetrics(id, days)
    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json(error.toJSON(), { status: error.statusCode })
    log.error('GET /api/nurses/:id/metrics failed', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 })
  }
}
