'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface Props {
  data: Record<string, number>
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  URGENT: { label: 'Urgent', color: '#ef4444' },
  HIGH: { label: 'High', color: '#f97316' },
  MEDIUM: { label: 'Medium', color: '#eab308' },
  LOW: { label: 'Low', color: '#94a3b8' },
}

export function PriorityBreakdownChart({ data }: Props) {
  const chartData = Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => ({
    priority: cfg.label,
    count: data[key] ?? 0,
    color: cfg.color,
  }))

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-bold text-gray-900">Priority Breakdown</h3>
        <p className="text-xs text-gray-500">Distribution by priority level</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="priority" tick={{ fontSize: 12, fill: '#94a3b8' }} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="count" name="Dispatches" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
export default PriorityBreakdownChart
