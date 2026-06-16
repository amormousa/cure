// backend/utils/errors.ts
// Standardised API error class and helper.

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
    }
  }
}

// Pre-built factory helpers
export const Errors = {
  unauthorized: (msg = 'Authentication required') =>
    new ApiError('UNAUTHORIZED', msg, 401),

  forbidden: (msg = 'You do not have permission to access this resource') =>
    new ApiError('FORBIDDEN', msg, 403),

  notFound: (entity: string) =>
    new ApiError('NOT_FOUND', `${entity} not found`, 404),

  conflict: (msg: string) =>
    new ApiError('CONFLICT', msg, 409),

  validation: (details: unknown) =>
    new ApiError('VALIDATION_FAILED', 'Validation failed', 422, details),

  internal: (msg = 'Internal server error') =>
    new ApiError('INTERNAL_ERROR', msg, 500),

  tooMany: (msg = 'Too many requests. Please try again later.') =>
    new ApiError('TOO_MANY_REQUESTS', msg, 429),
}
