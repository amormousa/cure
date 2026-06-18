// app/components/dashboard/AdvancedDataInsights.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { TrendingUp, AlertTriangle, Zap, Target, BarChart3, Brain } from 'lucide-react'
import { LoadingSpinner } from '@/app/components/common/LoadingSpinner'
import { Badge } from '@/app/components/ui/badge'

interface AdvancedInsight {
  category: 'prediction' | 'optimization' | 'risk' | 'efficiency'
  title: string
  description: string
  icon: React.ReactNode
  priority: 'critical' | 'high' | 'medium' | 'low'
  metrics?: {
    label: string
    value: string | number
    unit?: string
  }[]
  action?: string
}

interface AdvancedDataInsightsProps {
  data?: any
}

export function AdvancedDataInsights({ data }: AdvancedDataInsightsProps) {
  const [insights, setInsights] = useState<AdvancedInsight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!data) {
      setLoading(false)
      return
    }

    const generatedInsights: AdvancedInsight[] = []

    // Prediction Insights
    if (data.predictions?.expectedDispatchesNext7Days > 50) {
      generatedInsights.push({
        category: 'prediction',
        title: '📊 High Volume Expected',
        description: `${data.predictions.expectedDispatchesNext7Days} dispatches predicted for next 7 days`,
        icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
        priority: 'high',
        metrics: [
          { label: 'Expected Dispatches', value: data.predictions.expectedDispatchesNext7Days },
          { label: 'Resource Requirement', value: `${data.predictions.expectedResourceRequirementPercent}%` },
        ],
      })
    }

    // Efficiency Insights
    if (data.efficiencyMetrics?.resourceUtilization > 80) {
      generatedInsights.push({
        category: 'efficiency',
        title: '⚡ High Resource Utilization',
        description: `Resources are being used at ${data.efficiencyMetrics.resourceUtilization}% capacity`,
        icon: <Zap className="h-5 w-5 text-orange-500" />,
        priority: 'high',
        metrics: [
          { label: 'Utilization', value: `${data.efficiencyMetrics.resourceUtilization}%` },
          { label: 'Productivity', value: `${data.efficiencyMetrics.overallProductivity}%` },
        ],
      })
    }

    // Risk Assessment
    if (data.qualityMetrics?.patientSatisfactionScore < 3.5) {
      generatedInsights.push({
        category: 'risk',
        title: '⚠️ Low Satisfaction Score',
        description: `Patient satisfaction at ${data.qualityMetrics.patientSatisfactionScore}/5 - needs improvement`,
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
        priority: 'critical',
        metrics: [
          { label: 'Satisfaction Score', value: data.qualityMetrics.patientSatisfactionScore, unit: '/5' },
          { label: 'Service Quality', value: data.qualityMetrics.serviceQualityRating, unit: '/5' },
        ],
        action: 'Review feedback',
      })
    }

    // Optimization Opportunities
    if (data.dispatchAnalytics?.avgCompletionTime > 4) {
      generatedInsights.push({
        category: 'optimization',
        title: '🎯 Optimize Completion Time',
        description: `Average completion time is ${data.dispatchAnalytics.avgCompletionTime} hours - consider optimization`,
        icon: <Target className="h-5 w-5 text-purple-500" />,
        priority: 'medium',
        metrics: [
          { label: 'Avg Time', value: data.dispatchAnalytics.avgCompletionTime, unit: 'hours' },
          { label: 'On-Time Rate', value: `${data.dispatchAnalytics.onTimeCompletionRate}%` },
        ],
      })
    }

    // Performance Insights
    if (data.nursePerformance?.[0]) {
      const topNurse = data.nursePerformance[0]
      generatedInsights.push({
        category: 'efficiency',
        title: `⭐ Top Performer: ${topNurse.name}`,
        description: `${topNurse.completedDispatches} completed with ${Math.round(topNurse.rating * 10) / 10}/5 rating`,
        icon: <Brain className="h-5 w-5 text-green-500" />,
        priority: 'low',
        metrics: [
          { label: 'Completed', value: topNurse.completedDispatches },
          { label: 'Rating', value: Math.round(topNurse.rating * 10) / 10, unit: '/5' },
          { label: 'Availability', value: `${topNurse.availability}%` },
        ],
      })
    }

    setInsights(generatedInsights)
    setLoading(false)
  }, [data])

  if (loading) {
    return <LoadingSpinner />
  }

  if (insights.length === 0) {
    return (
      <div className="rounded-lg border bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-600">No advanced insights available yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        Advanced Data Insights
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className={`rounded-lg border p-4 ${insight.priority === 'critical'
                ? 'border-red-200 bg-red-50'
                : insight.priority === 'high'
                  ? 'border-orange-200 bg-orange-50'
                  : insight.priority === 'medium'
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-green-200 bg-green-50'
              }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {insight.icon}
                <h4
                  className={`font-semibold text-sm ${insight.priority === 'critical'
                      ? 'text-red-900'
                      : insight.priority === 'high'
                        ? 'text-orange-900'
                        : insight.priority === 'medium'
                          ? 'text-yellow-900'
                          : 'text-green-900'
                    }`}
                >
                  {insight.title}
                </h4>
              </div>
              <Badge
                variant={insight.priority === 'critical' ? 'destructive' : 'outline'}
                className="text-xs"
              >
                {insight.priority.toUpperCase()}
              </Badge>
            </div>

            <p
              className={`text-xs mb-3 ${insight.priority === 'critical'
                  ? 'text-red-800'
                  : insight.priority === 'high'
                    ? 'text-orange-800'
                    : insight.priority === 'medium'
                      ? 'text-yellow-800'
                      : 'text-green-800'
                }`}
            >
              {insight.description}
            </p>

            {insight.metrics && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {insight.metrics.map((metric, midx) => (
                  <div key={midx} className="text-xs">
                    <p className="text-gray-600">{metric.label}</p>
                    <p className="font-bold text-sm">
                      {metric.value}
                      {metric.unit && <span className="text-xs ml-1">{metric.unit}</span>}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {insight.action && (
              <button className="text-xs font-medium text-blue-600 hover:text-blue-900">
                {insight.action} →
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
