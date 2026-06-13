'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { KPICard } from '@/app/components/dashboard/KPICard'
import { NurseMatrix } from '@/app/components/dashboard/NurseMatrix'
import { LoadingSpinner } from '@/app/components/common/LoadingSpinner'
import { AlertCircle } from 'lucide-react'

interface KPIData {
  activeDispatches: number
  completedToday: number
  availableNurses: number
  urgentPending: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchKPIData = async () => {
      try {
        const res = await fetch('/api/analytics')
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch KPI data')
        }

        const result = await res.json()
        const { data } = result

        // Calculate KPIs from analytics data
        const statusBreakdown = data.statusBreakdown || {}
        const activeCount = (statusBreakdown.PENDING || 0) + (statusBreakdown.ASSIGNED || 0) + (statusBreakdown.IN_PROGRESS || 0)
        const completedCount = data.completedToday || 0
        const availableCount = data.availableNurses || 0
        const urgentCount = data.urgentPending || 0

        setKpiData({
          activeDispatches: activeCount,
          completedToday: completedCount,
          availableNurses: availableCount,
          urgentPending: urgentCount,
        })
      } catch (err) {
        console.error('Error fetching KPI data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchKPIData()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-8 w-8 text-red-600" />
          <h2 className="mb-2 font-semibold text-red-900">Error loading dashboard</h2>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back. Here's your operational overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Active Dispatches"
          value={kpiData?.activeDispatches || 0}
          description="Currently in progress or assigned"
          trend={{ value: 5, isPositive: true }}
        />
        <KPICard
          title="Completed Today"
          value={kpiData?.completedToday || 0}
          description="Successfully finished"
          trend={{ value: 12, isPositive: true }}
        />
        <KPICard
          title="Available Nurses"
          value={kpiData?.availableNurses || 0}
          description="Online and ready"
          trend={{ value: 2, isPositive: true }}
        />
        <KPICard
          title="Urgent Pending"
          value={kpiData?.urgentPending || 0}
          description="Requiring immediate assignment"
          trend={{ value: 1, isPositive: false }}
          variant="warning"
        />
      </div>

      {/* Nurse Utilization Matrix */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Nurse Utilization</h2>
        <NurseMatrix />
      </div>
    </div>
  )
}
