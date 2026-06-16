// backend/services/advanced-data.service.ts
// Advanced data operations and insights generation

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/backend/utils/logger'

const log = createLogger('AdvancedDataService')

// ═══════════════════════════════════════════════════════════════
// 1. Predictive Analytics
// ═══════════════════════════════════════════════════════════════

export async function predictNurseWorkload(nurseId: string, days: number = 7) {
  const dispatchesInPeriod = await prisma.dispatch.findMany({
    where: {
      nurseId,
      scheduledFor: {
        gte: new Date(),
        lte: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      },
    },
  })

  const avgCompletionTime = await getAverageCompletionTime(nurseId)
  const availableHours = days * 8 // 8-hour shifts
  const estimatedUsedHours = dispatchesInPeriod.length * (avgCompletionTime / 60)
  const utilizationRate = (estimatedUsedHours / availableHours) * 100

  return {
    nurseId,
    predictedDispatches: dispatchesInPeriod.length,
    estimatedUtilizationRate: Math.round(utilizationRate),
    availableCapacity: Math.max(0, Math.round((availableHours - estimatedUsedHours) / avgCompletionTime)),
    riskLevel: utilizationRate > 80 ? 'HIGH' : utilizationRate > 60 ? 'MEDIUM' : 'LOW',
  }
}

// ═══════════════════════════════════════════════════════════════
// 2. Performance Metrics
// ═══════════════════════════════════════════════════════════════

export async function getNursePerformanceMetrics(nurseId: string, days: number = 30) {
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - days)

  const dispatches = await prisma.dispatch.findMany({
    where: {
      nurseId,
      createdAt: { gte: fromDate },
    },
    include: { patient: true },
  })

  const completedCount = dispatches.filter((d) => d.status === 'COMPLETED').length
  const totalCount = dispatches.length

  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  // Calculate average completion time
  const completedDispatches = dispatches.filter((d) => d.status === 'COMPLETED' && d.completedAt)
  const totalTime = completedDispatches.reduce((sum, d) => {
    return sum + (d.completedAt!.getTime() - d.scheduledFor.getTime())
  }, 0)
  const avgCompletionTime = completedDispatches.length > 0 ? Math.round(totalTime / completedDispatches.length / (1000 * 60 * 60)) : 0

  // On-time completion rate
  const onTimeCount = completedDispatches.filter((d) => d.completedAt! <= d.scheduledFor).length
  const onTimeRate = completedDispatches.length > 0 ? (onTimeCount / completedDispatches.length) * 100 : 0

  // Quality score (1-5)
  const qualityScore = Math.min(5, 3 + (onTimeRate / 100) * 2)

  return {
    nurseId,
    totalDispatches: totalCount,
    completedDispatches: completedCount,
    completionRate: Math.round(completionRate),
    avgCompletionTime,
    onTimeRate: Math.round(onTimeRate),
    qualityScore: Math.round(qualityScore * 10) / 10,
    rating: getRatingFromScore(qualityScore),
  }
}

// ═══════════════════════════════════════════════════════════════
// 3. Patient Risk Assessment
// ═══════════════════════════════════════════════════════════════

export async function assessPatientRisk(patientId: string) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      dispatches: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!patient) return null

  const dispatchCount = patient.dispatches.length
  const completedCount = patient.dispatches.filter((d) => d.status === 'COMPLETED').length
  const urgentCount = patient.dispatches.filter((d) => d.priority === 'URGENT').length
  const cancelledCount = patient.dispatches.filter((d) => d.status === 'CANCELLED').length

  // Calculate risk score (0-100)
  let riskScore = 0
  riskScore += urgentCount * 15 // Urgent dispatches increase risk
  riskScore += cancelledCount * 10 // Cancellations increase risk
  if (dispatchCount > 0 && completedCount / dispatchCount < 0.7) riskScore += 20 // Low completion rate
  if (patient.condition.toLowerCase().includes('critical')) riskScore += 30

  const riskLevel =
    riskScore >= 70 ? 'CRITICAL' : riskScore >= 50 ? 'HIGH' : riskScore >= 25 ? 'MEDIUM' : 'LOW'

  return {
    patientId,
    patientName: patient.name,
    condition: patient.condition,
    totalDispatches: dispatchCount,
    completionRate: dispatchCount > 0 ? Math.round((completedCount / dispatchCount) * 100) : 0,
    riskScore: Math.round(riskScore),
    riskLevel,
    lastDispatchDate: patient.dispatches[0]?.createdAt || null,
    recommendations:
      riskLevel === 'CRITICAL'
        ? ['Schedule immediate visit', 'Assign senior nurse', 'Monitor closely']
        : riskLevel === 'HIGH'
          ? ['Increase visit frequency', 'Regular monitoring']
          : riskLevel === 'MEDIUM'
            ? ['Standard monitoring', 'Follow-up as scheduled']
            : ['Routine care', 'Standard monitoring'],
  }
}

// ═══════════════════════════════════════════════════════════════
// 4. Optimization Recommendations
// ═══════════════════════════════════════════════════════════════

export async function generateOptimizationRecommendations() {
  const [allDispatches, allNurses, allPatients] = await Promise.all([
    prisma.dispatch.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.user.findMany({ where: { role: 'NURSE', isActive: true } }),
    prisma.patient.findMany(),
  ])

  const recommendations: string[] = []

  // Check urgent pending
  const urgentPending = allDispatches.filter((d) => d.status === 'PENDING' && d.priority === 'URGENT')
  if (urgentPending.length > 3) {
    recommendations.push(`⚠️ High urgent load (${urgentPending.length} pending) - Consider emergency dispatch`)
  }

  // Check nurse availability
  const busyNurses = allNurses.filter((n) => n.dispatches.length > 5)
  if (busyNurses.length > allNurses.length * 0.7) {
    recommendations.push('🔴 Low nurse availability - Consider additional staffing')
  }

  // Check completion rate
  const completionRate = allDispatches.filter((d) => d.status === 'COMPLETED').length / Math.max(allDispatches.length, 1)
  if (completionRate < 0.7) {
    recommendations.push('📉 Low completion rate - Review assignments and timelines')
  }

  // Check patient satisfaction
  const highRiskPatients = (await Promise.all(allPatients.map((p) => assessPatientRisk(p.id)))).filter(
    (p) => p?.riskLevel === 'CRITICAL' || p?.riskLevel === 'HIGH',
  )
  if (highRiskPatients.length > 0) {
    recommendations.push(`🏥 ${highRiskPatients.length} patients with high risk - Immediate attention needed`)
  }

  return {
    generatedAt: new Date(),
    totalRecommendations: recommendations.length,
    recommendations,
    priority: recommendations.length > 3 ? 'HIGH' : 'NORMAL',
  }
}

// ═══════════════════════════════════════════════════════════════
// 5. Data Aggregation
// ═══════════════════════════════════════════════════════════════

export async function getAggregatedMetrics(days: number = 30) {
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - days)

  const [dispatches, nurses, patients] = await Promise.all([
    prisma.dispatch.findMany({
      where: { createdAt: { gte: fromDate } },
      include: { nurse: true },
    }),
    prisma.user.findMany({ where: { role: 'NURSE' } }),
    prisma.patient.findMany(),
  ])

  return {
    period: { from: fromDate, to: new Date(), days },
    totalMetrics: {
      totalDispatches: dispatches.length,
      totalPatients: patients.length,
      totalNurses: nurses.length,
      completedDispatches: dispatches.filter((d) => d.status === 'COMPLETED').length,
      pendingDispatches: dispatches.filter((d) => d.status === 'PENDING').length,
      cancelledDispatches: dispatches.filter((d) => d.status === 'CANCELLED').length,
    },
    averageMetrics: {
      dispatchesPerDay: Math.round(dispatches.length / days),
      dispatchesPerNurse: Math.round(dispatches.length / Math.max(nurses.length, 1)),
      dispatchesPerPatient: Math.round(dispatches.length / Math.max(patients.length, 1)),
    },
    qualityMetrics: {
      completionRate: Math.round((dispatches.filter((d) => d.status === 'COMPLETED').length / Math.max(dispatches.length, 1)) * 100),
      cancelRate: Math.round((dispatches.filter((d) => d.status === 'CANCELLED').length / Math.max(dispatches.length, 1)) * 100),
    },
  }
}

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

async function getAverageCompletionTime(nurseId: string): Promise<number> {
  const dispatches = await prisma.dispatch.findMany({
    where: {
      nurseId,
      status: 'COMPLETED',
      completedAt: { not: null },
    },
  })

  if (dispatches.length === 0) return 120 // default 2 hours

  const totalTime = dispatches.reduce((sum, d) => {
    return sum + (d.completedAt!.getTime() - d.scheduledFor.getTime())
  }, 0)

  return totalTime / dispatches.length / (1000 * 60) // convert to minutes
}

function getRatingFromScore(score: number): string {
  if (score >= 4.5) return '⭐⭐⭐⭐⭐'
  if (score >= 4) return '⭐⭐⭐⭐'
  if (score >= 3) return '⭐⭐⭐'
  if (score >= 2) return '⭐⭐'
  return '⭐'
}
