'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import { DataTable } from '@/app/components/common/DataTable'
import { LoadingSpinner } from '@/app/components/common/LoadingSpinner'
import { AnalyticsPayload } from '@/types'
import { BarChart3, Download, TrendingUp } from 'lucide-react'
import { analyticsApi } from '@/app/lib/api/endpoints'

interface AnalyticsData extends AnalyticsPayload {
  completedToday: number
  availableNurses: number
  urgentPending: number
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#94a3b8',
  ASSIGNED: '#3b82f6',
  IN_PROGRESS: '#a855f7',
  COMPLETED: '#10b981',
  CANCELLED: '#f43f5e',
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#94a3b8',
}

function toLocalDatetimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const today = new Date()
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const [from, setFrom] = useState(toLocalDatetimeString(sevenDaysAgo))
  const [to, setTo] = useState(toLocalDatetimeString(today))

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const days = Math.max(1, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (24 * 60 * 60 * 1000)))
      const range = days <= 7 ? '7d' : days <= 30 ? '30d' : '90d'
      const result = await analyticsApi.get({ range })
      if (!result.ok || !result.data) throw new Error(result.error?.message || 'Failed to fetch analytics')
      setData(result.data.data)
    } catch (e) {
      setError('Failed to load analytics data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const exportCSV = () => {
    if (!data) return
    const rows = [
      ['Date', 'Created', 'Completed'],
      ...data.dailySeries.map((d) => [d.date, d.created, d.completed]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cure-analytics-${from}-to-${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const statusChartData = data
    ? Object.entries(data.statusBreakdown).map(([name, value]) => ({ name, value }))
    : []

  const priorityChartData = data
    ? Object.entries(data.priorityBreakdown).map(([name, value]) => ({
        name,
        value,
        color: PRIORITY_COLORS[name] ?? '#94a3b8',
      }))
    : []

  const tableColumns = [
    { header: 'Date', accessorKey: 'date', sortable: true },
    { header: 'Created', accessorKey: 'created', sortable: true },
    { header: 'Completed', accessorKey: 'completed', sortable: true },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-600/25">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500">Operational performance insights</p>
          </div>
        </div>

        {/* Date Range Picker */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <label className="font-semibold text-gray-500 text-xs uppercase tracking-wider">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label className="font-semibold text-gray-500 text-xs uppercase tracking-wider">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <button
            onClick={exportCSV}
            disabled={!data}
            className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
          {error}
          <button onClick={fetchData} className="ml-3 font-semibold underline">Retry</button>
        </div>
      ) : data ? (
        <>
          {/* Row 1: Line chart + Donut */}
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Line Chart — 3/5 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-3">
              <div className="mb-5">
                <h3 className="text-base font-bold text-gray-900">Dispatches Over Time</h3>
                <p className="text-xs text-gray-500">Created vs completed per day</p>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.dailySeries} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(v) => {
                      const d = new Date(v)
                      return `${d.getMonth() + 1}/${d.getDate()}`
                    }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="created" name="Created" stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Donut — 2/5 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="mb-5">
                <h3 className="text-base font-bold text-gray-900">Status Distribution</h3>
                <p className="text-xs text-gray-500">Current snapshot</p>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={index} fill={STATUS_COLORS[entry.name] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2: Priority Bar + Nurse Performance */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Priority Breakdown */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h3 className="text-base font-bold text-gray-900">Priority Breakdown</h3>
                <p className="text-xs text-gray-500">Active dispatches by urgency</p>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={priorityChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Bar dataKey="value" name="Dispatches" radius={[6, 6, 0, 0]}>
                    {priorityChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Nurse Performance — Horizontal Bar */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h3 className="text-base font-bold text-gray-900">Nurse Performance</h3>
                <p className="text-xs text-gray-500">Completed dispatches this month</p>
              </div>
              {data.nursePerformance.length === 0 ? (
                <div className="flex h-[220px] items-center justify-center text-sm text-gray-400">
                  No completed dispatches this month.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    layout="vertical"
                    data={data.nursePerformance}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={90}
                      tick={{ fontSize: 11, fill: '#374151' }}
                    />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Bar dataKey="completed" name="Completed" fill="#6366f1" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Daily Report Table */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              <div>
                <h3 className="text-base font-bold text-gray-900">Daily Report</h3>
                <p className="text-xs text-gray-500">Dispatch counts per day in selected range</p>
              </div>
            </div>
            <DataTable
              data={data.dailySeries}
              columns={tableColumns}
              searchKey="date"
              searchPlaceholder="Search by date…"
            />
          </div>
        </>
      ) : null}
    </div>
  )
}
