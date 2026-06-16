// Test file to validate login response schema
// Run with: npm run test:integration

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { LoginResponseSchema, UserSchema } from '@/lib/api/schemas'

describe('Auth Login Response Validation', () => {
  it('should validate login response with all required fields', () => {
    const validResponse = {
      data: {
        user: {
          id: '123',
          email: 'dispatcher@cure.com',
          name: 'Operations Dispatcher',
          role: 'DISPATCHER',
          isActive: true,
          isOnline: true,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dispatcher',
          phone: '+201001234568',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      message: 'Login successful',
    }

    const result = LoginResponseSchema.safeParse(validResponse)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.data.user.email).toBe('dispatcher@cure.com')
      expect(result.data.data.user.role).toBe('DISPATCHER')
    }
  })

  it('should fail validation without required createdAt field', () => {
    const invalidResponse = {
      data: {
        user: {
          id: '123',
          email: 'dispatcher@cure.com',
          name: 'Operations Dispatcher',
          role: 'DISPATCHER',
          isActive: true,
          isOnline: true,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dispatcher',
          phone: '+201001234568',
          // Missing createdAt!
        },
      },
      message: 'Login successful',
    }

    const result = LoginResponseSchema.safeParse(invalidResponse)
    expect(result.success).toBe(false)
  })

  it('should validate optional updatedAt field', () => {
    const responseWithoutUpdatedAt = {
      data: {
        user: {
          id: '123',
          email: 'dispatcher@cure.com',
          name: 'Operations Dispatcher',
          role: 'DISPATCHER',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dispatcher',
          phone: '+201001234568',
          createdAt: new Date().toISOString(),
          // updatedAt is optional
        },
      },
    }

    const result = LoginResponseSchema.safeParse(responseWithoutUpdatedAt)
    expect(result.success).toBe(true)
  })
})
