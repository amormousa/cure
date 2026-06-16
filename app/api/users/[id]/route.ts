// app/api/users/[id]/route.ts
// Thin controller — delegates to user service.
import { NextRequest, NextResponse } from 'next/server'
import { UpdateUserSchema } from '@/lib/validations'
import { authorize } from '@/lib/auth'
import { createLogger } from '@/backend/utils/logger'
import { ApiError } from '@/backend/utils/errors'
import * as userService from '@/backend/services/user.service'

const log = createLogger('API:users/:id')

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user: authUser, errorResponse } = await authorize()
    if (errorResponse) return errorResponse

    const { id } = await context.params
    const user = await userService.getUserById(id, authUser!.userId, authUser!.role)
    return NextResponse.json({ data: user }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    log.error('GET /api/users/:id failed', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 },
    )
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user: authUser, errorResponse } = await authorize(['ADMIN'])
    if (errorResponse) return errorResponse

    const { id } = await context.params
    const body = await req.json()
    const validated = UpdateUserSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details: validated.error.issues } },
        { status: 422 },
      )
    }

    const updated = await userService.updateUser(id, validated.data, authUser!.userId)
    return NextResponse.json({ data: updated, message: 'User updated successfully' }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    log.error('PATCH /api/users/:id failed', error)
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
    const deleted = await userService.softDeleteUser(id, authUser!.userId)
    return NextResponse.json({ data: deleted, message: 'User soft deleted successfully' }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    log.error('DELETE /api/users/:id failed', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 },
    )
  }
}
