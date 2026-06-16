import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as loginPost } from '../../app/api/auth/login/route'
import { GET as dispatchesGet, POST as dispatchesPost } from '../../app/api/dispatches/route'
import { GET as dispatchesGetId, PUT as dispatchPut, DELETE as dispatchesDeleteId } from '../../app/api/dispatches/[id]/route'
import { POST as aiSuggestPost } from '../../app/api/dispatches/ai-suggest/route'
import { prisma } from '../../app/lib/prisma'
import { signToken } from '../../app/lib/auth'

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: async () => mockCookieStore,
}))

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/login', () => {
    it('should return 200 and user data for valid credentials', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@cure.com',
          password: 'Admin@123',
        }),
      })

      const response = await loginPost(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.user.email).toBe('admin@cure.com')
      expect(data.data.user.role).toBe('ADMIN')
    })

    it('should return 401 for invalid credentials', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@cure.com',
          password: 'WrongPassword@123',
        }),
      })

      const response = await loginPost(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('GET /api/dispatches', () => {
    it('should return 401 if unauthorized (no token)', async () => {
      mockCookieStore.get.mockReturnValue(undefined)

      const req = new NextRequest('http://localhost:3000/api/dispatches', {
        method: 'GET',
      })

      const response = await dispatchesGet(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })

    it('should return 200 with list of dispatches when authorized', async () => {
      // Find admin user in database to generate real token
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      })
      expect(adminUser).not.toBeNull()

      const token = signToken({
        userId: adminUser!.id,
        email: adminUser!.email,
        role: adminUser!.role,
      })

      mockCookieStore.get.mockReturnValue({ value: token })

      const req = new NextRequest('http://localhost:3000/api/dispatches', {
        method: 'GET',
      })

      const response = await dispatchesGet(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.data)).toBe(true)
    })
  })

  describe('POST and PUT /api/dispatches', () => {
    it('should create a dispatch and then update its status (creating audit log)', async () => {
      // Get admin user and a patient
      const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
      const patient = await prisma.patient.findFirst()

      expect(adminUser).not.toBeNull()
      expect(patient).not.toBeNull()

      const token = signToken({
        userId: adminUser!.id,
        email: adminUser!.email,
        role: adminUser!.role,
      })

      mockCookieStore.get.mockReturnValue({ value: token })

      // 1. Create a dispatch
      const createReq = new NextRequest('http://localhost:3000/api/dispatches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: patient!.id,
          priority: 'HIGH',
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Integration test dispatch note',
        }),
      })

      const createRes = await dispatchesPost(createReq)
      const createData = await createRes.json()

      expect(createRes.status).toBe(201)
      expect(createData.data.patientId).toBe(patient!.id)
      
      const dispatchId = createData.data.id

      // 2. Update status using PUT
      const updateReq = new NextRequest(`http://localhost:3000/api/dispatches/${dispatchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'IN_PROGRESS',
        }),
      })

      const updateRes = await dispatchPut(updateReq, { params: Promise.resolve({ id: dispatchId }) })
      const updateData = await updateRes.json()

      expect(updateRes.status).toBe(200)
      expect(updateData.data.status).toBe('IN_PROGRESS')

      // 3. Verify audit log exists
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          dispatchId: dispatchId,
          action: 'DISPATCH_STATUS_CHANGED',
        },
      })

      expect(auditLog).not.toBeNull()
      expect(auditLog?.userId).toBe(adminUser!.id)
    })
  })

  describe('GET and DELETE /api/dispatches/[id]', () => {
    it('should fetch details of a specific dispatch', async () => {
      const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
      const dispatch = await prisma.dispatch.findFirst()
      expect(adminUser).not.toBeNull()
      expect(dispatch).not.toBeNull()

      const token = signToken({
        userId: adminUser!.id,
        email: adminUser!.email,
        role: adminUser!.role,
      })
      mockCookieStore.get.mockReturnValue({ value: token })

      const req = new NextRequest(`http://localhost:3000/api/dispatches/${dispatch!.id}`, {
        method: 'GET',
      })
      const response = await dispatchesGetId(req, { params: Promise.resolve({ id: dispatch!.id }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.id).toBe(dispatch!.id)
    })

    it('should return 404 for a non-existent dispatch ID', async () => {
      const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
      expect(adminUser).not.toBeNull()

      const token = signToken({
        userId: adminUser!.id,
        email: adminUser!.email,
        role: adminUser!.role,
      })
      mockCookieStore.get.mockReturnValue({ value: token })

      const req = new NextRequest('http://localhost:3000/api/dispatches/non-existent-cuid', {
        method: 'GET',
      })
      const response = await dispatchesGetId(req, { params: Promise.resolve({ id: 'non-existent-cuid' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error.code).toBe('NOT_FOUND')
    })

    it('should soft delete (cancel) a dispatch', async () => {
      const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
      const dispatch = await prisma.dispatch.findFirst({ where: { status: { not: 'CANCELLED' } } })
      expect(adminUser).not.toBeNull()
      expect(dispatch).not.toBeNull()

      const token = signToken({
        userId: adminUser!.id,
        email: adminUser!.email,
        role: adminUser!.role,
      })
      mockCookieStore.get.mockReturnValue({ value: token })

      const req = new NextRequest(`http://localhost:3000/api/dispatches/${dispatch!.id}`, {
        method: 'DELETE',
      })
      const response = await dispatchesDeleteId(req, { params: Promise.resolve({ id: dispatch!.id }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.status).toBe('CANCELLED')

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          dispatchId: dispatch!.id,
          action: 'DISPATCH_CANCELLED',
        },
      })
      expect(auditLog).not.toBeNull()
    })
  })

  describe('POST /api/dispatches/ai-suggest', () => {
    it('should return recommended nurses for a dispatch', async () => {
      const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
      const patient = await prisma.patient.findFirst()
      expect(adminUser).not.toBeNull()
      expect(patient).not.toBeNull()

      const token = signToken({
        userId: adminUser!.id,
        email: adminUser!.email,
        role: adminUser!.role,
      })
      mockCookieStore.get.mockReturnValue({ value: token })

      const req = new NextRequest('http://localhost:3000/api/dispatches/ai-suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: patient!.id,
          priority: 'URGENT',
          scheduledFor: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }),
      })

      const response = await aiSuggestPost(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBeGreaterThan(0)
      expect(data.data[0]).toHaveProperty('score')
      expect(data.data[0]).toHaveProperty('nurse')
    })
  })
})
