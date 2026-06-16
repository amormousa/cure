// app/(dashboard)/dispatches/[id]/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/app/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { LoadingSpinner } from '@/app/components/common/LoadingSpinner'
import { ArrowLeft, MapPin, Phone, User, Calendar, Activity, AlertTriangle, Clock } from 'lucide-react'
import { dispatchApi } from '@/app/lib/api/endpoints'

export default function DispatchDetailsPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [dispatch, setDispatch] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDispatch = async () => {
    try {
      const result = await dispatchApi.get(id)
      if (result.ok && result.data) {
        setDispatch(result.data.data)
      } else {
        setError('Dispatch not found')
      }
    } catch (e) {
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchDispatch()
  }, [id])

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true)
    try {
      const result = await dispatchApi.update(id, { status: newStatus })
      if (result.ok) {
        // Refresh data to get new AuditLogs
        await fetchDispatch()
      } else {
        alert('Failed to update status')
      }
    } catch (e) {
      alert('An error occurred while updating status')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><LoadingSpinner className="h-8 w-8 text-indigo-600" /></div>
  }

  if (error || !dispatch) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <p className="text-lg text-gray-600">{error || 'Dispatch not found.'}</p>
        <button onClick={() => router.back()} className="mt-4 text-indigo-600 hover:underline">Go back</button>
      </div>
    )
  }

  const { patient, nurse, auditLogs } = dispatch

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Dispatch Details</h2>
          <p className="text-sm text-gray-500">Task ID: <span className="font-mono text-xs">{dispatch.id}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Patient Info Card */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-500" />
            <h3 className="text-lg font-semibold text-gray-900">Patient Information</h3>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Full Name</span>
              <span className="text-base font-medium text-gray-900">{patient?.name}</span>
            </div>
            <div className="flex items-start gap-3 text-gray-700">
              <MapPin className="h-5 w-5 shrink-0 text-gray-400 mt-0.5" />
              <span>{patient?.address}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Phone className="h-5 w-5 shrink-0 text-gray-400" />
              <span>{patient?.phone}</span>
            </div>
            <div className="flex items-start gap-3 text-gray-700 pt-2 border-t">
              <Activity className="h-5 w-5 shrink-0 text-gray-400 mt-0.5" />
              <div>
                <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Medical Condition</span>
                <span className="font-medium">{patient?.condition}</span>
                {patient?.notes && <p className="text-sm text-gray-500 mt-1">{patient.notes}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Dispatch Info Card */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-500" />
            <h3 className="text-lg font-semibold text-gray-900">Task Information</h3>
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Status</span>
                <div className="flex items-center gap-2">
                  <select
                    className={`rounded-md border p-1.5 text-sm font-semibold shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50 ${
                      dispatch.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                      dispatch.status === 'CANCELLED' ? 'bg-red-50 text-red-700' :
                      'bg-indigo-50 text-indigo-700'
                    }`}
                    value={dispatch.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updating}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                  {updating && <LoadingSpinner className="h-4 w-4 text-indigo-600" />}
                </div>
              </div>
              <div>
                <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Priority</span>
                <Badge variant={dispatch.priority === 'URGENT' ? 'destructive' : 'outline'} className="text-sm">
                  {dispatch.priority}
                </Badge>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Assigned Nurse</span>
              {nurse ? (
                <div className="flex items-center gap-3">
                  <img src={nurse.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${nurse.id}`} alt={nurse.name} className="h-10 w-10 rounded-full border border-gray-200" />
                  <div>
                    <p className="font-medium text-gray-900">{nurse.name}</p>
                    <p className="text-xs text-gray-500">ID: {nurse.id.slice(-6)}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500 bg-gray-50 p-2 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">No nurse assigned yet</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 text-gray-700 pt-2 border-t border-gray-100">
              <Calendar className="h-5 w-5 shrink-0 text-gray-400" />
              <div>
                <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Scheduled For</span>
                <span className="font-medium">{new Date(dispatch.scheduledFor).toLocaleString()}</span>
              </div>
            </div>
            
            {dispatch.notes && (
              <div className="pt-2 border-t border-gray-100">
                <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Dispatch Notes</span>
                <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-md border border-yellow-100">{dispatch.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center gap-2 bg-gray-50">
          <Clock className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Change History</h3>
        </div>
        
        {auditLogs?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No history available for this dispatch.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="w-[180px]">Date & Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs?.map((log: any) => {
                  let changedFieldsText = ''
                  if (log.details && typeof log.details === 'object') {
                    if (log.details.changedFields && Array.isArray(log.details.changedFields)) {
                      changedFieldsText = `Updated fields: ${log.details.changedFields.join(', ')}`
                      
                      // Check for specific status changes if available in the details
                      if (log.details.changedFields.includes('status') && log.details.after?.status) {
                        changedFieldsText += ` ➔ ${log.details.after.status}`
                      }
                    } else if (log.details.priority) {
                       changedFieldsText = `Created with priority ${log.details.priority}`
                    } else {
                       changedFieldsText = 'Action performed'
                    }
                  }

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-gray-500 font-medium">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs bg-gray-50">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {log.user?.name || 'System / Unknown'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {changedFieldsText}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
