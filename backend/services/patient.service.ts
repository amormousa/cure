// backend/services/patient.service.ts
// Business logic for Patient CRUD.

import { prisma } from '@/backend/config/prisma'
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
  const patient = await prisma.patient.create({
    data: {
      name: data.name,
      address: data.address,
      phone: data.phone,
      condition: data.condition,
      notes: data.notes || null,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'PATIENT_CREATED',
      entityType: 'Patient',
      entityId: patient.id,
      details: {
        name: patient.name,
        phone: patient.phone,
        condition: patient.condition,
      },
    },
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
    throw Errors.notFound('Patient', id)
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
    throw Errors.notFound('Patient', id)
  }

  const patient = await prisma.patient.update({
    where: { id },
    data,
  })

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'PATIENT_UPDATED',
      entityType: 'Patient',
      entityId: id,
      details: { before: existing, after: patient },
    },
  })

  log.info('Patient updated', { id })
  return patient
}

// ─── Delete ────────────────────────────────────────────
export async function deletePatient(id: string, userId: string) {
  const existing = await prisma.patient.findUnique({ where: { id } })
  if (!existing) {
    throw Errors.notFound('Patient', id)
  }

  const deleted = await prisma.patient.delete({ where: { id } })

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'PATIENT_DELETED',
      entityType: 'Patient',
      entityId: id,
      details: { name: existing.name },
    },
  })

  log.info('Patient deleted', { id })
  return deleted
}
