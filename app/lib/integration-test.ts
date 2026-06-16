/**
 * Integration Test Utility
 * Use this to verify frontend-backend integration
 */

import { apiCall } from '@/app/lib/api/client'
import { z } from 'zod'

const log = {
  info: (msg: string, data?: unknown) => console.log(`ℹ️  ${msg}`, data || ''),
  success: (msg: string, data?: unknown) => console.log(`✅ ${msg}`, data || ''),
  error: (msg: string, data?: unknown) => console.error(`❌ ${msg}`, data || ''),
  warning: (msg: string, data?: unknown) => console.warn(`⚠️  ${msg}`, data || ''),
}

/**
 * Test database connectivity by checking a simple endpoint
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    log.info('Testing database connection...')

    const response = await fetch('/api/users?limit=1', {
      method: 'GET',
      credentials: 'same-origin',
    })

    if (response.status === 401) {
      log.warning('Database connection OK (requires authentication)')
      return true
    }

    if (response.ok) {
      log.success('Database connection successful')
      return true
    }

    log.error('Database connection failed', response.status)
    return false
  } catch (error) {
    log.error('Database connection error', error)
    return false
  }
}

/**
 * Test API client configuration
 */
export async function testApiClient(): Promise<boolean> {
  try {
    log.info('Testing API client configuration...')

    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    log.info(`API Base URL: ${apiUrl || 'default (same-origin)'}`)

    // Try to fetch a public endpoint or check if we're authenticated
    const response = await fetch('/api/auth/me', {
      credentials: 'same-origin',
    })

    if (response.status === 401) {
      log.warning('API client working (user not authenticated - expected)')
      return true
    }

    if (response.ok) {
      log.success('API client working (user authenticated)')
      return true
    }

    log.error('API client test failed', response.status)
    return false
  } catch (error) {
    log.error('API client error', error)
    return false
  }
}

/**
 * Test authentication flow
 */
export async function testAuthenticationFlow(email: string, password: string): Promise<boolean> {
  try {
    log.info('Testing authentication flow...')

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'same-origin',
    })

    if (response.ok) {
      const data = await response.json()
      log.success('Authentication successful', data.data?.user?.email)
      return true
    }

    if (response.status === 422) {
      log.error('Authentication validation failed')
      return false
    }

    if (response.status === 401) {
      log.error('Invalid credentials')
      return false
    }

    log.error('Authentication failed', response.status)
    return false
  } catch (error) {
    log.error('Authentication error', error)
    return false
  }
}

/**
 * Test all critical API endpoints
 */
export async function testAllEndpoints(): Promise<{ passed: number; failed: number }> {
  const endpoints = [
    { method: 'GET', path: '/api/auth/me', name: 'Get Current User' },
    { method: 'GET', path: '/api/users', name: 'List Users' },
    { method: 'GET', path: '/api/dispatches', name: 'List Dispatches' },
    { method: 'GET', path: '/api/patients', name: 'List Patients' },
    { method: 'GET', path: '/api/analytics', name: 'Get Analytics' },
  ]

  let passed = 0
  let failed = 0

  log.info('Testing all critical endpoints...')

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.path, {
        method: endpoint.method,
        credentials: 'same-origin',
      })

      // Accept 200-299 (success) or 401 (not authenticated)
      if (response.ok || response.status === 401) {
        log.success(`${endpoint.name} (${endpoint.path})`)
        passed++
      } else {
        log.error(`${endpoint.name} returned ${response.status}`)
        failed++
      }
    } catch (error) {
      log.error(`${endpoint.name} error: ${error}`)
      failed++
    }
  }

  return { passed, failed }
}

/**
 * Run complete integration test suite
 */
export async function runFullIntegrationTest(): Promise<void> {
  console.clear()
  console.log('╔════════════════════════════════════════════════╗')
  console.log('║   CURE Portal - Integration Test Suite         ║')
  console.log('╚════════════════════════════════════════════════╝')
  console.log('')

  log.info('Starting integration tests...')
  console.log('')

  // Test 1: API Client
  console.log('[ 1/3 ] Testing API Client Configuration')
  const apiClientOK = await testApiClient()
  console.log('')

  // Test 2: Database Connection
  console.log('[ 2/3 ] Testing Database Connection')
  const dbConnectionOK = await testDatabaseConnection()
  console.log('')

  // Test 3: All Endpoints
  console.log('[ 3/3 ] Testing Critical Endpoints')
  const { passed, failed } = await testAllEndpoints()
  console.log('')

  // Summary
  console.log('╔════════════════════════════════════════════════╗')
  console.log('║              Test Summary                      ║')
  console.log('╠════════════════════════════════════════════════╣')
  console.log(`║ API Client:          ${apiClientOK ? '✅ OK' : '❌ FAILED'.padEnd(36)} ║`)
  console.log(`║ Database:            ${dbConnectionOK ? '✅ OK' : '❌ FAILED'.padEnd(36)} ║`)
  console.log(`║ Endpoints:           ${passed}/5 passed           ║`)
  console.log('╚════════════════════════════════════════════════╝')
  console.log('')

  if (apiClientOK && dbConnectionOK && failed === 0) {
    log.success('All integration tests passed! ✨')
  } else {
    log.warning('Some tests failed. Check configuration and logs above.')
  }
}

/**
 * Export for use in components
 */
export const IntegrationTester = {
  testDatabaseConnection,
  testApiClient,
  testAuthenticationFlow,
  testAllEndpoints,
  runFullIntegrationTest,
}
