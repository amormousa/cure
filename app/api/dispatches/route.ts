// app/api/dispatches/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateDispatchSchema } from '@/lib/validations'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const nurseId = searchParams.get('nurseId')
    const search = searchParams.get('search')

    // Build filter
    const where: any = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (nurseId) where.nurseId = nurseId
    if (search) {
      where.OR = [
        { patient: { name: { contains: search, mode: 'insensitive' } } },
        { patient: { phone: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const dispatches = await prisma.dispatch.findMany({
      where,
      include: {
        patient: true,
        nurse: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { scheduledFor: 'asc' },
    })

    return NextResponse.json({ data: dispatches }, { status: 200 })
  } catch (error) {
    console.error('[GET /api/dispatches]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const validated = CreateDispatchSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.issues },
        { status: 422 }
      )
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: validated.data.patientId },
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    const dispatch = await prisma.dispatch.create({
      data: {
        patientId: validated.data.patientId,
        priority: validated.data.priority,
        scheduledFor: new Date(validated.data.scheduledFor),
        notes: validated.data.notes,
      },
      include: {
        patient: true,
        nurse: { select: { id: true, name: true, avatar: true } },
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: authUser.userId,
        action: 'DISPATCH_CREATED',
        entityType: 'Dispatch',
        entityId: dispatch.id,
        dispatchId: dispatch.id,
        details: dispatch,
      },
    })

    return NextResponse.json({ data: dispatch, message: 'Dispatch created' }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/dispatches]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
