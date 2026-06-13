// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateUserSchema } from '@/lib/validations'
import { getAuthUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admins can see all users; nurses/others can only see active nurses
    const where = authUser.role === 'ADMIN' ? {} : { role: 'NURSE' as const, isActive: true }

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
    const validated = CreateUserSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.issues },
        { status: 422 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.data.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.data.password, 10)
    
    // Generate avatar seed based on name
    const seedName = encodeURIComponent(validated.data.name)
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seedName}`

    const user = await prisma.user.create({
      data: {
        email: validated.data.email,
        name: validated.data.name,
        password: hashedPassword,
        role: validated.data.role,
        phone: validated.data.phone || null,
        avatar: avatar,
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
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: user.id,
        details: {
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    })

    return NextResponse.json(
      { data: user, message: 'User created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/users]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
