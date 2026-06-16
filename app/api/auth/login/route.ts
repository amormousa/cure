// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LoginSchema } from '@/lib/validations'
import { signToken } from '@/lib/auth'
import { createLogger } from '@/backend/utils/logger'
import bcrypt from 'bcryptjs'

const log = createLogger('API:auth/login')

const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const LIMIT = 5;
const WINDOW_MS = 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const rateLimit = rateLimitMap.get(ip);
    
    if (rateLimit) {
      if (now - rateLimit.timestamp < WINDOW_MS) {
        if (rateLimit.count >= LIMIT) {
          return NextResponse.json(
            { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests. Please try again later.' } },
            { status: 429 }
          );
        }
        rateLimit.count++;
      } else {
        rateLimitMap.set(ip, { count: 1, timestamp: now });
      }
    } else {
      rateLimitMap.set(ip, { count: 1, timestamp: now });
    }

    const body = await req.json()

    // Validate input
    const validated = LoginSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details: validated.error.issues } },
        { status: 422 }
      )
    }

    const { email, password } = validated.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } },
        { status: 401 }
      )
    }

    // Compare passwords
    const passwordValid = await bcrypt.compare(password, user.password)
    if (!passwordValid) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } },
        { status: 401 }
      )
    }

    // Create JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Set cookie
    const response = NextResponse.json(
      {
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
          },
        },
        message: 'Login successful',
      },
      { status: 200 }
    )

    // Set httpOnly cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    log.error('POST /api/auth/login failed', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
