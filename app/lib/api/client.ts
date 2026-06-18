import { z } from 'zod'
import { ApiErrorSchema } from './schemas'

// ============= TYPES =============

export interface ApiResponse<T> {
  ok: boolean
  data: T | null
  error: { code: string; message: string; details?: unknown } | null
  status: number
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'
  body?: unknown
  headers?: Record<string, string>
  cache?: boolean
  revalidate?: number
}

// ============= CONFIG =============

const DEFAULT_TIMEOUT = 30000
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

const log = {
  debug: (message: string, data?: unknown) => {
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.debug(message, data)
  },
  warn: (message: string, data?: unknown) => console.warn(message, data),
  error: (message: string, data?: unknown) => console.error(message, data),
}

// ============= REQUEST/RESPONSE LOGGING =============

interface RequestContext {
  method: string
  endpoint: string
  timestamp: number
}

function logRequest(method: string, endpoint: string) {
  const context: RequestContext = {
    method,
    endpoint,
    timestamp: Date.now(),
  }
  log.debug(`[${method}] ${endpoint}`)
  return context
}

function logResponse(context: RequestContext, response: Response, duration: number) {
  const status = response.ok ? '✓' : '✗'
  log.debug(`[${context.method}] ${context.endpoint} ${response.status} ${duration}ms ${status}`)
}

// ============= MAIN API CLIENT =============

export async function apiCall<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body,
    headers = {},
    cache = true,
  } = options

  const url = `${BASE_URL}${endpoint}`
  const context = logRequest(method, endpoint)
  const startTime = Date.now()

  try {
    // Create fetch request
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      credentials: 'same-origin',
    }

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body)
    }

    // For caching: only GET requests with cache enabled
    if (cache && method === 'GET') {
      fetchOptions.cache = 'default'
    } else {
      fetchOptions.cache = 'no-cache'
    }

    // Make request with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT)
    fetchOptions.signal = controller.signal

    let response: Response
    try {
      response = await fetch(url, fetchOptions)
    } finally {
      clearTimeout(timeoutId)
    }

    const duration = Date.now() - startTime
    logResponse(context, response, duration)

    // Parse response text
    const text = await response.text()
    let json: unknown

    if (!text) {
      json = {}
    } else {
      try {
        json = JSON.parse(text)
      } catch (parseError) {
        log.error(`JSON parse error for ${endpoint}:`, { error: parseError })
        return {
          ok: false,
          data: null,
          error: {
            code: 'PARSE_ERROR',
            message: 'Failed to parse server response. Please try again.',
          },
          status: response.status,
        }
      }
    }

    // Handle error responses
    if (!response.ok) {
      const errorSchema = ApiErrorSchema.safeParse(json)
      const error = errorSchema.success
        ? errorSchema.data.error
        : { code: 'UNKNOWN_ERROR', message: 'An error occurred. Please try again.' }

      log.warn(`API error for ${endpoint}:`, { status: response.status, error })

      return {
        ok: false,
        data: null,
        error,
        status: response.status,
      }
    }

    // Validate response with schema
    const validation = schema.safeParse(json)
    if (!validation.success) {
      log.error(`Response validation failed for ${endpoint}:`, {
        errors: validation.error.flatten(),
        received: json,
      })
      return {
        ok: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid response from server. Please refresh and try again.',
          details: validation.error.flatten(),
        },
        status: response.status,
      }
    }

    return {
      ok: true,
      data: validation.data,
      error: null,
      status: response.status,
    }
  } catch (error) {
    const duration = Date.now() - startTime

    if (error instanceof Error && error.name === 'AbortError') {
      log.warn(`Request timeout for ${endpoint} (${duration}ms)`)
      return {
        ok: false,
        data: null,
        error: {
          code: 'TIMEOUT',
          message: 'Request timed out. Please check your connection and try again.',
        },
        status: 408,
      }
    }

    if (error instanceof Error) {
      log.error(`Request failed for ${endpoint}:`, { error: error.message })
      return {
        ok: false,
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error. Please check your connection.',
        },
        status: 0,
      }
    }

    log.error(`Unknown error for ${endpoint}:`, { error })
    return {
      ok: false,
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred. Please try again.',
      },
      status: 0,
    }
  }
}

// ============= HELPER FUNCTIONS =============

export function getErrorMessage(error: ApiResponse<unknown>['error']): string {
  if (!error) return 'An error occurred. Please try again.'

  // Common error codes with user-friendly messages
  const errorMessages: Record<string, string> = {
    VALIDATION_FAILED: 'Please check your input and try again.',
    INVALID_CREDENTIALS: 'Invalid email or password.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    CONFLICT: 'This resource already exists.',
    PARSE_ERROR: 'An error occurred while processing the response.',
    TIMEOUT: 'Request timed out. Please try again.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
  }

  return errorMessages[error.code] || error.message || 'An error occurred. Please try again.'
}

export function isNetworkError(error: ApiResponse<unknown>['error']): boolean {
  if (!error) return false
  return ['NETWORK_ERROR', 'TIMEOUT', 'PARSE_ERROR'].includes(error.code)
}

export function is401Error(status: number): boolean {
  return status === 401
}

export function is403Error(status: number): boolean {
  return status === 403
}
