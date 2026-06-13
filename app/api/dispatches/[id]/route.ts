// app/api/dispatches/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UpdateDispatchSchema } from '@/lib/validations'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dispatch = await prisma.dispatch.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
        nurse: { select: { id: true, name: true, avatar: true } },
        auditLogs: true,
      },
    })

    if (!dispatch) {
      return NextResponse.json({ error: 'Dispatch not found' }, { status: 404 })
    }

    return NextResponse.json({ data: dispatch }, { status: 200 })
  } catch (error) {
    console.error('[GET /api/dispatches/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify dispatch exists
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: params.id },
    })

    if (!dispatch) {
      return NextResponse.json({ error: 'Dispatch not found' }, { status: 404 })
    }

    const body = await req.json()
    const validated = UpdateDispatchSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.issues },
        { status: 422 }
      )
    }

    // If nurseId is provided, verify nurse exists
    if (validated.data.nurseId) {
      const nurse = await prisma.user.findUnique({
        where: { id: validated.data.nurseId },
      })
      if (!nurse) {
        return NextResponse.json({ error: 'Nurse not found' }, { status: 404 })
      }
    }

    // Update dispatch
    const updated = await prisma.dispatch.update({
      where: { id: params.id },
      data: {
        status: validated.data.status,
        nurseId: validated.data.nurseId,
        notes: validated.data.notes,
        completedAt: validated.data.completedAt ? new Date(validated.data.completedAt) : undefined,
        updatedAt: new Date(),
      },
      include: {
        patient: true,
        nurse: { select: { id: true, name: true, avatar: true } },
      },
    })

    // Create audit log
    const action = validated.data.status ? 'DISPATCH_STATUS_CHANGED' : 'DISPATCH_UPDATED'
    await prisma.auditLog.create({
      data: {
        userId: authUser.userId,
        action,
        entityType: 'Dispatch',
        entityId: dispatch.id,
        dispatchId: dispatch.id,
        details: {
          before: dispatch,
          after: updated,
          changedFields: Object.keys(validated.data).filter(
            (key) => validated.data[key as keyof typeof validated.data] !== dispatch[key as keyof typeof dispatch]
          ),
        },
      },
    })

    return NextResponse.json({ data: updated, message: 'Dispatch updated' }, { status: 200 })
  } catch (error) {
    console.error('[PATCH /api/dispatches/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const dispatch = await prisma.dispatch.findUnique({
      where: { id: params.id },
    })

    if (!dispatch) {
      return NextResponse.json({ error: 'Dispatch not found' }, { status: 404 })
    }

    // Soft delete by cancelling
    const cancelled = await prisma.dispatch.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' },
      include: {
        patient: true,
        nurse: { select: { id: true, name: true, avatar: true } },
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: authUser.userId,
        action: 'DISPATCH_CANCELLED',
        entityType: 'Dispatch',
        entityId: dispatch.id,
        dispatchId: dispatch.id,
      },
    })

    return NextResponse.json({ data: cancelled, message: 'Dispatch cancelled' }, { status: 200 })
  } catch (error) {
    console.error('[DELETE /api/dispatches/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
