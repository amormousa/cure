// backend/services/analytics.service.ts
// Business logic for the analytics dashboard.

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/backend/utils/logger'
import type {
  AnalyticsResponse,
  DailySeries,
  NursePerformance,
} from '@/backend/types/models'

const log = createLogger('AnalyticsService')

export async function getAnalytics(range: string): Promise<AnalyticsResponse> {
  let days = 30
  if (range === '7d') days = 7
  else if (range === '90d') days = 90

  const toDate = new Date()
  const fromDate = new Date(toDate.getTime() - days * 24 * 60 * 60 * 1000)
  fromDate.setHours(0, 0, 0, 0)
  const previousFromDate = new Date(fromDate.getTime() - days * 24 * 60 * 60 * 1000)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // KPI queries in parallel
  const [allDispatches, previousDispatches, completedTodayCount, allNurses, urgentPendingCount, createdTodayCount] =
    await Promise.all([
      prisma.dispatch.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate } },
        include: { nurse: { select: { id: true, name: true } } },
      }),
      prisma.dispatch.findMany({
        where: { createdAt: { gte: previousFromDate, lt: fromDate } },
        select: { status: true, priority: true },
      }),
      prisma.dispatch.count({
        where: { status: 'COMPLETED', completedAt: { gte: today } },
      }),
      prisma.user.findMany({
        where: { role: 'NURSE', isActive: true },
        select: {
          id: true,
          isOnline: true,
          dispatches: {
            where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
            select: { id: true },
          },
        },
      }),
      prisma.dispatch.count({
        where: { status: 'PENDING', priority: 'URGENT' },
      }),
      prisma.dispatch.count({
        where: { createdAt: { gte: today } },
      }),
    ])

  const availableNursesCount = allNurses.filter(
    (n) => n.isOnline && n.dispatches.length === 0,
  ).length
  const onlineNursesCount = allNurses.filter((n) => n.isOnline).length

  // Daily series
  const dailyMap = new Map<string, { created: number; completed: number }>()
  let cur = new Date(fromDate)
  while (cur <= toDate) {
    dailyMap.set(cur.toISOString().split('T')[0], { created: 0, completed: 0 })
    cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000)
  }

  allDispatches.forEach((d) => {
    const dateStr = d.createdAt.toISOString().split('T')[0]
    const entry = dailyMap.get(dateStr)
    if (entry) entry.created++

    if (d.status === 'COMPLETED' && d.completedAt) {
      const completedStr = d.completedAt.toISOString().split('T')[0]
      const completedEntry = dailyMap.get(completedStr)
      if (completedEntry) completedEntry.completed++
    }
  })

  const dailySeries: DailySeries[] = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Status breakdown
  const statusBreakdown = {
    PENDING: allDispatches.filter((d) => d.status === 'PENDING').length,
    ASSIGNED: allDispatches.filter((d) => d.status === 'ASSIGNED').length,
    IN_PROGRESS: allDispatches.filter((d) => d.status === 'IN_PROGRESS').length,
    COMPLETED: allDispatches.filter((d) => d.status === 'COMPLETED').length,
    CANCELLED: allDispatches.filter((d) => d.status === 'CANCELLED').length,
  }

  // Priority breakdown
  const priorityBreakdown = {
    LOW: allDispatches.filter((d) => d.priority === 'LOW').length,
    MEDIUM: allDispatches.filter((d) => d.priority === 'MEDIUM').length,
    HIGH: allDispatches.filter((d) => d.priority === 'HIGH').length,
    URGENT: allDispatches.filter((d) => d.priority === 'URGENT').length,
  }

  // Nurse performance
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const completedThisMonth = await prisma.dispatch.findMany({
    where: { status: 'COMPLETED', completedAt: { gte: monthStart } },
    include: { nurse: { select: { id: true, name: true } } },
  })

  const nurseStats = new Map<string, NursePerformance>()
  completedThisMonth.forEach((d) => {
    if (d.nurse) {
      const existing = nurseStats.get(d.nurse.id)
      if (existing) {
        existing.completed++
      } else {
        nurseStats.set(d.nurse.id, {
          nurseId: d.nurse.id,
          name: d.nurse.name,
          completed: 1,
        })
      }
    }
  })

  const nursePerformance = Array.from(nurseStats.values()).sort(
    (a, b) => b.completed - a.completed,
  )

  const totalInRange = allDispatches.length
  const completedInRange = allDispatches.filter((d) => d.status === 'COMPLETED').length
  const completionRate = totalInRange > 0 ? Math.round((completedInRange / totalInRange) * 100) : 0
  const urgentDispatchesCount = allDispatches.filter((d) => d.priority === 'URGENT').length
  const previousCompleted = previousDispatches.filter((d) => d.status === 'COMPLETED').length
  const previousCompletionRate = previousDispatches.length > 0 ? Math.round((previousCompleted / previousDispatches.length) * 100) : 0
  const previousUrgent = previousDispatches.filter((d) => d.priority === 'URGENT').length
  const trendPercent = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  log.info('Analytics computed', { range, totalInRange })

  return {
    dispatchesToday: createdTodayCount,
    completionRate,
    activeNurses: onlineNursesCount,
    urgentDispatches: urgentDispatchesCount,
    trends: dailySeries,
    completedToday: completedTodayCount,
    createdToday: createdTodayCount,
    availableNurses: availableNursesCount,
    onlineNurses: onlineNursesCount,
    urgentPending: urgentPendingCount,
    dailySeries,
    statusBreakdown,
    priorityBreakdown,
    nursePerformance,
    kpiTrends: {
      createdToday: trendPercent(createdTodayCount, Math.round(previousDispatches.length / days)),
      completionRate: completionRate - previousCompletionRate,
      onlineNurses: 0,
      availableNurses: 0,
      urgentPending: trendPercent(urgentPendingCount, previousUrgent),
    },
  }
}
