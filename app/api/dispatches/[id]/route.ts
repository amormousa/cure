// app/api/dispatches/[id]/route.ts
// Thin controller — delegates to dispatch service.
import { NextRequest, NextResponse } from 'next/server'
import { UpdateDispatchSchema } from '@/lib/validations'
import { authorize } from '@/lib/auth'
import { createLogger } from '@/backend/utils/logger'
import { ApiError } from '@/backend/utils/errors'
import { Prisma } from '@prisma/client'
import * as dispatchService from '@/backend/services/dispatch.service'

const log = createLogger('API:dispatches/:id')

const isDev = process.env.NODE_ENV === 'development'

// ─── Unified error handler ──────────────────────────────────────────
function handleError(error: unknown, contextLabel: string): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(error.toJSON(), { status: error.statusCode })
  }

  const errMsg = error instanceof Error ? error.message : String(error)
  const errStack = error instanceof Error ? error.stack : undefined

  log.error(`${contextLabel} failed`, {
    message: errMsg,
    stack: errStack,
  })

  // Prisma known-request errors — surface the code and message
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return NextResponse.json(
      {
        error: {
          code: 'DATABASE_ERROR',
          message: `Database error [${error.code}]: ${errMsg}`,
          details: isDev ? error.meta : undefined,
        },
      },
      { status: 500 },
    )
  }

  // In development, include the real error message
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: isDev ? errMsg : 'Internal server error',
        ...(isDev && errStack ? { details: { stack: errStack.split('\n').slice(0, 6).join('\n') } } : {}),
      },
    },
    { status: 500 },
  )
}

// ─── Handlers ────────────────────────────────────────────────────────
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user: authUser, errorResponse } = await authorize(['ADMIN'])
    if (errorResponse) return errorResponse

    const { id } = await context.params
    const dispatch = await dispatchService.getDispatchById(id)
    return NextResponse.json({ data: dispatch }, { status: 200 })
  } catch (error) {
    return handleError(error, 'GET /api/dispatches/:id')
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user: authUser, errorResponse } = await authorize(['ADMIN', 'DISPATCHER', 'NURSE'])
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

    const updated = await dispatchService.updateDispatch(
      id,
      validated.data,
      authUser!.userId,
      authUser!.role,
    )
    return NextResponse.json({ data: updated, message: 'Dispatch updated' }, { status: 200 })
  } catch (error) {
    return handleError(error, 'PATCH /api/dispatches/:id')
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
    return handleError(error, 'DELETE /api/dispatches/:id')
  }
}

export { PATCH as PUT }
