// app/api/reports/dispatch-report/route.ts
// Generate detailed dispatch reports with filtering and analytics

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authorize } from '@/lib/auth'
import { createLogger } from '@/backend/utils/logger'

const log = createLogger('API:reports/dispatch')

export async function GET(req: NextRequest) {
  try {
    const { user: authUser, errorResponse } = await authorize(['ADMIN', 'DISPATCHER'])
    if (errorResponse) return errorResponse

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const nurseId = searchParams.get('nurseId')
    const days = parseInt(searchParams.get('days') || '30', 10)
    const exportFormat = searchParams.get('format') || 'json' // json, csv, pdf

    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)

    // Build query
    const where: any = {
      createdAt: { gte: fromDate },
    }
    if (status) where.status = status
    if (priority) where.priority = priority
    if (nurseId) where.nurseId = nurseId

    // Fetch dispatches with all relations
    const dispatches = await prisma.dispatch.findMany({
      where,
      include: {
        patient: true,
        nurse: true,
        auditLogs: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate metrics
    const totalDispatches = dispatches.length
    const completedCount = dispatches.filter((d) => d.status === 'COMPLETED').length
    const pendingCount = dispatches.filter((d) => d.status === 'PENDING').length
    const assignedCount = dispatches.filter((d) => d.status === 'ASSIGNED').length
    const inProgressCount = dispatches.filter((d) => d.status === 'IN_PROGRESS').length
    const cancelledCount = dispatches.filter((d) => d.status === 'CANCELLED').length

    const completionRate = totalDispatches > 0 ? Math.round((completedCount / totalDispatches) * 100) : 0

    // Calculate time metrics
    const completedDispatches = dispatches.filter((d) => d.status === 'COMPLETED' && d.completedAt)
    const totalCompletionTime = completedDispatches.reduce((sum, d) => {
      return sum + (d.completedAt!.getTime() - d.scheduledFor.getTime())
    }, 0)
    const avgCompletionTime = completedDispatches.length > 0 ? Math.round(totalCompletionTime / completedDispatches.length / (1000 * 60 * 60)) : 0

    // Priority breakdown
    const priorityBreakdown = {
      LOW: dispatches.filter((d) => d.priority === 'LOW').length,
      MEDIUM: dispatches.filter((d) => d.priority === 'MEDIUM').length,
      HIGH: dispatches.filter((d) => d.priority === 'HIGH').length,
      URGENT: dispatches.filter((d) => d.priority === 'URGENT').length,
    }

    // Nurse performance in this report
    const nursePerformance = new Map<string, any>()
    dispatches.forEach((d) => {
      if (d.nurse) {
        const key = d.nurse.id
        if (!nursePerformance.has(key)) {
          nursePerformance.set(key, {
            nurseId: d.nurse.id,
            nurseName: d.nurse.name,
            totalAssigned: 0,
            completed: 0,
          })
        }
        const stat = nursePerformance.get(key)!
        stat.totalAssigned++
        if (d.status === 'COMPLETED') stat.completed++
      }
    })

    const report = {
      reportMetadata: {
        generatedAt: new Date(),
        dateRange: { from: fromDate, to: new Date() },
        filters: { status, priority, nurseId },
        exportFormat,
      },
      summary: {
        totalDispatches,
        completedCount,
        pendingCount,
        assignedCount,
        inProgressCount,
        cancelledCount,
        completionRate,
        avgCompletionTime,
      },
      statusDistribution: {
        PENDING: pendingCount,
        ASSIGNED: assignedCount,
        IN_PROGRESS: inProgressCount,
        COMPLETED: completedCount,
        CANCELLED: cancelledCount,
      },
      priorityDistribution: priorityBreakdown,
      nursePerformance: Array.from(nursePerformance.values()),
      detailedDispatches: dispatches.map((d) => ({
        id: d.id,
        patientName: d.patient.name,
        patientAddress: d.patient.address,
        nurseName: d.nurse?.name || 'Unassigned',
        status: d.status,
        priority: d.priority,
        scheduledDate: d.scheduledFor,
        completedDate: d.completedAt,
        notes: d.notes,
        condition: d.patient.condition,
      })),
    }

    // Format response based on requested format
    if (exportFormat === 'csv') {
      // Convert to CSV (simplified)
      const csv = convertToCSV(report.detailedDispatches)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="dispatch-report.csv"',
        },
      })
    }

    log.info('Dispatch report generated', { totalDispatches, completionRate })
    return NextResponse.json({ data: report }, { status: 200 })
  } catch (error) {
    log.error('GET /api/reports/dispatch-report failed', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 },
    )
  }
}

// Helper function to convert to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csv = [headers.join(',')]

  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header]
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`
      }
      return value
    })
    csv.push(values.join(','))
  })

  return csv.join('\n')
}
