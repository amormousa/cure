// app/api/patients/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreatePatientSchema } from '@/lib/validations'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const patients = await prisma.patient.findMany({
      include: {
        dispatches: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: patients }, { status: 200 })
  } catch (error) {
    console.error('[GET /api/patients]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const validated = CreatePatientSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.issues },
        { status: 422 }
      )
    }

    const patient = await prisma.patient.create({
      data: {
        name: validated.data.name,
        address: validated.data.address,
        phone: validated.data.phone,
        condition: validated.data.condition,
        notes: validated.data.notes || null,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: authUser.userId,
        action: 'PATIENT_CREATED',
        entityType: 'Patient',
        entityId: patient.id,
        details: {
          name: patient.name,
          phone: patient.phone,
          condition: patient.condition,
        },
      },
    })

    return NextResponse.json({ data: patient }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/patients]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
