// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './app/lib/auth'

const publicRoutes = ['/login', '/']
const adminOnlyRoutes = ['/admin', '/admin/users']
const protectedRoutes = ['/dashboard']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    // Redirect authenticated users away from login
    if (pathname === '/login') {
      const token = request.cookies.get('auth-token')?.value
      if (token && verifyToken(token)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
    return NextResponse.next()
  }

  // Check authentication
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check authorization for admin routes
  if (adminOnlyRoutes.some((route) => pathname.startsWith(route))) {
    if (decoded.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Add user info to headers for API routes
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', decoded.userId)
  requestHeaders.set('x-user-role', decoded.role)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
