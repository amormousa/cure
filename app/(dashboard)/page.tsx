// app/(dashboard)/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { KPICard } from '@/app/components/dashboard/KPICard'
import { NurseMatrix } from '@/app/components/dashboard/NurseMatrix'
import { LoadingSpinner } from '@/app/components/common/LoadingSpinner'
import { AlertCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { Badge } from '@/app/components/ui/badge'

interface KPIData {
  createdToday: number
  completedToday: number
  onlineNurses: number
  urgentPending: number
  dailySeries: any[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [recentDispatches, setRecentDispatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [analyticsRes, dispatchesRes] = await Promise.all([
          fetch('/api/analytics'),
          fetch('/api/dispatches')
        ])

        if (!analyticsRes.ok) {
          if (analyticsRes.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch KPI data')
        }

        const analyticsResult = await analyticsRes.json()
        const { data } = analyticsResult

        setKpiData({
          createdToday: data.createdToday || 0,
          completedToday: data.completedToday || 0,
          onlineNurses: data.onlineNurses || 0,
          urgentPending: data.urgentPending || 0,
          dailySeries: data.dailySeries || []
        })

        if (dispatchesRes.ok) {
          const dispatchesResult = await dispatchesRes.json()
          // Sort by createdAt desc and take 10
          const sorted = dispatchesResult.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          setRecentDispatches(sorted.slice(0, 10))
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
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

  const completionRate = kpiData?.createdToday 
    ? ((kpiData.completedToday / kpiData.createdToday) * 100).toFixed(0) 
    : '0'

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back. Here's your operational overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Dispatches Today"
          value={kpiData?.createdToday || 0}
          description="Total assignments created today"
          trend={{ value: 10, isPositive: true }}
        />
        <KPICard
          title="Completion Rate"
          value={`${completionRate}%`}
          description={`${kpiData?.completedToday} of ${kpiData?.createdToday} completed`}
          trend={{ value: 5, isPositive: true }}
        />
        <KPICard
          title="Online Nurses"
          value={kpiData?.onlineNurses || 0}
          description="Active staff members"
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

      {/* Charts & Nurse Matrix */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm flex flex-col min-h-[350px]">
          <h2 className="mb-4 text-xl font-semibold">30-Day Dispatch Trend</h2>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={kpiData?.dailySeries} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="created" stroke="#4f46e5" strokeWidth={2} name="Created" dot={false} />
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelFormatter={(val) => new Date(val).toLocaleDateString()}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm overflow-hidden flex flex-col min-h-[350px]">
          <h2 className="mb-4 text-xl font-semibold">Live Nurse Status</h2>
          <div className="flex-1 overflow-y-auto">
            <NurseMatrix />
          </div>
        </div>
      </div>

      {/* Recent Dispatches */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-semibold">Recent Dispatches</h2>
        </div>
        <div className="overflow-x-auto p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned Nurse</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDispatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    No recent dispatches.
                  </TableCell>
                </TableRow>
              ) : (
                recentDispatches.map((dispatch) => (
                  <TableRow key={dispatch.id}>
                    <TableCell className="font-medium">{dispatch.patient?.name}</TableCell>
                    <TableCell>
                      <Badge variant={dispatch.status === 'COMPLETED' ? 'default' : dispatch.status === 'CANCELLED' ? 'destructive' : 'secondary'}>
                        {dispatch.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={dispatch.priority === 'URGENT' ? 'destructive' : 'outline'}>
                        {dispatch.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{dispatch.nurse?.name || <span className="text-gray-400">Unassigned</span>}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(dispatch.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
