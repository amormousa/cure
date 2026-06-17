// app/lib/api/advanced-endpoints.ts
// Advanced API endpoints for data operations

import { z } from 'zod'
import { apiCall } from './client'

// Schema for advanced analytics
const AdvancedAnalyticsSchema = z.object({
  data: z.object({
    nursePerformance: z.array(z.any()),
    patientInsights: z.any(),
    dispatchAnalytics: z.any(),
    predictions: z.any(),
    qualityMetrics: z.any(),
    efficiencyMetrics: z.any(),
  }),
})

const DispatchReportSchema = z.object({
  data: z.object({
    reportMetadata: z.any(),
    summary: z.any(),
    statusDistribution: z.any(),
    priorityDistribution: z.any(),
    nursePerformance: z.array(z.any()),
    detailedDispatches: z.array(z.any()),
  }),
})

export const advancedApi = {
  // Advanced Analytics Endpoints
  getAdvancedAnalytics: async (days: number = 30) =>
    apiCall(
      `/api/advanced-analytics?days=${days}`,
      AdvancedAnalyticsSchema,
    ),

  // Dispatch Reports
  getDispatchReport: async (params?: {
    status?: string
    priority?: string
    nurseId?: string
    days?: number
    format?: string
  }) => {
    const query = new URLSearchParams()
    if (params?.status) query.append('status', params.status)
    if (params?.priority) query.append('priority', params.priority)
    if (params?.nurseId) query.append('nurseId', params.nurseId)
    if (params?.days) query.append('days', params.days.toString())
    if (params?.format) query.append('format', params.format)

    const endpoint = query.toString() ? `/api/reports/dispatch-report?${query.toString()}` : '/api/reports/dispatch-report'
    return apiCall(endpoint, DispatchReportSchema)
  },

  // Export data
  exportDispatchData: async (format: 'csv' | 'pdf' | 'json' = 'json') =>
    fetch(`/api/reports/dispatch-report?format=${format}`, {
      method: 'GET',
    }).then((res) => res.blob()),

  // Nurse performance metrics
  getNurseMetrics: async (nurseId: string) =>
    apiCall(`/api/nurses/${nurseId}/metrics`, z.object({ data: z.any() })),

  // Patient risk assessment
  assessPatientRisk: async (patientId: string) =>
    apiCall(`/api/patients/${patientId}/risk`, z.object({ data: z.any() })),

  // Optimization recommendations
  getRecommendations: async () =>
    apiCall(
      '/api/recommendations',
      z.object({
        data: z.object({
          generatedAt: z.string(),
          totalRecommendations: z.number(),
          recommendations: z.array(z.string()),
          priority: z.string(),
        }),
      }),
    ),
}
