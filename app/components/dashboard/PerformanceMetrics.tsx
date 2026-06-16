// app/components/dashboard/PerformanceMetrics.tsx
'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface PerformanceMetricsProps {
  statusBreakdown?: {
    PENDING: number
    ASSIGNED: number
    IN_PROGRESS: number
    COMPLETED: number
    CANCELLED: number
  }
  priorityBreakdown?: {
    LOW: number
    MEDIUM: number
    HIGH: number
    URGENT: number
  }
}

const STATUS_COLORS = {
  PENDING: '#fbbf24',
  ASSIGNED: '#60a5fa',
  IN_PROGRESS: '#34d399',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
}

const PRIORITY_COLORS = {
  LOW: '#d1d5db',
  MEDIUM: '#60a5fa',
  HIGH: '#f97316',
  URGENT: '#ef4444',
}

export function PerformanceMetrics({ statusBreakdown, priorityBreakdown }: PerformanceMetricsProps) {
  const statusData = statusBreakdown
    ? Object.entries(statusBreakdown).map(([status, count]) => ({
      name: status,
      count,
    }))
    : []

  const priorityData = priorityBreakdown
    ? Object.entries(priorityBreakdown).map(([priority, count]) => ({
      name: priority,
      count,
    }))
    : []

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Status Breakdown */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Dispatch Status Distribution</h3>
        <div className="flex items-center justify-center min-h-[300px]">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={12} stroke="#9ca3af" />
              <YAxis fontSize={12} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [value, 'Count']}
              />
              <Bar
                dataKey="count"
                radius={[8, 8, 0, 0]}
                fill="#4f46e5"
                shape={
                  <rect
                    fill={(props: any) => STATUS_COLORS[props.payload?.name as keyof typeof STATUS_COLORS] || '#4f46e5'}
                  />
                }
              >
                {statusData.map((entry, index) => (
                  <Cell key={index} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Priority Distribution */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Priority Breakdown</h3>
        <div className="flex items-center justify-center min-h-[300px]">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="count"
                label={({ name, count }) => `${name}: ${count}`}
                labelLine={false}
              >
                {priorityData.map((entry, index) => (
                  <Cell key={index} fill={PRIORITY_COLORS[entry.name as keyof typeof PRIORITY_COLORS]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Count']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
