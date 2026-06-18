// app/api/users/route.ts
// Thin controller — delegates to user service.
import { NextRequest, NextResponse } from 'next/server'
import { CreateUserSchema } from '@/lib/validations'
import { authorize } from '@/lib/auth'
import { createLogger } from '@/backend/utils/logger'
import { ApiError } from '@/backend/utils/errors'
import * as userService from '@/backend/services/user.service'

const log = createLogger('API:users')

export async function GET(req: NextRequest) {
  try {
    const { user: authUser, errorResponse } = await authorize()
    if (errorResponse) return errorResponse

    const { searchParams } = new URL(req.url)
    const roleQuery = searchParams.get('role')
    const search = searchParams.get('search')
    const isActiveParam = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = (searchParams.get('sortBy') as 'name' | 'createdAt' | 'email') || 'name'
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'

    const isActive = isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined

    const result = await userService.listUsers({
      role: roleQuery,
      search: search || undefined,
      isActive,
      page,
      limit,
      sortBy,
      sortOrder,
    }, authUser!.role)

    return NextResponse.json({ data: result.data, pagination: result.pagination }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    log.error('GET /api/users failed', error)
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
    const validated = CreateUserSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details: validated.error.issues } },
        { status: 422 },
      )
    }

    const user = await userService.createUser(validated.data, authUser!.userId)
    return NextResponse.json({ data: user, message: 'User created successfully' }, { status: 201 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    log.error('POST /api/users failed', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 },
    )
  }
}
