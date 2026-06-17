import { NextRequest, NextResponse } from 'next/server'
import { CreateSpecializationSchema } from '@/lib/validations'
import { authorize } from '@/lib/auth'
import { ApiError } from '@/backend/utils/errors'
import { createLogger } from '@/backend/utils/logger'
import * as entityService from '@/backend/services/admin-entity.service'

const log = createLogger('API:specializations')

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await authorize()
    if (errorResponse) return errorResponse

    const includeInactive = new URL(req.url).searchParams.get('includeInactive') !== 'false'
    const specializations = await entityService.listEntities('Specialization', includeInactive)
    return NextResponse.json({ data: specializations }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json(error.toJSON(), { status: error.statusCode })
    log.error('GET /api/specializations failed', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = await authorize(['ADMIN'])
    if (errorResponse) return errorResponse

    const validated = CreateSpecializationSchema.safeParse(await req.json())
    if (!validated.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details: validated.error.issues } },
        { status: 422 },
      )
    }

    const specialization = await entityService.createEntity('Specialization', validated.data, user!.userId)
    return NextResponse.json({ data: specialization, message: 'Specialization created' }, { status: 201 })
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json(error.toJSON(), { status: error.statusCode })
    log.error('POST /api/specializations failed', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 })
  }
}
