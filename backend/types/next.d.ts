// backend/types/next.d.ts
// Shared Next route-handler utility types.

import type { NextRequest } from 'next/server'

export type RouteParams<T extends Record<string, string>> = {
  params: Promise<T>
}

export type ApiRouteHandler<TParams extends Record<string, string> = Record<string, string>> = (
  request: NextRequest,
  context: RouteParams<TParams>,
) => Promise<Response>

