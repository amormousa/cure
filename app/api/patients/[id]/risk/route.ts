import { NextRequest, NextResponse } from 'next/server'
import { authorize } from '@/lib/auth'
import { ApiError, Errors } from '@/backend/utils/errors'
import { createLogger } from '@/backend/utils/logger'
import { assessPatientRisk } from '@/backend/services/advanced-data.service'

const log = createLogger('API:patients/:id/risk')

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await authorize(['ADMIN', 'DISPATCHER'])
    if (errorResponse) return errorResponse

    const { id } = await context.params
    const data = await assessPatientRisk(id)
    if (!data) throw Errors.notFound('Patient')

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json(error.toJSON(), { status: error.statusCode })
    log.error('GET /api/patients/:id/risk failed', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 })
  }
}
