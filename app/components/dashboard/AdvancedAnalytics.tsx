// app/components/dashboard/AdvancedAnalytics.tsx
'use client'

import React from 'react'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface AnalyticsDataPoint {
  date: string
  created: number
  completed: number
  pending: number
}

interface AdvancedAnalyticsProps {
  data?: AnalyticsDataPoint[]
  title?: string
  showTrend?: boolean
}

export function AdvancedAnalytics({ data, title = 'Dispatch Analytics (30 Days)', showTrend = true }: AdvancedAnalyticsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">{title}</h3>
        <div className="flex items-center justify-center min-h-[300px] text-gray-500">
          No analytics data available
        </div>
      </div>
    )
  }

  // Calculate derived metrics
  const analyticsWithMetrics = data.map((d, idx) => {
    const completionRate = d.created > 0 ? Math.round((d.completed / d.created) * 100) : 0
    const pendingRate = d.created > 0 ? Math.round((d.pending / d.created) * 100) : 0
    return {
      ...d,
      completionRate,
      pendingRate,
      efficiency: completionRate,
    }
  })

  // Calculate averages
  const avgCreated = Math.round(analyticsWithMetrics.reduce((sum, d) => sum + d.created, 0) / data.length)
  const avgCompleted = Math.round(analyticsWithMetrics.reduce((sum, d) => sum + d.completed, 0) / data.length)
  const avgCompletion = Math.round(analyticsWithMetrics.reduce((sum, d) => sum + d.completionRate, 0) / data.length)

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">{title}</h3>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4 border border-blue-200">
            <p className="text-xs text-blue-700 font-semibold">Avg Daily Created</p>
            <p className="text-2xl font-bold text-blue-900 mt-2">{avgCreated}</p>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-4 border border-green-200">
            <p className="text-xs text-green-700 font-semibold">Avg Daily Completed</p>
            <p className="text-2xl font-bold text-green-900 mt-2">{avgCompleted}</p>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-4 border border-purple-200">
            <p className="text-xs text-purple-700 font-semibold">Avg Completion Rate</p>
            <p className="text-2xl font-bold text-purple-900 mt-2">{avgCompletion}%</p>
          </div>
        </div>

        {/* Chart */}
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analyticsWithMetrics} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelFormatter={(val) => new Date(val).toLocaleDateString()}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Area
                type="monotone"
                dataKey="created"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorCreated)"
                name="Created"
              />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorCompleted)"
                name="Completed"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Indicator */}
        {showTrend && analyticsWithMetrics.length > 1 && (
          <div className="mt-6 pt-6 border-t space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Trend (Last 7 Days)</span>
              <span className="font-semibold text-green-600">
                ↑ {Math.round((analyticsWithMetrics[analyticsWithMetrics.length - 1].completionRate - analyticsWithMetrics[Math.max(0, analyticsWithMetrics.length - 8)].completionRate))}% improvement
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
