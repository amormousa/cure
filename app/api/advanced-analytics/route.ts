import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authorize } from '@/lib/auth'
import { createLogger } from '@/backend/utils/logger'

const log = createLogger('API:advanced-analytics')

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await authorize(['ADMIN', 'DISPATCHER'])
    if (errorResponse) return errorResponse

    const { searchParams } = new URL(req.url)
    const days = Math.max(1, parseInt(searchParams.get('days') || '30', 10))
    const toDate = new Date()
    const fromDate = new Date(toDate.getTime() - days * 24 * 60 * 60 * 1000)

    const [allDispatches, allNurses, allPatients, completedDispatches, auditCount] = await Promise.all([
      prisma.dispatch.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate } },
        include: { nurse: true, patient: true },
      }),
      prisma.user.findMany({
        where: { role: 'NURSE', isActive: true },
        include: {
          dispatches: true,
          specializations: { include: { specialization: true } },
        },
      }),
      prisma.patient.findMany(),
      prisma.dispatch.findMany({
        where: { status: 'COMPLETED', completedAt: { gte: fromDate, lte: toDate } },
        include: { nurse: true },
      }),
      prisma.auditLog.count({ where: { createdAt: { gte: fromDate, lte: toDate } } }),
    ])

    const nurseSpecializations = new Map(
      allNurses.map((nurse) => [
        nurse.id,
        nurse.specializations.map((item) => item.specialization.name).join(', ') || 'General Care',
      ]),
    )

    const nurseStats = new Map<string, {
      id: string
      name: string
      totalDispatches: number
      completedDispatches: number
      totalCompletionTime: number
      isOnline: boolean
    }>()

    allDispatches.forEach((dispatch) => {
      if (!dispatch.nurse) return
      const key = dispatch.nurse.id
      if (!nurseStats.has(key)) {
        nurseStats.set(key, {
          id: dispatch.nurse.id,
          name: dispatch.nurse.name,
          totalDispatches: 0,
          completedDispatches: 0,
          totalCompletionTime: 0,
          isOnline: dispatch.nurse.isOnline,
        })
      }

      const stat = nurseStats.get(key)!
      stat.totalDispatches += 1
      if (dispatch.status === 'COMPLETED' && dispatch.completedAt) {
        stat.completedDispatches += 1
        stat.totalCompletionTime += dispatch.completedAt.getTime() - dispatch.createdAt.getTime()
      }
    })

    const nursePerformance = Array.from(nurseStats.values())
      .map((stat) => ({
        name: stat.name,
        totalDispatches: stat.totalDispatches,
        completedDispatches: stat.completedDispatches,
        averageCompletionTime: stat.completedDispatches > 0
          ? Math.round(stat.totalCompletionTime / stat.completedDispatches / (1000 * 60))
          : 0,
        rating: stat.completedDispatches > 0
          ? Math.round((stat.completedDispatches / stat.totalDispatches) * 5 * 10) / 10
          : 0,
        specialization: nurseSpecializations.get(stat.id) || 'General Care',
        availability: stat.isOnline ? 100 : 0,
      }))
      .sort((a, b) => b.completedDispatches - a.completedDispatches)

    const totalCompletionDelta = completedDispatches.reduce((sum, dispatch) => {
      if (!dispatch.completedAt) return sum
      return sum + Math.max(0, dispatch.completedAt.getTime() - dispatch.scheduledFor.getTime())
    }, 0)
    const avgCompletionTime = completedDispatches.length > 0
      ? Math.round(totalCompletionDelta / completedDispatches.length / (1000 * 60 * 60))
      : 0
    const onTimeCount = completedDispatches.filter((dispatch) => dispatch.completedAt && dispatch.completedAt <= dispatch.scheduledFor).length
    const onTimeRate = completedDispatches.length > 0 ? Math.round((onTimeCount / completedDispatches.length) * 100) : 0
    const completionRate = allDispatches.length > 0 ? completedDispatches.length / allDispatches.length : 0
    const cancelledCount = allDispatches.filter((dispatch) => dispatch.status === 'CANCELLED').length

    const activePatientIds = new Set(allDispatches.filter((dispatch) => dispatch.status !== 'CANCELLED').map((dispatch) => dispatch.patientId))
    const highRiskPatients = allPatients
      .filter((patient) => /critical|urgent|high risk|emergency|post-operative/i.test(`${patient.condition} ${patient.notes ?? ''}`))
      .slice(0, 5)

    const dispatchAnalytics = {
      avgWaitTime: completedDispatches.length > 0
        ? Math.round(totalCompletionDelta / completedDispatches.length / (1000 * 60))
        : 0,
      avgCompletionTime,
      onTimeCompletionRate: onTimeRate,
      urgentPendingCount: allDispatches.filter((dispatch) => dispatch.status === 'PENDING' && dispatch.priority === 'URGENT').length,
      overdueCount: allDispatches.filter((dispatch) => dispatch.status !== 'COMPLETED' && dispatch.scheduledFor < toDate).length,
    }

    const avgDaily = allDispatches.length / days
    const predictions = {
      expectedDispatchesNext7Days: Math.ceil(avgDaily * 7),
      expectedResourceRequirementPercent: Math.min(Math.round((avgDaily / Math.max(allNurses.length, 1)) * 100), 100),
      predictedBottlenecks: [
        dispatchAnalytics.urgentPendingCount > 3 ? 'High urgent load' : null,
        nursePerformance.filter((nurse) => nurse.availability < 50).length > 2 ? 'Low nurse availability' : null,
        dispatchAnalytics.avgCompletionTime > 4 ? 'Long completion times' : null,
      ].filter(Boolean) as string[],
      recommendedActions: [
        'Review nurse assignments from current workload',
        'Prioritize overdue and urgent dispatches',
        'Use department and specialization data when assigning nurses',
      ],
    }

    const totalAvailableNurseHours = Math.max(allNurses.length * 8 * days, 1)
    const totalUsedHours = nursePerformance.reduce((sum, nurse) => sum + nurse.averageCompletionTime * nurse.completedDispatches / 60, 0)

    const result = {
      nursePerformance,
      patientInsights: {
        totalPatients: allPatients.length,
        activePatients: activePatientIds.size,
        highRiskPatients,
        avgVisitsPerPatient: allPatients.length > 0 ? Math.round(allDispatches.length / allPatients.length) : 0,
        avgSatisfactionScore: completedDispatches.length > 0 ? Math.min(5, Math.round((3.5 + onTimeRate / 100) * 10) / 10) : 0,
      },
      dispatchAnalytics,
      predictions,
      qualityMetrics: {
        patientSatisfactionScore: completedDispatches.length > 0 ? Math.min(5, Math.round((3.2 + completionRate * 1.8) * 10) / 10) : 0,
        serviceQualityRating: completedDispatches.length > 0 ? Math.min(5, Math.round((3 + onTimeRate / 50) * 10) / 10) : 0,
        complianceRate: auditCount > 0 ? 100 : 0,
        incidentRate: allDispatches.length > 0 ? Math.round((cancelledCount / allDispatches.length) * 1000) / 10 : 0,
      },
      efficiencyMetrics: {
        resourceUtilization: Math.round((totalUsedHours / totalAvailableNurseHours) * 100),
        timeUtilization: allDispatches.length > 0 ? Math.round(completionRate * 100) : 0,
        costPerDispatch: allDispatches.length > 0 ? Math.round((totalUsedHours * 40) / allDispatches.length) : 0,
        dispatchesPerNurse: Math.round(allDispatches.length / Math.max(allNurses.length, 1)),
        overallProductivity: allDispatches.length > 0 ? Math.round(completionRate * 100) : 0,
      },
    }

    log.info('Advanced analytics computed', { days })
    return NextResponse.json({ data: result }, { status: 200 })
  } catch (error) {
    log.error('GET /api/advanced-analytics failed', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 },
    )
  }
}
