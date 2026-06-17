'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
} from 'recharts'
import { LoadingSpinner } from '@/app/components/common/LoadingSpinner'
import { analyticsApi, authApi, type FullAnalytics } from '@/app/lib/api/endpoints'
import {
  BarChart3, TrendingUp, TrendingDown, Users, Activity, Briefcase, HeartPulse,
  Clock, AlertTriangle, CheckCircle, Calendar, Zap, Brain, ArrowUp, ArrowDown,
  Target, Eye, RefreshCw, Download, Moon, Sun, Filter, ChevronDown
} from 'lucide-react'

// Color palette
const COLORS = {
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
  teal: '#14b8a6',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#94a3b8',
  ASSIGNED: '#3b82f6',
  IN_PROGRESS: '#8b5cf6',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#94a3b8',
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#8b5cf6',
  DISPATCHER: '#f97316',
  NURSE: '#3b82f6',
}

// Date range options
const DATE_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
]

// Animation keyframes
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

interface KPICardProps {
  title: string
  value: number | string
  change?: number
  icon: React.ElementType
  color: string
  prefix?: string
  suffix?: string
}

function KPICard({ title, value, change, icon: Icon, color, prefix = '', suffix = '' }: KPICardProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-sm p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{title}</p>
          <p className="text-3xl font-bold tracking-tight" style={{ color }}>
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'}`}>
              {isPositive ? <ArrowUp className="h-3 w-3" /> : isNegative ? <ArrowDown className="h-3 w-3" /> : null}
              <span>{Math.abs(change)}%</span>
              <span className="text-gray-400">vs last period</span>
            </div>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}/10 transition-transform group-hover:scale-110`}>
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-1 w-full transition-all duration-300 group-hover:h-1.5" style={{ backgroundColor: color }} />
    </div>
  )
}

interface RealTimeCardProps {
  title: string
  value: number
  icon: React.ElementType
  color: string
  pulse?: boolean
}

function RealTimeCard({ title, value, icon: Icon, color, pulse }: RealTimeCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white/60 p-4 backdrop-blur-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}/10`}>
        <Icon className={`h-5 w-5 ${pulse ? 'animate-pulse' : ''}`} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color }}>{value.toLocaleString()}</p>
        <p className="text-xs text-gray-500">{title}</p>
      </div>
    </div>
  )
}

interface InsightCardProps {
  type: 'positive' | 'negative' | 'neutral'
  title: string
  description: string
}

function InsightCard({ type, title, description }: InsightCardProps) {
  const colors = {
    positive: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600' },
    negative: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600' },
    neutral: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' },
  }
  const style = colors[type]
  const Icon = type === 'positive' ? TrendingUp : type === 'negative' ? TrendingDown : Brain

  return (
    <div className={`flex gap-3 rounded-xl border p-4 ${style.bg} ${style.border}`}>
      <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${style.icon}`} />
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  )
}

interface ActivityItemProps {
  type: string
  message: string
  timestamp: string
}

function ActivityItem({ type, message, timestamp }: ActivityItemProps) {
  const iconMap: Record<string, { icon: React.ElementType; color: string }> = {
    USER_CREATED: { icon: Users, color: COLORS.primary },
    USER_UPDATED: { icon: Users, color: COLORS.info },
    TASK_CREATED: { icon: Activity, color: COLORS.warning },
    TASK_COMPLETED: { icon: CheckCircle, color: COLORS.success },
    TASK_ASSIGNED: { icon: Briefcase, color: COLORS.purple },
    DEPARTMENT_UPDATED: { icon: Target, color: COLORS.teal },
  }
  const { icon: TypeIcon, color } = iconMap[type] || { icon: Activity, color: COLORS.primary }

  return (
    <div className="flex items-start gap-3 border-b border-gray-100 py-3 last:border-0">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
        <TypeIcon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm text-gray-800">{message}</p>
        <p className="text-xs text-gray-400">{timestamp}</p>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-white/80 p-6">
      <div className="h-4 w-24 rounded bg-gray-200" />
      <div className="mt-2 h-8 w-16 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-20 rounded bg-gray-200" />
    </div>
  )
}

function SkeletonChart() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-100 bg-white p-6">
      <div className="mb-4 h-4 w-32 rounded bg-gray-200" />
      <div className="flex h-64 items-end gap-2">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex-1 rounded-t bg-gray-200" style={{ height: `${Math.random() * 60 + 20}%` }} />
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState<FullAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState('30d')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchData = useCallback(async (showRefresh = false) => {
    // Check authentication first before fetching analytics
    const authResult = await authApi.getMe()

    // If not authenticated or any error, redirect to login
    if (!authResult.ok || !authResult.data) {
      router.replace('/login')
      return
    }

    if (showRefresh) setIsRefreshing(true)
    else setLoading(true)
    setError('')

    try {
      const result = await analyticsApi.getFull()
      if (!result.ok || !result.data?.data) {
        // Check if it's an auth error - redirect to login
        if (result.status === 401) {
          router.replace('/login')
          return
        }
        throw new Error(result.error?.message || 'Failed to fetch analytics')
      }
      setData(result.data.data)
      setLastUpdate(new Date())
    } catch (e) {
      setError('Failed to load analytics data. Please try again.')
      console.error(e)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchData(true), 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const exportCSV = () => {
    if (!data) return
    const rows = [
      ['Date', 'Created', 'Completed'],
      ...data.tasks.dailyTrend.map((d: { date: string; created: number; completed: number }) => [d.date, d.created, d.completed]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cure-analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const statusChartData = data?.tasks.byStatus.map((s: { status: string; count: number }) => ({
    name: s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] || '#94a3b8',
  })) || []

  const priorityChartData = data?.tasks.byPriority.map((p: { priority: string; count: number }) => ({
    name: p.priority,
    value: p.count,
    color: PRIORITY_COLORS[p.priority] || '#94a3b8',
  })) || []

  const roleChartData = data?.users.byRole.map((r: { role: string; count: number }) => ({
    name: r.role,
    value: r.count,
    color: ROLE_COLORS[r.role] || '#94a3b8',
  })) || []

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50 space-y-6 p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-600/25">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500">Real-time operational intelligence</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Selector */}
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none rounded-xl border border-gray-200 bg-white/80 px-4 py-2 pr-10 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {DATE_RANGES.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {/* Export Button */}
          <button
            onClick={exportCSV}
            disabled={!data}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-xl disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Last Update Indicator */}
      {lastUpdate && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Zap className="h-3 w-3" />
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          {/* KPI Skeletons */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          {/* Chart Skeletons */}
          <div className="grid gap-6 lg:grid-cols-2">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-200 bg-red-50/50 p-12 text-center backdrop-blur-sm">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <p className="text-lg font-semibold text-red-700">{error}</p>
          <button
            onClick={() => fetchData()}
            className="rounded-xl bg-red-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      ) : data ? (
        <>
          {/* Executive KPIs Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-gray-900">Executive Overview</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Total Users"
                value={data.executive.totalUsers}
                change={data.executive.changes.totalUsers}
                icon={Users}
                color={COLORS.primary}
              />
              <KPICard
                title="Active Users"
                value={data.executive.activeUsers}
                change={data.executive.changes.activeUsers}
                icon={Activity}
                color={COLORS.success}
              />
              <KPICard
                title="Online Now"
                value={data.executive.onlineUsers}
                icon={Zap}
                color={COLORS.warning}
              />
              <KPICard
                title="Completion Rate"
                value={data.executive.completionRate}
                change={data.executive.changes.completionRate}
                icon={Target}
                color={COLORS.teal}
                suffix="%"
              />
            </div>
          </section>

          {/* Secondary KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Total Tasks"
              value={data.executive.totalTasks}
              change={data.executive.changes.totalTasks}
              icon={Briefcase}
              color={COLORS.purple}
            />
            <KPICard
              title="Active Tasks"
              value={data.executive.activeTasks}
              icon={Clock}
              color={COLORS.info}
            />
            <KPICard
              title="Departments"
              value={data.executive.totalDepartments}
              icon={Target}
              color={COLORS.pink}
            />
            <KPICard
              title="Health Score"
              value={data.executive.systemHealthScore}
              icon={HeartPulse}
              color={COLORS.success}
              suffix="/100"
            />
          </div>

          {/* Real-Time Monitoring */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-bold text-gray-900">Real-Time Monitoring</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <RealTimeCard
                title="Active Users Now"
                value={data.realTime.activeUsersNow}
                icon={Users}
                color={COLORS.primary}
                pulse
              />
              <RealTimeCard
                title="Online Nurses"
                value={data.realTime.onlineNurses}
                icon={Activity}
                color={COLORS.success}
                pulse
              />
              <RealTimeCard
                title="Active Tasks"
                value={data.realTime.currentActiveTasks}
                icon={Briefcase}
                color={COLORS.warning}
              />
              <RealTimeCard
                title="Urgent Tasks"
                value={data.realTime.urgentTasks}
                icon={AlertTriangle}
                color={COLORS.danger}
              />
            </div>
          </section>

          {/* Charts Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-gray-900">Analytics Charts</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Task Trend */}
              <div className="rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">Task Trend</h3>
                    <p className="text-xs text-gray-500">Created vs Completed over time</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data.tasks.dailyTrend}>
                    <defs>
                      <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickFormatter={(v) => {
                        const d = new Date(v)
                        return `${d.getMonth() + 1}/${d.getDate()}`
                      }}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="created"
                      name="Created"
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCreated)"
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      name="Completed"
                      stroke={COLORS.success}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCompleted)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Status Distribution */}
              <div className="rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
                <div className="mb-4">
                  <h3 className="font-bold text-gray-900">Status Distribution</h3>
                  <p className="text-xs text-gray-500">Current task status breakdown</p>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusChartData.map((entry: { color: string }, index: number) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Priority Breakdown */}
              <div className="rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
                <div className="mb-4">
                  <h3 className="font-bold text-gray-900">Priority Breakdown</h3>
                  <p className="text-xs text-gray-500">Tasks by priority level</p>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={priorityChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="value" name="Tasks" radius={[6, 6, 0, 0]}>
                      {priorityChartData.map((entry: { color: string }, index: number) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* User Distribution by Role */}
              <div className="rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
                <div className="mb-4">
                  <h3 className="font-bold text-gray-900">User Distribution</h3>
                  <p className="text-xs text-gray-500">Users by role</p>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={roleChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {roleChartData.map((entry: { color: string }, index: number) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Smart Insights */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900">Smart Insights</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.insights.map((insight: { id: string; type: 'positive' | 'negative' | 'neutral'; title: string; description: string }) => (
                <InsightCard
                  key={insight.id}
                  type={insight.type}
                  title={insight.title}
                  description={insight.description}
                />
              ))}
            </div>
          </section>

          {/* Activity Timeline */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-gray-900">Activity Timeline</h2>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm max-h-96 overflow-y-auto">
              <div className="space-y-0 divide-y divide-gray-100">
                {data.activityFeed.map((item: { id: string; type: string; message: string; timestamp: string }) => (
                  <ActivityItem
                    key={item.id}
                    type={item.type}
                    message={item.message}
                    timestamp={formatTime(item.timestamp)}
                  />
                ))}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}