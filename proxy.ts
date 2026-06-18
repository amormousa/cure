import { NextRequest, NextResponse } from 'next/server'

const publicRoutes = ['/login', '/api/auth']

const roleAccessMap: Record<string, string[]> = {
  '/admin': ['ADMIN'],
  '/analytics': ['ADMIN'],
  '/operations': ['ADMIN', 'DISPATCHER'],
}

type MiddlewareToken = {
  userId: string
  role: 'ADMIN' | 'NURSE' | 'DISPATCHER'
  exp?: number
}

function base64UrlDecodeToString(input: string): string {
  // JWT payload is base64url (RFC 4648 §5)
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  // atob is supported in Edge runtime; we avoid Node crypto / jsonwebtoken
  return atob(normalized + pad)
}

function decodeToken(token: string): MiddlewareToken | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null

    const payloadJson = base64UrlDecodeToString(parts[1])
    const decoded = JSON.parse(payloadJson) as MiddlewareToken

    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null
    if (!decoded.userId || !decoded.role) return null

    return decoded
  } catch {
    return null
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isApiRoute = pathname.startsWith('/api/')

  // Allow public routes
  if (pathname === '/' || publicRoutes.some((route) => pathname.startsWith(route))) {
    // Redirect authenticated users away from login
    if (pathname.startsWith('/login')) {
      const token = request.cookies.get('auth-token')?.value
      if (token) {
        const decoded = decodeToken(token)
        if (decoded) {
          const fallback =
            decoded.role === 'DISPATCHER'
              ? '/operations/kanban'
              : decoded.role === 'ADMIN'
                ? '/admin/nurses'
                : '/'

          return NextResponse.redirect(new URL(fallback, request.url))
        }
      }
    }
    return NextResponse.next()
  }

  // Check authentication for non-public routes
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    if (isApiRoute) return NextResponse.next()
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const decoded = decodeToken(token)
  if (!decoded) {
    if (isApiRoute) return NextResponse.next()
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isApiRoute) return NextResponse.next()

  // Check authorization based on roleAccessMap
  for (const [route, allowedRoles] of Object.entries(roleAccessMap)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(decoded.role)) {
        const fallback = decoded.role === 'DISPATCHER' ? '/operations/kanban' : '/'
        return NextResponse.redirect(new URL(fallback, request.url))
      }
      break
    }
  }

  return NextResponse.next({
    request: {
      headers: (() => {
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('x-user-id', decoded.userId)
        requestHeaders.set('x-user-role', decoded.role)
        return requestHeaders
      })(),
    },
  })
}

