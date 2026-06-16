// app/(dashboard)/admin/nurses/[id]/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/app/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { LoadingSpinner } from '@/app/components/common/LoadingSpinner'
import { ArrowLeft, Phone, Mail, Clock } from 'lucide-react'

export default function NurseDetailsPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [nurse, setNurse] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNurse = async () => {
      try {
        const res = await fetch(`/api/users/${id}`)
        if (res.ok) {
          const { data } = await res.json()
          setNurse(data)
        }
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchNurse()
  }, [id])

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><LoadingSpinner className="h-8 w-8 text-indigo-600" /></div>
  }

  if (!nurse) {
    return <div className="flex h-96 flex-col items-center justify-center"><p className="text-lg text-gray-600">Nurse not found.</p><button onClick={() => router.back()} className="mt-4 text-indigo-600 hover:underline">Go back</button></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-gray-100"><ArrowLeft className="h-5 w-5 text-gray-600" /></button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">{nurse.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            {nurse.isActive ? <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Active</Badge> : <Badge variant="destructive">Inactive</Badge>}
            {nurse.isOnline && <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Online</Badge>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Contact Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-600">
              <Mail className="h-5 w-5" /> <span>{nurse.email}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Phone className="h-5 w-5" /> <span>{nurse.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Clock className="h-5 w-5" /> <span>Joined {new Date(nurse.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-md bg-gray-50 p-4 text-center">
              <p className="text-3xl font-bold text-indigo-600">{nurse.dispatches?.filter((d: any) => ['ASSIGNED', 'IN_PROGRESS'].includes(d.status)).length || 0}</p>
              <p className="text-sm text-gray-500">Active Tasks</p>
            </div>
            <div className="rounded-md bg-gray-50 p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{nurse.dispatches?.filter((d: any) => d.status === 'COMPLETED').length || 0}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-semibold">Task History</h3>
        </div>
        {nurse.dispatches?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No tasks assigned yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nurse.dispatches?.map((dispatch: any) => (
                <TableRow key={dispatch.id}>
                  <TableCell>{new Date(dispatch.scheduledFor).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{dispatch.patient.name}</TableCell>
                  <TableCell>{dispatch.patient.address}</TableCell>
                  <TableCell>
                    <Badge variant={dispatch.status === 'COMPLETED' ? 'default' : dispatch.status === 'CANCELLED' ? 'destructive' : 'secondary'}>
                      {dispatch.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={dispatch.priority === 'URGENT' ? 'destructive' : 'outline'}>{dispatch.priority}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
