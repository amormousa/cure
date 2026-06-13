// app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // Default to last 30 days
    const toDate = to ? new Date(to) : new Date()
    const fromDate = from
      ? new Date(from)
      : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000)

    // --- KPI: Quick aggregate queries run in parallel ---
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [allDispatches, completedTodayCount, allNurses, urgentPendingCount] =
      await Promise.all([
        // All dispatches in range (for series + breakdown)
        prisma.dispatch.findMany({
          where: {
            createdAt: { gte: fromDate, lte: toDate },
          },
          include: {
            nurse: { select: { id: true, name: true } },
          },
        }),
        // Completed today
        prisma.dispatch.count({
          where: {
            status: 'COMPLETED',
            completedAt: { gte: today },
          },
        }),
        // All active nurses for "available nurses" calc
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
        // Urgent pending
        prisma.dispatch.count({
          where: { status: 'PENDING', priority: 'URGENT' },
        }),
      ])

    // Available nurses = online AND no active dispatch
    const availableNursesCount = allNurses.filter(
      (n) => n.isOnline && n.dispatches.length === 0
    ).length

    // --- Daily series ---
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

    const dailySeries = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // --- Status breakdown ---
    const statusBreakdown = {
      PENDING: allDispatches.filter((d) => d.status === 'PENDING').length,
      ASSIGNED: allDispatches.filter((d) => d.status === 'ASSIGNED').length,
      IN_PROGRESS: allDispatches.filter((d) => d.status === 'IN_PROGRESS').length,
      COMPLETED: allDispatches.filter((d) => d.status === 'COMPLETED').length,
      CANCELLED: allDispatches.filter((d) => d.status === 'CANCELLED').length,
    }

    // --- Priority breakdown ---
    const priorityBreakdown = {
      LOW: allDispatches.filter((d) => d.priority === 'LOW').length,
      MEDIUM: allDispatches.filter((d) => d.priority === 'MEDIUM').length,
      HIGH: allDispatches.filter((d) => d.priority === 'HIGH').length,
      URGENT: allDispatches.filter((d) => d.priority === 'URGENT').length,
    }

    // --- Nurse performance (completed this month) ---
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const completedThisMonth = await prisma.dispatch.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: monthStart },
      },
      include: { nurse: { select: { id: true, name: true } } },
    })

    const nurseStats = new Map<
      string,
      { nurseId: string; name: string; completed: number }
    >()
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
      (a, b) => b.completed - a.completed
    )

    return NextResponse.json(
      {
        data: {
          // KPI fields (used by dashboard overview)
          completedToday: completedTodayCount,
          availableNurses: availableNursesCount,
          urgentPending: urgentPendingCount,
          // Chart fields
          dailySeries,
          statusBreakdown,
          priorityBreakdown,
          nursePerformance,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[GET /api/analytics]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
