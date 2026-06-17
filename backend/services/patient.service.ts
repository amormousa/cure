// backend/services/patient.service.ts
// Business logic for Patient CRUD.

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/backend/utils/logger'
import { Errors } from '@/backend/utils/errors'

const log = createLogger('PatientService')

// ─── List ──────────────────────────────────────────────
export async function listPatients() {
  const patients = await prisma.patient.findMany({
    include: {
      dispatches: {
        select: { id: true, status: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  log.info('Listed patients', { count: patients.length })
  return patients
}

// ─── Create ────────────────────────────────────────────
export interface CreatePatientData {
  name: string
  address: string
  phone: string
  condition: string
  notes?: string
}

export async function createPatient(data: CreatePatientData, userId: string) {
  const patient = await prisma.$transaction(async (tx) => {
    const created = await tx.patient.create({
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        condition: data.condition,
        notes: data.notes || null,
      },
    })

    await tx.auditLog.create({
      data: {
        userId,
        action: 'PATIENT_CREATED',
        entityType: 'Patient',
        entityId: created.id,
        newValue: created,
        details: { after: created },
      },
    })

    return created
  })

  log.info('Patient created', { id: patient.id })
  return patient
}

// ─── Get by ID ─────────────────────────────────────────
export async function getPatientById(id: string) {
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      dispatches: {
        include: {
          nurse: { select: { id: true, name: true, email: true, avatar: true } },
        },
        orderBy: { scheduledFor: 'desc' },
      },
    },
  })

  if (!patient) {
    throw Errors.notFound('Patient')
  }

  return patient
}

// ─── Update ────────────────────────────────────────────
export interface UpdatePatientData {
  name?: string
  address?: string
  phone?: string
  condition?: string
  notes?: string | null
}

export async function updatePatient(id: string, data: UpdatePatientData, userId: string) {
  const existing = await prisma.patient.findUnique({ where: { id } })
  if (!existing) {
    throw Errors.notFound('Patient')
  }

  const patient = await prisma.$transaction(async (tx) => {
    const updated = await tx.patient.update({
      where: { id },
      data,
    })

    await tx.auditLog.create({
      data: {
        userId,
        action: 'PATIENT_UPDATED',
        entityType: 'Patient',
        entityId: id,
        previousValue: existing,
        newValue: updated,
        details: { before: existing, after: updated, changedFields: Object.keys(data) },
      },
    })

    return updated
  })

  log.info('Patient updated', { id })
  return patient
}

// ─── Delete ────────────────────────────────────────────
export async function deletePatient(id: string, userId: string) {
  const existing = await prisma.patient.findUnique({ where: { id } })
  if (!existing) {
    throw Errors.notFound('Patient')
  }

  const deleted = await prisma.$transaction(async (tx) => {
    const result = await tx.patient.delete({ where: { id } })

    await tx.auditLog.create({
      data: {
        userId,
        action: 'PATIENT_DELETED',
        entityType: 'Patient',
        entityId: id,
        previousValue: existing,
        details: { before: existing },
      },
    })

    return result
  })

  log.info('Patient deleted', { id })
  return deleted
}
