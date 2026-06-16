// app/api/dispatches/ai-suggest/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AISuggestSchema } from '@/lib/validations'
import { authorize } from '@/lib/auth'
import { calculateNurseScore } from '@/lib/ai'
import { createLogger } from '@/backend/utils/logger'

const log = createLogger('API:dispatches/ai-suggest')

export async function POST(req: NextRequest) {
  try {
    const { user: authUser, errorResponse } = await authorize(['ADMIN', 'DISPATCHER'])
    if (errorResponse) return errorResponse

    const body = await req.json()
    const validated = AISuggestSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details: validated.error.issues } },
        { status: 422 }
      )
    }

    let patientId = validated.data.patientId
    let priority = validated.data.priority
    let scheduledForStr = validated.data.scheduledFor
    let dispatchId = validated.data.dispatchId

    // If dispatchId is provided, pre-fill missing fields from it
    if (dispatchId) {
      const dispatch = await prisma.dispatch.findUnique({
        where: { id: dispatchId },
        include: { patient: true }
      })

      if (!dispatch) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Dispatch not found' } },
          { status: 404 }
        )
      }

      if (!patientId) patientId = dispatch.patientId
      if (!priority) priority = dispatch.priority
      if (!scheduledForStr) scheduledForStr = dispatch.scheduledFor.toISOString()
    }

    const scheduledTime = scheduledForStr ? new Date(scheduledForStr) : new Date()

    // Fetch all active nurses
    const nurses = await prisma.user.findMany({
      where: {
        role: 'NURSE',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        isOnline: true,
        dispatches: {
          where: {
            status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
          },
          select: {
            id: true,
            scheduledFor: true,
            status: true,
            priority: true,
          },
        },
      },
    })

    // Suitability calculations using the helper function
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
        reasons,
      }
    })

    // Sort by score descending
    suggestions.sort((a, b) => b.score - a.score)

    return NextResponse.json({ data: suggestions }, { status: 200 })
  } catch (error) {
    log.error('POST /api/dispatches/ai-suggest failed', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
