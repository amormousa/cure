// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './app/lib/auth'

const publicRoutes = ['/login', '/api/auth']

const roleAccessMap: Record<string, string[]> = {
  '/admin': ['ADMIN'],
  '/analytics': ['ADMIN'],
  '/operations': ['ADMIN', 'DISPATCHER'],
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (pathname === '/' || publicRoutes.some((route) => pathname.startsWith(route))) {
    // Redirect authenticated users away from login
    if (pathname.startsWith('/login')) {
      const token = request.cookies.get('auth-token')?.value
      if (token) {
        const decoded = verifyToken(token)
        if (decoded) {
          const fallback = decoded.role === 'DISPATCHER' ? '/operations' : (decoded.role === 'ADMIN' ? '/admin' : '/dashboard')
          return NextResponse.redirect(new URL(fallback, request.url))
        }
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

  // Check authorization based on roleAccessMap
  for (const [route, allowedRoles] of Object.entries(roleAccessMap)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(decoded.role)) {
        const fallback = decoded.role === 'DISPATCHER' ? '/operations' : '/dashboard'
        return NextResponse.redirect(new URL(fallback, request.url))
      }
      break;
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
