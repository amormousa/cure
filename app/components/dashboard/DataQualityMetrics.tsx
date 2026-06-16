// app/components/dashboard/DataQualityMetrics.tsx
'use client'

import React from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { CheckCircle, AlertCircle, TrendingDown } from 'lucide-react'

interface DataQualityMetricsProps {
  qualityMetrics?: {
    patientSatisfactionScore: number
    serviceQualityRating: number
    complianceRate: number
    incidentRate: number
  }
  efficiencyMetrics?: {
    resourceUtilization: number
    timeUtilization: number
    costPerDispatch: number
    dispatchesPerNurse: number
    overallProductivity: number
  }
}

export function DataQualityMetrics({ qualityMetrics, efficiencyMetrics }: DataQualityMetricsProps) {
  if (!qualityMetrics || !efficiencyMetrics) {
    return <div className="text-center text-gray-500">No metrics available</div>
  }

  // Prepare data for chart
  const metricData = [
    { name: 'Patient Satisfaction', value: qualityMetrics.patientSatisfactionScore * 20, fill: '#10b981' },
    { name: 'Service Quality', value: qualityMetrics.serviceQualityRating * 20, fill: '#3b82f6' },
    { name: 'Compliance', value: qualityMetrics.complianceRate, fill: '#8b5cf6' },
    { name: 'Resource Util.', value: efficiencyMetrics.resourceUtilization, fill: '#f59e0b' },
    { name: 'Productivity', value: efficiencyMetrics.overallProductivity, fill: '#06b6d4' },
  ]

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Quality & Efficiency Metrics</h3>

        {/* Quality Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Patient Satisfaction */}
          <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-4 border border-green-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-green-700 font-semibold">Patient Satisfaction</p>
                <p className="text-2xl font-bold text-green-900 mt-2">
                  {qualityMetrics.patientSatisfactionScore.toFixed(1)}/5
                </p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-xs text-green-700 mt-2">
              {qualityMetrics.patientSatisfactionScore >= 4 ? '✓ Excellent' : '⚠ Needs Improvement'}
            </p>
          </div>

          {/* Service Quality */}
          <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4 border border-blue-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-blue-700 font-semibold">Service Quality</p>
                <p className="text-2xl font-bold text-blue-900 mt-2">
                  {qualityMetrics.serviceQualityRating.toFixed(1)}/5
                </p>
              </div>
              <CheckCircle className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-xs text-blue-700 mt-2">
              {qualityMetrics.serviceQualityRating >= 4 ? '✓ High Quality' : '⚠ Review Needed'}
            </p>
          </div>

          {/* Compliance Rate */}
          <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-4 border border-purple-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-purple-700 font-semibold">Compliance Rate</p>
                <p className="text-2xl font-bold text-purple-900 mt-2">{qualityMetrics.complianceRate}%</p>
              </div>
              <CheckCircle className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-xs text-purple-700 mt-2">
              {qualityMetrics.complianceRate >= 95 ? '✓ Compliant' : '⚠ Below Target'}
            </p>
          </div>

          {/* Incident Rate */}
          <div className="rounded-lg bg-gradient-to-br from-red-50 to-red-100 p-4 border border-red-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-red-700 font-semibold">Incident Rate</p>
                <p className="text-2xl font-bold text-red-900 mt-2">{qualityMetrics.incidentRate}%</p>
              </div>
              {qualityMetrics.incidentRate > 2 ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
            <p className="text-xs text-red-700 mt-2">
              {qualityMetrics.incidentRate <= 2 ? '✓ Low Incidents' : '⚠ Investigate'}
            </p>
          </div>
        </div>

        {/* Efficiency Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 p-4 border border-orange-200">
            <p className="text-xs text-orange-700 font-semibold mb-2">Resource Utilization</p>
            <div className="w-full h-2 bg-orange-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all"
                style={{ width: `${Math.min(efficiencyMetrics.resourceUtilization, 100)}%` }}
              />
            </div>
            <p className="text-lg font-bold text-orange-900 mt-2">{efficiencyMetrics.resourceUtilization}%</p>
          </div>

          <div className="rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 border border-cyan-200">
            <p className="text-xs text-cyan-700 font-semibold mb-2">Productivity</p>
            <div className="w-full h-2 bg-cyan-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all"
                style={{ width: `${Math.min(efficiencyMetrics.overallProductivity, 100)}%` }}
              />
            </div>
            <p className="text-lg font-bold text-cyan-900 mt-2">{efficiencyMetrics.overallProductivity}%</p>
          </div>

          <div className="rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 border border-indigo-200">
            <p className="text-xs text-indigo-700 font-semibold mb-2">Dispatches/Nurse</p>
            <p className="text-lg font-bold text-indigo-900 mt-2">{efficiencyMetrics.dispatchesPerNurse}</p>
            <p className="text-xs text-indigo-700 mt-1">Per month average</p>
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-lg bg-gray-50 p-4">
          <h4 className="font-semibold text-sm mb-4">Overall Performance Score</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={metricData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={11} angle={-45} textAnchor="end" height={80} />
              <YAxis fontSize={11} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" fill="#8884d8" radius={[8, 8, 0, 0]}>
                {metricData.map((entry, index) => (
                  <Bar key={index} dataKey="value" fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
