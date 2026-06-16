/**
 * Configuration Validator
 * Use this utility to verify all frontend-backend integration settings
 * 
 * Usage in component:
 * import { validateConfig } from '@/app/lib/config-validator'
 * const result = await validateConfig()
 */

import { createLogger } from '@/backend/utils/logger'

const log = createLogger('ConfigValidator')

// ============= TYPES =============

export interface ValidationResult {
  name: string
  status: 'ok' | 'warning' | 'error'
  message: string
  details?: string
}

export interface ValidationReport {
  timestamp: Date
  results: ValidationResult[]
  summary: {
    total: number
    passed: number
    warnings: number
    errors: number
  }
}

// ============= VALIDATORS =============

/**
 * Check environment variables
 */
function validateEnvironment(): ValidationResult[] {
  const results: ValidationResult[] = []

  // Check API URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (apiUrl) {
    results.push({
      name: 'API Base URL',
      status: 'ok',
      message: `Configured: ${apiUrl}`,
    })
  } else {
    results.push({
      name: 'API Base URL',
      status: 'warning',
      message: 'Not set - using same-origin',
      details: 'Add NEXT_PUBLIC_API_URL to .env.local for explicit configuration',
    })
  }

  // Check Socket URL
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL
  if (socketUrl) {
    results.push({
      name: 'Socket.IO URL',
      status: 'ok',
      message: `Configured: ${socketUrl}`,
    })
  } else {
    results.push({
      name: 'Socket.IO URL',
      status: 'warning',
      message: 'Not configured',
      details: 'Socket.IO features may not work. Set NEXT_PUBLIC_SOCKET_URL in .env.local',
    })
  }

  // Check environment
  const nodeEnv = process.env.NODE_ENV
  results.push({
    name: 'Node Environment',
    status: 'ok',
    message: `${nodeEnv || 'development'}`,
  })

  return results
}

/**
 * Check database connection
 */
async function validateDatabase(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = []

  try {
    // Try to fetch from a simple endpoint that requires DB access
    const response = await fetch('/api/users?limit=1', {
      method: 'GET',
      credentials: 'same-origin',
    })

    if (response.ok) {
      results.push({
        name: 'Database Connection',
        status: 'ok',
        message: 'Database is accessible and responding',
      })
    } else if (response.status === 401) {
      results.push({
        name: 'Database Connection',
        status: 'ok',
        message: 'Database accessible (authentication required)',
        details: 'You are not logged in - login to verify full access',
      })
    } else {
      results.push({
        name: 'Database Connection',
        status: 'error',
        message: `Database returned HTTP ${response.status}`,
        details: 'Check if PostgreSQL is running and DATABASE_URL is correct',
      })
    }
  } catch (error) {
    results.push({
      name: 'Database Connection',
      status: 'error',
      message: 'Cannot connect to database',
      details: error instanceof Error ? error.message : String(error),
    })
  }

  return results
}

/**
 * Check API routes
 */
async function validateApiRoutes(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = []

  const routesToCheck = [
    { path: '/api/auth/me', name: 'Authentication API' },
    { path: '/api/users', name: 'Users API' },
    { path: '/api/dispatches', name: 'Dispatches API' },
    { path: '/api/patients', name: 'Patients API' },
    { path: '/api/analytics', name: 'Analytics API' },
  ]

  for (const route of routesToCheck) {
    try {
      const response = await fetch(route.path, {
        method: 'GET',
        credentials: 'same-origin',
      })

      // Accept 2xx or 401 (not authenticated)
      if (response.ok || response.status === 401) {
        results.push({
          name: route.name,
          status: 'ok',
          message: `${route.path} - responding (HTTP ${response.status})`,
        })
      } else if (response.status === 404) {
        results.push({
          name: route.name,
          status: 'error',
          message: `${route.path} - not found (404)`,
          details: 'API route may not be implemented',
        })
      } else {
        results.push({
          name: route.name,
          status: 'warning',
          message: `${route.path} - HTTP ${response.status}`,
          details: 'Check server logs for errors',
        })
      }
    } catch (error) {
      results.push({
        name: route.name,
        status: 'error',
        message: `${route.path} - connection failed`,
        details: error instanceof Error ? error.message : 'Network error',
      })
    }
  }

  return results
}

/**
 * Check authentication
 */
async function validateAuthentication(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = []

  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'same-origin',
    })

    if (response.ok) {
      const data = await response.json()
      results.push({
        name: 'Authentication Status',
        status: 'ok',
        message: 'User is authenticated',
        details: `User: ${data.data?.email || 'unknown'}`,
      })
    } else if (response.status === 401) {
      results.push({
        name: 'Authentication Status',
        status: 'warning',
        message: 'User is not authenticated',
        details: 'Login required to verify authentication system',
      })
    } else {
      results.push({
        name: 'Authentication Status',
        status: 'error',
        message: `Authentication check failed (HTTP ${response.status})`,
      })
    }
  } catch (error) {
    results.push({
      name: 'Authentication Status',
      status: 'error',
      message: 'Cannot verify authentication',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  return results
}

/**
 * Check CORS and headers
 */
async function validateHeaders(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = []

  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'same-origin',
    })

    // Check important headers
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      results.push({
        name: 'Content-Type Header',
        status: 'ok',
        message: 'JSON responses configured correctly',
      })
    } else {
      results.push({
        name: 'Content-Type Header',
        status: 'warning',
        message: `Unexpected content-type: ${contentType}`,
      })
    }

    // Check CORS headers (if applicable)
    const allowOrigin = response.headers.get('access-control-allow-origin')
    results.push({
      name: 'CORS Headers',
      status: 'ok',
      message: allowOrigin ? `Configured for origin: ${allowOrigin}` : 'Same-origin requests',
    })
  } catch (error) {
    results.push({
      name: 'Headers Validation',
      status: 'error',
      message: 'Cannot validate headers',
    })
  }

  return results
}

// ============= MAIN VALIDATOR =============

/**
 * Run complete validation and return report
 */
export async function validateConfig(): Promise<ValidationReport> {
  log.info('Starting configuration validation...')

  const allResults: ValidationResult[] = []

  // Run all validators
  const envResults = validateEnvironment()
  const dbResults = await validateDatabase()
  const apiResults = await validateApiRoutes()
  const authResults = await validateAuthentication()
  const headerResults = await validateHeaders()

  allResults.push(...envResults, ...dbResults, ...apiResults, ...authResults, ...headerResults)

  // Calculate summary
  const summary = {
    total: allResults.length,
    passed: allResults.filter(r => r.status === 'ok').length,
    warnings: allResults.filter(r => r.status === 'warning').length,
    errors: allResults.filter(r => r.status === 'error').length,
  }

  const report: ValidationReport = {
    timestamp: new Date(),
    results: allResults,
    summary,
  }

  // Log summary
  log.info('Validation complete:', {
    passed: summary.passed,
    warnings: summary.warnings,
    errors: summary.errors,
  })

  return report
}

/**
 * Print validation report to console
 */
export function printValidationReport(report: ValidationReport): void {
  console.log('\n╔════════════════════════════════════════════════╗')
  console.log('║   Configuration Validation Report              ║')
  console.log('╚════════════════════════════════════════════════╝\n')

  for (const result of report.results) {
    const icon =
      result.status === 'ok' ? '✅' : result.status === 'warning' ? '⚠️ ' : '❌'
    console.log(`${icon} ${result.name}`)
    console.log(`   ${result.message}`)
    if (result.details) {
      console.log(`   💡 ${result.details}`)
    }
  }

  console.log('\n╔════════════════════════════════════════════════╗')
  console.log(`║ Summary: ${report.summary.passed}/${report.summary.total} checks passed`)
  if (report.summary.warnings > 0) {
    console.log(`║ Warnings: ${report.summary.warnings}`)
  }
  if (report.summary.errors > 0) {
    console.log(`║ Errors: ${report.summary.errors}`)
  }
  console.log('╚════════════════════════════════════════════════╝\n')
}

/**
 * Hook for React components
 */
export function useConfigValidation() {
  const [report, setReport] = React.useState<ValidationReport | null>(null)
  const [loading, setLoading] = React.useState(false)

  const validate = React.useCallback(async () => {
    setLoading(true)
    try {
      const result = await validateConfig()
      setReport(result)
      printValidationReport(result)
    } finally {
      setLoading(false)
    }
  }, [])

  return { report, loading, validate }
}

// Import React for hook (only if using in component)
import React from 'react'
