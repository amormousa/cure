// app/components/dashboard/SmartInsights.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { AlertCircle, TrendingUp, Lightbulb, Clock, Users, Activity } from 'lucide-react'
import { LoadingSpinner } from '@/app/components/common/LoadingSpinner'

interface Insight {
  type: 'warning' | 'tip' | 'trend'
  title: string
  description: string
  icon: React.ReactNode
  action?: string
}

interface SmartInsightsProps {
  data?: {
    urgentPending: number
    completionRate: number
    onlineNurses: number
    availableNurses: number
    createdToday: number
    completedToday: number
  }
}

export function SmartInsights({ data }: SmartInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!data) return

    const generatedInsights: Insight[] = []

    // Insight 1: Urgent dispatches alert
    if (data.urgentPending > 3) {
      generatedInsights.push({
        type: 'warning',
        title: '⚠️ High Urgent Load',
        description: `${data.urgentPending} urgent dispatches pending. Consider prioritizing or calling additional staff.`,
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        action: 'View Urgent Queue',
      })
    }

    // Insight 2: Completion rate trend
    if (data.completionRate > 80) {
      generatedInsights.push({
        type: 'trend',
        title: '📈 Excellent Performance',
        description: `Completion rate at ${data.completionRate}%. Your team is performing well above target.`,
        icon: <TrendingUp className="h-5 w-5 text-green-500" />,
      })
    } else if (data.completionRate < 60) {
      generatedInsights.push({
        type: 'warning',
        title: '📉 Low Completion Rate',
        description: `Only ${data.completionRate}% of dispatches completed. Review assignments and timelines.`,
        icon: <AlertCircle className="h-5 w-5 text-orange-500" />,
        action: 'Review Details',
      })
    }

    // Insight 3: Nurse availability
    const availabilityRate = data.onlineNurses > 0 ? Math.round((data.availableNurses / data.onlineNurses) * 100) : 0
    if (availabilityRate < 30 && data.onlineNurses > 0) {
      generatedInsights.push({
        type: 'warning',
        title: '👥 Low Nurse Availability',
        description: `Only ${availabilityRate}% of online nurses are available. Current workload is high.`,
        icon: <Users className="h-5 w-5 text-orange-500" />,
      })
    }

    // Insight 4: Workload prediction
    const avgDaily = data.createdToday > 0 ? data.createdToday : 5
    if (data.createdToday > avgDaily * 1.5) {
      generatedInsights.push({
        type: 'tip',
        title: '💡 Peak Load Detected',
        description: `Today's dispatch rate is 50% higher than average. Ensure adequate staffing.`,
        icon: <Lightbulb className="h-5 w-5 text-blue-500" />,
      })
    }

    // Insight 5: Completion time suggestion
    if (data.completedToday > 0 && data.createdToday > data.completedToday) {
      generatedInsights.push({
        type: 'tip',
        title: '⏱️ Optimize Schedule',
        description: `${data.createdToday - data.completedToday} dispatches still in progress. Average completion time is increasing.`,
        icon: <Clock className="h-5 w-5 text-blue-500" />,
      })
    }

    setInsights(generatedInsights.slice(0, 4)) // Show top 4 insights
    setLoading(false)
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <LoadingSpinner />
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div className="rounded-lg border bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 p-6 text-center">
        <Activity className="mx-auto mb-3 h-6 w-6 text-green-600" />
        <p className="text-sm font-medium text-green-900">✨ All systems operational</p>
        <p className="text-xs text-green-700 mt-1">No actionable insights at this time</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {insights.map((insight, idx) => (
        <div
          key={idx}
          className={`rounded-lg border p-4 flex gap-4 transition-all ${
            insight.type === 'warning'
              ? 'bg-red-50 border-red-200'
              : insight.type === 'tip'
              ? 'bg-blue-50 border-blue-200'
              : 'bg-green-50 border-green-200'
          }`}
        >
          <div className="flex-shrink-0 mt-1">{insight.icon}</div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold text-sm mb-1 ${
              insight.type === 'warning'
                ? 'text-red-900'
                : insight.type === 'tip'
                ? 'text-blue-900'
                : 'text-green-900'
            }`}>
              {insight.title}
            </h4>
            <p className={`text-xs ${
              insight.type === 'warning'
                ? 'text-red-800'
                : insight.type === 'tip'
                ? 'text-blue-800'
                : 'text-green-800'
            }`}>
              {insight.description}
            </p>
            {insight.action && (
              <button className={`mt-2 text-xs font-medium px-2 py-1 rounded transition-colors ${
                insight.type === 'warning'
                  ? 'text-red-700 hover:bg-red-100'
                  : insight.type === 'tip'
                  ? 'text-blue-700 hover:bg-blue-100'
                  : 'text-green-700 hover:bg-green-100'
              }`}>
                {insight.action} →
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
