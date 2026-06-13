// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateUserSchema, UpdateUserSchema } from '@/lib/validations'
import { getAuthUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only return nurses if requestor is not admin
    const where = authUser.role !== 'ADMIN' ? { role: 'NURSE' } : {}

    const users = await prisma.user.findMany({
      where,
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
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: users }, { status: 200 })
  } catch (error) {
    console.error('[GET /api/users]', error)
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
    const validated = CreateUserSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.issues },
        { status: 422 }
      )
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: validated.data.email },
    })

    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.data.password, 10)

    const user = await prisma.user.create({
      data: {
        email: validated.data.email,
        name: validated.data.name,
        password: hashedPassword,
        role: validated.data.role,
        phone: validated.data.phone || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        phone: true,
        createdAt: true,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: authUser.userId,
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: user.id,
        details: { email: user.email, name: user.name, role: user.role },
      },
    })

    return NextResponse.json(
      { data: user, message: 'User created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/users]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Users can only update themselves unless they're admin
    if (authUser.userId !== userId && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const validated = UpdateUserSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.issues },
        { status: 422 }
      )
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: validated.data.name,
        role: validated.data.role,
        isActive: validated.data.isActive,
        phone: validated.data.phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        phone: true,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: authUser.userId,
        action: 'USER_UPDATED',
        entityType: 'User',
        entityId: userId,
        details: validated.data,
      },
    })

    return NextResponse.json({ data: user, message: 'User updated' }, { status: 200 })
  } catch (error) {
    console.error('[PATCH /api/users]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
