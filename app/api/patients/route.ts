// app/api/patients/route.ts
// Thin controller — delegates to patient service.
import { NextRequest, NextResponse } from 'next/server'
import { CreatePatientSchema } from '@/lib/validations'
import { authorize } from '@/lib/auth'
import { createLogger } from '@/backend/utils/logger'
import { ApiError } from '@/backend/utils/errors'
import * as patientService from '@/backend/services/patient.service'

const log = createLogger('API:patients')

export async function GET(req: NextRequest) {
  try {
    const { user: authUser, errorResponse } = await authorize()
    if (errorResponse) return errorResponse

    const patients = await patientService.listPatients()
    return NextResponse.json({ data: patients }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    log.error('GET /api/patients failed', error)
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
    const validated = CreatePatientSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details: validated.error.issues } },
        { status: 422 },
      )
    }

    const patient = await patientService.createPatient(validated.data, authUser!.userId)
    return NextResponse.json({ data: patient }, { status: 201 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    log.error('POST /api/patients failed', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 },
    )
  }
}
