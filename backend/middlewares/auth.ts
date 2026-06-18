// backend/middlewares/auth.ts
// Route-handler friendly auth helpers for the backend layer.

import { NextResponse } from 'next/server'
import { authorize, type JWTPayload } from '@/lib/auth'

export type AuthRole = JWTPayload['role']

export interface AuthContext {
  user: JWTPayload
}

export async function requireAuth(allowedRoles?: AuthRole[]): Promise<
  | { ok: true; context: AuthContext }
  | { ok: false; response: NextResponse }
> {
  const { user, errorResponse } = await authorize(allowedRoles)

  if (errorResponse || !user) {
    return {
      ok: false,
      response:
        errorResponse ??
        NextResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
          { status: 401 },
        ),
    }
  }

  return { ok: true, context: { user } }
}

