// app/(dashboard)/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { KPICard } from '@/app/components/dashboard/KPICard'
import { NurseMatrix } from '@/app/components/dashboard/NurseMatrix'
import { SmartInsights } from '@/app/components/dashboard/SmartInsights'
import { AdvancedAnalytics } from '@/app/components/dashboard/AdvancedAnalytics'
import { PerformanceMetrics } from '@/app/components/dashboard/PerformanceMetrics'
import { NursePerformance } from '@/app/components/dashboard/NursePerformance'
import { LoadingSpinner } from '@/app/components/common/LoadingSpinner'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { Badge } from '@/app/components/ui/badge'
import { analyticsApi, dispatchApi } from '@/app/lib/api/endpoints'

interface AnalyticsData {
  createdToday: number
  completedToday: number
  onlineNurses: number
  availableNurses: number
  urgentPending: number
  completionRate: number
  dailySeries: any[]
  statusBreakdown?: { PENDING: number; ASSIGNED: number; IN_PROGRESS: number; COMPLETED: number; CANCELLED: number }
  priorityBreakdown?: { LOW: number; MEDIUM: number; HIGH: number; URGENT: number }
  nursePerformance?: any[]
}

const emptyStatusBreakdown = {
  PENDING: 0,
  ASSIGNED: 0,
  IN_PROGRESS: 0,
  COMPLETED: 0,
  CANCELLED: 0,
}

const emptyPriorityBreakdown = {
  LOW: 0,
  MEDIUM: 0,
  HIGH: 0,
  URGENT: 0,
}

export default function DashboardPage() {
  const router = useRouter()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [recentDispatches, setRecentDispatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, dispatchesRes] = await Promise.all([
        analyticsApi.get(),
        dispatchApi.list()
      ])

      if (!analyticsRes.ok || !analyticsRes.data) {
        if (analyticsRes.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch dashboard data')
      }

      const { data } = analyticsRes.data
      setAnalyticsData({
        createdToday: data.createdToday || 0,
        completedToday: data.completedToday || 0,
        onlineNurses: data.onlineNurses || 0,
        availableNurses: data.availableNurses || 0,
        urgentPending: data.urgentPending || 0,
        completionRate: data.completionRate || 0,
        dailySeries: data.dailySeries || [],
        statusBreakdown: { ...emptyStatusBreakdown, ...data.statusBreakdown },
        priorityBreakdown: { ...emptyPriorityBreakdown, ...data.priorityBreakdown },
        nursePerformance: data.nursePerformance || [],
      })

      if (dispatchesRes.ok && dispatchesRes.data) {
        const sorted = [...dispatchesRes.data.data].sort((a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        setRecentDispatches(sorted.slice(0, 10))
      }

      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-8 w-8 text-red-600" />
          <h2 className="mb-2 font-semibold text-red-900">Error loading dashboard</h2>
          <p className="text-sm text-red-800 mb-4">{error}</p>
          <button
            onClick={() => {
              setLoading(true)
              setError(null)
              fetchDashboardData()
            }}
            className="text-sm font-medium text-red-700 hover:text-red-900"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Smart Dashboard</h1>
          <p className="mt-2 text-gray-600">
            AI-powered operational overview with predictive insights
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true)
            fetchDashboardData()
          }}
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Smart Insights (AI-powered) */}
      <div className="rounded-lg border bg-gradient-to-br from-indigo-50 to-blue-50 p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
          <span>🤖 AI-Powered Insights</span>
        </h2>
        <SmartInsights data={analyticsData!} />
      </div>

      {/* KPI Cards with updated metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KPICard
          title="Dispatches Today"
          value={analyticsData?.createdToday || 0}
          description="Created today"
          trend={{ value: 10, isPositive: true }}
        />
        <KPICard
          title="Completion Rate"
          value={`${analyticsData?.completionRate || 0}%`}
          description={`${analyticsData?.completedToday || 0} completed`}
          trend={{ value: 5, isPositive: analyticsData?.completionRate ? analyticsData.completionRate > 70 : false }}
        />
        <KPICard
          title="Online Nurses"
          value={analyticsData?.onlineNurses || 0}
          description="Active staff"
          trend={{ value: 2, isPositive: true }}
        />
        <KPICard
          title="Available Nurses"
          value={analyticsData?.availableNurses || 0}
          description="Ready for assignment"
          trend={{ value: 1, isPositive: true }}
        />
        <KPICard
          title="Urgent Pending"
          value={analyticsData?.urgentPending || 0}
          description="Need assignment"
          trend={{ value: 1, isPositive: false }}
          variant="warning"
        />
      </div>

      {/* Advanced Analytics */}
      <AdvancedAnalytics
        data={analyticsData?.dailySeries}
        title="30-Day Dispatch Analytics"
      />

      {/* Performance Metrics Grid */}
      <PerformanceMetrics
        statusBreakdown={analyticsData?.statusBreakdown}
        priorityBreakdown={analyticsData?.priorityBreakdown}
      />

      {/* Charts & Live Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm overflow-hidden flex flex-col min-h-[350px]">
          <h2 className="mb-4 text-lg font-semibold">Live Nurse Status</h2>
          <div className="flex-1 overflow-y-auto">
            <NurseMatrix />
          </div>
        </div>

        <NursePerformance
          data={analyticsData?.nursePerformance}
          title="Top Performers"
        />
      </div>

      {/* Recent Dispatches */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Dispatches</h2>
          <p className="text-xs text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="overflow-x-auto p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned Nurse</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDispatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    No recent dispatches.
                  </TableCell>
                </TableRow>
              ) : (
                recentDispatches.map((dispatch) => (
                  <TableRow key={dispatch.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{dispatch.patient?.name}</TableCell>
                    <TableCell>
                      <Badge variant={
                        dispatch.status === 'COMPLETED' ? 'default' :
                          dispatch.status === 'CANCELLED' ? 'destructive' :
                            'secondary'
                      }>
                        {dispatch.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={dispatch.priority === 'URGENT' ? 'destructive' : 'outline'}>
                        {dispatch.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {dispatch.nurse?.name || (
                        <span className="text-gray-400 text-sm">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(dispatch.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer with stats */}
      <div className="rounded-lg border bg-gradient-to-r from-gray-50 to-gray-100 p-6">
        <p className="text-xs text-gray-600 text-center">
          Dashboard automatically updates every 5 minutes.
          Last refresh: {lastUpdated.toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}
