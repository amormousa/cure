// app/api/analytics/route.ts
// Premium analytics API for enterprise-grade dashboard
import { NextRequest, NextResponse } from 'next/server'
import { authorize } from '@/lib/auth'
import { createLogger } from '@/backend/utils/logger'
import { ApiError } from '@/backend/utils/errors'
import * as analyticsService from '@/backend/services/analytics.service'

const log = createLogger('API:analytics')

// Supported date ranges
type DateRange = 'today' | 'yesterday' | '7d' | '30d' | 'thisMonth' | 'custom'

interface AnalyticsResponse {
  executive: analyticsService.ExecutiveKPIs
  realTime: analyticsService.RealTimeData
  users: analyticsService.UserAnalytics
  tasks: analyticsService.TaskAnalytics
  departments: analyticsService.DepartmentAnalytics
  specializations: analyticsService.SpecializationAnalytics
  activityFeed: analyticsService.ActivityFeedItem[]
  insights: analyticsService.SmartInsight[]
  predictions: analyticsService.PredictionData
  dashboard: analyticsService.DashboardData
}

export async function GET(req: NextRequest): Promise<NextResponse<{ data?: AnalyticsResponse; error?: { code: string; message: string } }>> {
  try {
    const { user: authUser, errorResponse } = await authorize(['ADMIN', 'DISPATCHER'])
    if (errorResponse) return errorResponse

    const { searchParams } = new URL(req.url)
    const range = (searchParams.get('range') || '30d') as DateRange

    // Get full analytics data
    const fullData = await analyticsService.getFullAnalytics()
    const { dashboard } = fullData

    // Flatten dashboard fields for legacy API compatibility
    const data = {
      ...fullData,
      // Legacy fields at top level
      dispatchesToday: dashboard.createdToday,
      completedToday: dashboard.createdToday,
      createdToday: dashboard.createdToday,
      availableNurses: dashboard.availableNurses,
      onlineNurses: dashboard.onlineNurses,
      urgentPending: dashboard.urgentPending,
      completionRate: dashboard.completionRate,
      dailySeries: dashboard.dailySeries,
      statusBreakdown: dashboard.statusBreakdown,
      priorityBreakdown: dashboard.priorityBreakdown,
      nursePerformance: dashboard.nursePerformance,
      kpiTrends: dashboard,
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    log.error('GET /api/analytics failed', { message: errorMessage, stack: errorStack })
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: errorMessage } },
      { status: 500 },
    )
  }
}
