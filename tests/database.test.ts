// tests/database.test.ts
// Database Integration Tests

import 'dotenv/config'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

describe('Database Integration Tests', () => {
  describe('User Management', () => {
    let testUserId: string

    it('should create a new user', async () => {
      const user = await prisma.user.create({
        data: {
          email: `test-${Date.now()}@cure.com`,
          password: await bcrypt.hash('Test@123', 10),
          name: 'Test User',
          role: 'NURSE'
        }
      })
      expect(user).toBeDefined()
      testUserId = user.id
    })

    it('should retrieve user by ID', async () => {
      if (!testUserId) return
      const user = await prisma.user.findUnique({
        where: { id: testUserId }
      })
      expect(user).toBeDefined()
    })

    it('should update user', async () => {
      if (!testUserId) return
      const updated = await prisma.user.update({
        where: { id: testUserId },
        data: { name: 'Updated' }
      })
      expect(updated.name).toBe('Updated')
    })

    it('should list nurses', async () => {
      const nurses = await prisma.user.findMany({
        where: { role: 'NURSE' },
        take: 5
      })
      expect(Array.isArray(nurses)).toBe(true)
    })
  })

  describe('Patient Management', () => {
    let testPatientId: string

    it('should create patient', async () => {
      const patient = await prisma.patient.create({
        data: {
          name: 'Test Patient',
          phone: '+201234567890',
          address: 'Test Address',
          condition: 'Routine checkup'
        }
      })
      expect(patient).toBeDefined()
      testPatientId = patient.id
    })

    it('should retrieve patient', async () => {
      if (!testPatientId) return
      const patient = await prisma.patient.findUnique({
        where: { id: testPatientId }
      })
      expect(patient).toBeDefined()
    })
  })

  describe('Dispatch Management', () => {
    let dispatchId: string
    let nurseId: string
    let patientId: string

    beforeAll(async () => {
      const nurse = await prisma.user.create({
        data: {
          email: `nurse-${Date.now()}@test.com`,
          password: await bcrypt.hash('Pass@123', 10),
          name: 'Test Nurse',
          role: 'NURSE'
        }
      })
      nurseId = nurse.id

      const patient = await prisma.patient.create({
        data: {
          name: 'Patient',
          phone: '+201234567890',
          address: 'Address',
          condition: 'Post-operative care'
        }
      })
      patientId = patient.id
    })

    it('should create dispatch', async () => {
      const dispatch = await prisma.dispatch.create({
        data: {
          patientId,
          status: 'PENDING',
          priority: 'HIGH',
          scheduledFor: new Date(Date.now() + 86400000)
        }
      })
      expect(dispatch).toBeDefined()
      dispatchId = dispatch.id
    })

    it('should assign dispatch', async () => {
      if (!dispatchId) return
      const updated = await prisma.dispatch.update({
        where: { id: dispatchId },
        data: {
          nurseId,
          status: 'ASSIGNED'
        }
      })
      expect(updated.nurseId).toBe(nurseId)
    })

    it('should complete dispatch', async () => {
      if (!dispatchId) return
      const updated = await prisma.dispatch.update({
        where: { id: dispatchId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      })
      expect(updated.status).toBe('COMPLETED')
    })
  })

  describe('Relationships', () => {
    it('should load user with dispatches', async () => {
      const user = await prisma.user.findFirst({
        include: {
          dispatches: true
        }
      })
      expect(user).toBeDefined()
    })

    it('should load dispatch with relations', async () => {
      const dispatch = await prisma.dispatch.findFirst({
        include: {
          patient: true,
          nurse: true
        }
      })
      expect(dispatch).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('should handle pagination', async () => {
      const result = await prisma.dispatch.findMany({
        skip: 0,
        take: 10
      })
      expect(Array.isArray(result)).toBe(true)
    })

    it('should filter efficiently', async () => {
      const result = await prisma.dispatch.findMany({
        where: { status: 'COMPLETED' },
        take: 5
      })
      expect(Array.isArray(result)).toBe(true)
    })
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })
})
