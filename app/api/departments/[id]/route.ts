import { NextRequest, NextResponse } from 'next/server'
import { UpdateDepartmentSchema } from '@/lib/validations'
import { authorize } from '@/lib/auth'
import { ApiError } from '@/backend/utils/errors'
import { createLogger } from '@/backend/utils/logger'
import * as entityService from '@/backend/services/admin-entity.service'

const log = createLogger('API:departments/:id')

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await authorize()
    if (errorResponse) return errorResponse

    const { id } = await context.params
    const department = await entityService.getEntity('Department', id)
    return NextResponse.json({ data: department }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json(error.toJSON(), { status: error.statusCode })
    log.error('GET /api/departments/:id failed', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, errorResponse } = await authorize(['ADMIN'])
    if (errorResponse) return errorResponse

    const { id } = await context.params
    const validated = UpdateDepartmentSchema.safeParse(await req.json())
    if (!validated.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details: validated.error.issues } },
        { status: 422 },
      )
    }

    const department = await entityService.updateEntity('Department', id, validated.data, user!.userId)
    return NextResponse.json({ data: department, message: 'Department updated' }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json(error.toJSON(), { status: error.statusCode })
    log.error('PATCH /api/departments/:id failed', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, errorResponse } = await authorize(['ADMIN'])
    if (errorResponse) return errorResponse

    const { id } = await context.params
    const department = await entityService.deleteEntity('Department', id, user!.userId)
    return NextResponse.json({ data: department, message: 'Department deleted' }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json(error.toJSON(), { status: error.statusCode })
    log.error('DELETE /api/departments/:id failed', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 })
  }
}
