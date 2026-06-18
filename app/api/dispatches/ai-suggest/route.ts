// app/api/dispatches/ai-suggest/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { AISuggestSchema } from '@/lib/validations'
import { authorize } from '@/lib/auth'
import { createLogger } from '@/backend/utils/logger'
import { ApiError } from '@/backend/utils/errors'
import * as nurseService from '@/backend/services/nurse.service'

const log = createLogger('API:dispatches/ai-suggest')

export async function POST(req: NextRequest) {
  try {
    const { user: authUser, errorResponse } = await authorize(['ADMIN', 'DISPATCHER'])
    if (errorResponse) return errorResponse

    const body = await req.json()
    const validated = AISuggestSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details: validated.error.issues } },
        { status: 422 }
      )
    }

    const suggestions = await nurseService.suggestNurses(validated.data)
    return NextResponse.json({ data: suggestions }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    log.error('POST /api/dispatches/ai-suggest failed', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
