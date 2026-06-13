// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UpdateUserSchema } from '@/lib/validations'
import { getAuthUser } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await req.json()
    const validated = UpdateUserSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.issues },
        { status: 422 }
      )
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        name: validated.data.name,
        role: validated.data.role,
        isActive: validated.data.isActive,
        phone: validated.data.phone || user.phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isOnline: true,
        avatar: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: authUser.userId,
        action: 'USER_UPDATED',
        entityType: 'User',
        entityId: user.id,
        details: {
          changedFields: Object.keys(validated.data),
        },
      },
    })

    return NextResponse.json(
      { data: updated, message: 'User updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[PATCH /api/users/:id]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
