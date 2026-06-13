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
    const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get all dispatches in date range
    const dispatches = await prisma.dispatch.findMany({
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        nurse: { select: { id: true, name: true } },
      },
    })

    // Generate daily series
    const dailyMap = new Map<string, { created: number; completed: number }>()
    let current = new Date(fromDate)
    while (current <= toDate) {
      const dateStr = current.toISOString().split('T')[0]
      dailyMap.set(dateStr, { created: 0, completed: 0 })
      current.setDate(current.getDate() + 1)
    }

    dispatches.forEach((dispatch) => {
      const dateStr = dispatch.createdAt.toISOString().split('T')[0]
      const entry = dailyMap.get(dateStr)
      if (entry) {
        entry.created++
        if (dispatch.status === 'COMPLETED' && dispatch.completedAt) {
          const completedStr = dispatch.completedAt.toISOString().split('T')[0]
          const completedEntry = dailyMap.get(completedStr)
          if (completedEntry) {
            completedEntry.completed++
          }
        }
      }
    })

    const dailySeries = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Status breakdown (current snapshot)
    const statusBreakdown = {
      PENDING: dispatches.filter((d) => d.status === 'PENDING').length,
      ASSIGNED: dispatches.filter((d) => d.status === 'ASSIGNED').length,
      IN_PROGRESS: dispatches.filter((d) => d.status === 'IN_PROGRESS').length,
      COMPLETED: dispatches.filter((d) => d.status === 'COMPLETED').length,
      CANCELLED: dispatches.filter((d) => d.status === 'CANCELLED').length,
    }

    // Priority breakdown
    const priorityBreakdown = {
      LOW: dispatches.filter((d) => d.priority === 'LOW').length,
      MEDIUM: dispatches.filter((d) => d.priority === 'MEDIUM').length,
      HIGH: dispatches.filter((d) => d.priority === 'HIGH').length,
      URGENT: dispatches.filter((d) => d.priority === 'URGENT').length,
    }

    // Nurse performance (completed this month)
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const completedThisMonth = await prisma.dispatch.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: monthStart,
        },
      },
      include: {
        nurse: { select: { id: true, name: true } },
      },
    })

    const nurseStats = new Map<
      string,
      { nurseId: string; name: string; completed: number }
    >()

    completedThisMonth.forEach((dispatch) => {
      if (dispatch.nurse) {
        const key = dispatch.nurse.id
        if (!nurseStats.has(key)) {
          nurseStats.set(key, {
            nurseId: dispatch.nurse.id,
            name: dispatch.nurse.name,
            completed: 0,
          })
        }
        const stat = nurseStats.get(key)!
        stat.completed++
      }
    })

    const nursePerformance = Array.from(nurseStats.values()).sort(
      (a, b) => b.completed - a.completed
    )

    return NextResponse.json(
      {
        data: {
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
