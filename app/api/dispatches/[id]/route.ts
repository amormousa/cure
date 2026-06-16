// app/api/dispatches/[id]/route.ts
// Thin controller — delegates to dispatch service.
import { NextRequest, NextResponse } from 'next/server'
import { UpdateDispatchSchema } from '@/lib/validations'
import { authorize } from '@/lib/auth'
import { createLogger } from '@/backend/utils/logger'
import { ApiError } from '@/backend/utils/errors'
import * as dispatchService from '@/backend/services/dispatch.service'

const log = createLogger('API:dispatches/:id')

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user: authUser, errorResponse } = await authorize()
    if (errorResponse) return errorResponse

    const { id } = await context.params
    const dispatch = await dispatchService.getDispatchById(id)
    return NextResponse.json({ data: dispatch }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    log.error('GET /api/dispatches/:id failed', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 },
    )
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user: authUser, errorResponse } = await authorize()
    if (errorResponse) return errorResponse

    const { id } = await context.params
    const body = await req.json()
    const validated = UpdateDispatchSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details: validated.error.issues } },
        { status: 422 },
      )
    }

    const updated = await dispatchService.updateDispatch(id, validated.data, authUser!.userId)
    return NextResponse.json({ data: updated, message: 'Dispatch updated' }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    log.error('PATCH /api/dispatches/:id failed', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user: authUser, errorResponse } = await authorize(['ADMIN'])
    if (errorResponse) return errorResponse

    const { id } = await context.params
    const cancelled = await dispatchService.cancelDispatch(id, authUser!.userId)
    return NextResponse.json({ data: cancelled, message: 'Dispatch cancelled' }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    log.error('DELETE /api/dispatches/:id failed', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 },
    )
  }
}

export { PATCH as PUT }
