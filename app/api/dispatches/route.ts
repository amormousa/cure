// app/api/dispatches/route.ts
// Thin controller — delegates to dispatch service.
import { NextRequest, NextResponse } from 'next/server'
import { CreateDispatchSchema } from '@/lib/validations'
import { authorize } from '@/lib/auth'
import { createLogger } from '@/backend/utils/logger'
import { ApiError } from '@/backend/utils/errors'
import * as dispatchService from '@/backend/services/dispatch.service'

const log = createLogger('API:dispatches')

export async function GET(req: NextRequest) {
  try {
    const { user: authUser, errorResponse } = await authorize()
    if (errorResponse) return errorResponse

    const { searchParams } = new URL(req.url)
    const result = await dispatchService.listDispatches({
      status: searchParams.get('status'),
      priority: searchParams.get('priority'),
      nurseId: searchParams.get('nurseId'),
      search: searchParams.get('search'),
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 1000,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    log.error('GET /api/dispatches failed', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user: authUser, errorResponse } = await authorize(['ADMIN'])
    if (errorResponse) return errorResponse

    const body = await req.json()
    const validated = CreateDispatchSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details: validated.error.issues } },
        { status: 422 },
      )
    }

    const dispatch = await dispatchService.createDispatch(validated.data, authUser!.userId)
    return NextResponse.json({ data: dispatch, message: 'Dispatch created' }, { status: 201 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    log.error('POST /api/dispatches failed', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 },
    )
  }
}
