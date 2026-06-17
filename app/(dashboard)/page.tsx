// app/(dashboard)/page.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts'
import {
  RefreshCw, Activity, AlertTriangle, Users, TrendingUp, Clock, ChevronRight, Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DarkKPICard } from '@/app/components/dashboard/DarkKPICard'
import { ActivityFeedWidget } from '@/app/components/dashboard/ActivityFeedWidget'
import { DepartmentGrid } from '@/app/components/dashboard/DepartmentGrid'
import { LoadingSpinner } from '@/app/components/common/LoadingSpinner'
import { analyticsApi, dispatchApi } from '@/app/lib/api/endpoints'

interface ActivityItem {
  id: string
  type: string
  message: string
  timestamp: string
  userId?: string
  userName?: string
  entityId?: string
}

interface DepartmentItem {
  id: string
  name: string
  userCount: number
  taskCount: number
  activeTaskCount: number
  completionRate: number
}

interface DashboardState {
  createdToday: number
  completedToday: number
  onlineNurses: number
  availableNurses: number
  urgentPending: number
  completionRate: number
  dailySeries: { date: string; created: number; completed: number }[]
  statusBreakdown: Record<string, number>
  priorityBreakdown: Record<string, number>
  nursePerformance: { nurseId: string; nurseName: string; completed: number; avgTime: number }[]
  realTime: { activeUsersNow: number; onlineNurses: number; onlineDispatchers: number; currentActiveTasks: number; urgentTasks: number; recentlyCompleted: number }
  executive: { totalUsers: number; activeUsers: number; onlineUsers: number; totalTasks: number; systemHealthScore: number }
  insights: { id: string; type: string; title: string; description: string; metric?: number }[]
  departments: DepartmentItem[]
  activityFeed: ActivityItem[]
}

const STATUS_COLORS: Record<string, string> = { PENDING: '#f59e0b', ASSIGNED: '#6366f1', IN_PROGRESS: '#0ea5e9', COMPLETED: '#10b981', CANCELLED: '#ef4444' }
const PRIORITY_COLORS: Record<string, string> = { LOW: '#6b7280', MEDIUM: '#eab308', HIGH: '#f97316', URGENT: '#ef4444' }


function statusColor(status: string) {
  switch (status) {
    case 'COMPLETED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    case 'CANCELLED': return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    case 'IN_PROGRESS': return 'text-sky-400 bg-sky-500/10 border-sky-500/20'
    case 'ASSIGNED': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
    default: return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  }
}

function priorityColor(priority: string) {
  switch (priority) {
    case 'URGENT': return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    case 'HIGH': return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
    case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
  }
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-white/[0.06] bg-slate-900/90 backdrop-blur-md p-3 shadow-xl text-xs">
      <p className="text-slate-400 mb-2">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="font-semibold text-slate-100">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardState | null>(null)
  const [recentDispatches, setRecentDispatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchData = async () => {
    try {
      const [analyticsRes, dispatchesRes] = await Promise.all([
        analyticsApi.getFull(),
        dispatchApi.list(),
      ])

      if (!analyticsRes.ok || !analyticsRes.data) {
        if (analyticsRes.status === 401) { router.push('/login'); return }
        throw new Error('Failed to fetch dashboard data')
      }

      const d = analyticsRes.data.data
      setData({
        createdToday: d.dashboard.createdToday,
        completedToday: d.dashboard.completedToday,
        onlineNurses: d.dashboard.onlineNurses,
        availableNurses: d.dashboard.availableNurses,
        urgentPending: d.dashboard.urgentPending,
        completionRate: d.dashboard.completionRate,
        dailySeries: d.dashboard.dailySeries || [],
        statusBreakdown: { PENDING: 0, ASSIGNED: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0, ...d.dashboard.statusBreakdown },
        priorityBreakdown: { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0, ...d.dashboard.priorityBreakdown },
        nursePerformance: d.dashboard.nursePerformance || [],
        realTime: d.realTime,
        executive: d.executive,
        insights: d.insights || [],
        departments: d.departments.departments || [],
        activityFeed: d.activityFeed || [],
      })

      if (dispatchesRes.ok && dispatchesRes.data) {
        setRecentDispatches(
          [...dispatchesRes.data.data]
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 8)
        )
      }

      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [router])

  const occupancyRate = useMemo(() => {
    if (!data || data.onlineNurses === 0) return 0
    return Math.round(((data.onlineNurses - data.availableNurses) / data.onlineNurses) * 100)
  }, [data])

  const statusChartData = useMemo(() => {
    if (!data) return []
    return Object.entries(data.statusBreakdown).map(([name, value]) => ({ name, value }))
  }, [data])

  const priorityChartData = useMemo(() => {
    if (!data) return []
    return Object.entries(data.priorityBreakdown).map(([name, value]) => ({ name, value }))
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-8 text-center max-w-md">
          <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-rose-400" />
          <h2 className="mb-2 font-semibold text-slate-100">Error loading dashboard</h2>
          <p className="text-sm text-slate-400 mb-4">{error}</p>
          <button onClick={() => { setLoading(true); setError(null); fetchData() }}
            className="rounded-lg border border-white/[0.06] bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition">
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Smart Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time operational overview with live data</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600">Updated {lastUpdated.toLocaleTimeString()}</span>
          <button onClick={() => { setLoading(true); fetchData() }}
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-slate-800/50 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700/50 transition">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DarkKPICard
          title="Active Nurses"
          value={data.realTime.onlineNurses}
          subtitle={`${data.realTime.onlineDispatchers} dispatchers online`}
          icon={<Activity className="h-4 w-4" />}
          variant="default"
        />
        <DarkKPICard
          title="Urgent Tasks"
          value={data.realTime.urgentTasks}
          subtitle={`${data.realTime.currentActiveTasks} active total`}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant="warning"
        />
        <DarkKPICard
          title="System Activity"
          value={data.realTime.currentActiveTasks}
          subtitle={`${data.realTime.recentlyCompleted} completed today`}
          icon={<TrendingUp className="h-4 w-4" />}
          variant="success"
        />
        <DarkKPICard
          title="Occupancy Rate"
          value={`${occupancyRate}%`}
          subtitle={`${data.availableNurses} nurses available`}
          icon={<Users className="h-4 w-4" />}
          trend={{ value: data.completionRate, isPositive: data.completionRate >= 50 }}
          variant="danger"
        />
      </div>

      {/* ── Smart Insights ──────────────────────── */}
      {data.insights.length > 0 && (
        <div className="rounded-xl border border-indigo-500/10 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-100">AI-Powered Insights</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.insights.map(insight => (
              <div key={insight.id} className={cn(
                'rounded-lg border p-4',
                insight.type === 'positive' ? 'border-emerald-500/20 bg-emerald-500/5' :
                insight.type === 'negative' ? 'border-rose-500/20 bg-rose-500/5' :
                'border-amber-500/20 bg-amber-500/5'
              )}>
                <span className={cn(
                  'text-xs font-semibold uppercase tracking-wider',
                  insight.type === 'positive' ? 'text-emerald-400' :
                  insight.type === 'negative' ? 'text-rose-400' : 'text-amber-400'
                )}>
                  {insight.type}
                </span>
                <h4 className="text-sm font-medium text-slate-200 mt-2">{insight.title}</h4>
                <p className="text-xs text-slate-500 mt-1">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Charts ──────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Daily Series Line Chart */}
        <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-100">30-Day Dispatch Trend</h3>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="h-2 w-2 rounded-full bg-indigo-500" /> Created
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Completed
              </span>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="created" stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#6366f1' }} name="Created" />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#10b981' }} name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown Pie + Priority Bar */}
        <div className="space-y-5">
          {/* Status donut */}
          <div className="rounded-xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-sm p-5">
            <h3 className="text-sm font-semibold text-slate-100 mb-3">Status Distribution</h3>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {statusChartData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#6366f1'} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {statusChartData.map(s => (
                <span key={s.name} className="flex items-center gap-1 text-[11px] text-slate-500">
                  <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[s.name] }} />
                  {s.name} ({s.value})
                </span>
              ))}
            </div>
          </div>

          {/* Priority bar */}
          <div className="rounded-xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-sm p-5">
            <h3 className="text-sm font-semibold text-slate-100 mb-3">Priority Breakdown</h3>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {priorityChartData.map((entry) => (
                      <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Task Feed + Activity Feed ────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Task Feed */}
        <div className="rounded-xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-100">Recent Tasks</h3>
            <Clock className="h-3.5 w-3.5 text-slate-600" />
          </div>
          {recentDispatches.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-6">No recent dispatches</p>
          ) : (
            <div className="space-y-1">
              {recentDispatches.map((d: any) => (
                <div key={d.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-800/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-200 truncate">{d.patient?.name || 'Unknown'}</span>
                      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border', statusColor(d.status))}>{d.status}</span>
                      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border', priorityColor(d.priority))}>{d.priority}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {d.nurse?.name || 'Unassigned'} · {new Date(d.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-700 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <ActivityFeedWidget items={data.activityFeed} />
      </div>

      {/* ── Department Grid ─────────────────────── */}
      <DepartmentGrid departments={data.departments} />

      {/* ── Nurse Performance ────────────────────── */}
      {data.nursePerformance.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-100">Top Performing Nurses</h3>
            <TrendingUp className="h-4 w-4 text-slate-500" />
          </div>
          <div className="space-y-2">
            {data.nursePerformance.slice(0, 5).map((nurse, idx) => (
              <div key={nurse.nurseId} className="flex items-center gap-4 rounded-lg px-4 py-3 bg-slate-800/20">
                <span className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                  idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                  idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                  idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                  'bg-slate-700/50 text-slate-500'
                )}>{idx + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200">{nurse.nurseName}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500">{nurse.completed} completed</span>
                    <span className="text-xs text-slate-500">Avg {nurse.avgTime}h</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                      style={{ width: `${Math.min(100, (nurse.completed / (data.nursePerformance[0]?.completed || 1)) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-400 w-8 text-right">
                    {data.nursePerformance[0]?.completed ? Math.round((nurse.completed / data.nursePerformance[0].completed) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer ──────────────────────────────── */}
      <div className="rounded-xl border border-white/[0.06] bg-slate-900/20 p-4">
        <p className="text-xs text-slate-600 text-center">
          Data refreshes automatically. Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}
