// backend/services/nurse.service.ts
// Nurse-specific business logic: listing active nurses and smart assignment suggestions.

import { prisma } from '@/lib/prisma'
import { calculateNurseScore } from '@/lib/ai'
import { createLogger } from '@/backend/utils/logger'
import { Errors } from '@/backend/utils/errors'
import type { NurseSuggestion, Priority } from '@/backend/types/models'

const log = createLogger('NurseService')

export interface NurseSuggestionInput {
  dispatchId?: string
  patientId?: string
  priority?: Priority
  scheduledFor?: string
}

export async function listActiveNurses() {
  const nurses = await prisma.user.findMany({
    where: { role: 'NURSE', isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      phone: true,
      isOnline: true,
      dispatches: {
        where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
        select: {
          id: true,
          scheduledFor: true,
          status: true,
          priority: true,
        },
      },
    },
    orderBy: [{ isOnline: 'desc' }, { name: 'asc' }],
  })

  log.info('Listed active nurses', { count: nurses.length })
  return nurses
}

export async function suggestNurses(input: NurseSuggestionInput): Promise<NurseSuggestion[]> {
  let patientId = input.patientId
  let priority = input.priority
  let scheduledFor = input.scheduledFor

  if (input.dispatchId) {
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: input.dispatchId },
      select: {
        patientId: true,
        priority: true,
        scheduledFor: true,
      },
    })

    if (!dispatch) throw Errors.notFound('Dispatch')

    patientId ??= dispatch.patientId
    priority ??= dispatch.priority
    scheduledFor ??= dispatch.scheduledFor.toISOString()
  }

  if (patientId) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true },
    })
    if (!patient) throw Errors.notFound('Patient')
  }

  const scheduledTime = scheduledFor ? new Date(scheduledFor) : new Date()
  const nurses = await listActiveNurses()

  const suggestions = nurses.map((nurse) => {
    const { score, reasons } = calculateNurseScore(nurse, scheduledTime)
    return {
      nurse: {
        id: nurse.id,
        name: nurse.name,
        email: nurse.email,
        avatar: nurse.avatar,
        phone: nurse.phone,
        isOnline: nurse.isOnline,
      },
      score,
      activeDispatchesCount: nurse.dispatches.length,
      reasons: reasons,
    }
  })

  suggestions.sort((a, b) => b.score - a.score)
  log.info('Generated nurse suggestions', { count: suggestions.length, dispatchId: input.dispatchId })
  return suggestions
}

