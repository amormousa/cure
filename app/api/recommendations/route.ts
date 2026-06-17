import { NextResponse } from 'next/server'
import { authorize } from '@/lib/auth'
import { ApiError } from '@/backend/utils/errors'
import { createLogger } from '@/backend/utils/logger'
import { generateOptimizationRecommendations } from '@/backend/services/advanced-data.service'

const log = createLogger('API:recommendations')

export async function GET() {
  try {
    const { errorResponse } = await authorize(['ADMIN', 'DISPATCHER'])
    if (errorResponse) return errorResponse

    const data = await generateOptimizationRecommendations()
    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json(error.toJSON(), { status: error.statusCode })
    log.error('GET /api/recommendations failed', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 })
  }
}
