// app/api/patients/[id]/route.ts
// Thin controller — delegates to patient service.
import { NextRequest, NextResponse } from 'next/server'
import { UpdatePatientSchema } from '@/lib/validations'
import { authorize } from '@/lib/auth'
import { createLogger } from '@/backend/utils/logger'
import { ApiError } from '@/backend/utils/errors'
import * as patientService from '@/backend/services/patient.service'

const log = createLogger('API:patients/:id')

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await authorize()
    if (errorResponse) return errorResponse

    const { id } = await context.params
    const patient = await patientService.getPatientById(id)
    return NextResponse.json({ data: patient }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    log.error('GET /api/patients/:id failed', error)
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
    const validated = UpdatePatientSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details: validated.error.issues } },
        { status: 422 },
      )
    }

    const patient = await patientService.updatePatient(id, validated.data, authUser!.userId)
    return NextResponse.json({ data: patient, message: 'Patient updated' }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    log.error('PATCH /api/patients/:id failed', error)
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
    const deleted = await patientService.deletePatient(id, authUser!.userId)
    return NextResponse.json({ data: deleted, message: 'Patient deleted' }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    log.error('DELETE /api/patients/:id failed', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 },
    )
  }
}
