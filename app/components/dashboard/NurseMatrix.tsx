'use client'

import React, { useState, useEffect } from 'react'
import { User, Dispatch } from '@/types'
import { LoadingSpinner } from '@/app/components/common/LoadingSpinner'
import { X, Calendar, MapPin, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { statusToColor, getStatusLabel, formatDate, formatTime } from '@/lib/utils'
import { dispatchApi, userApi } from '@/app/lib/api/endpoints'

export function NurseMatrix() {
  const [nurses, setNurses] = useState<User[]>([])
  const [dispatches, setDispatches] = useState<Dispatch[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNurse, setSelectedNurse] = useState<User | null>(null)
  const [nurseHistory, setNurseHistory] = useState<Dispatch[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchData = async () => {
    try {
      const [nursesRes, dispatchesRes] = await Promise.all([
        userApi.list({ role: 'NURSE' }),
        dispatchApi.list(),
      ])

      if (nursesRes.ok && nursesRes.data && dispatchesRes.ok && dispatchesRes.data) {
        // Filter only nurses
        setNurses(
          nursesRes.data.data
            .filter((u) => u.role === 'NURSE')
            .map((u) => ({ ...u, isActive: u.isActive ?? true, isOnline: u.isOnline ?? false }) as User)
        )
        setDispatches(dispatchesRes.data.data as Dispatch[])
      }
    } catch (error) {
      console.error('Failed to fetch matrix data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Poll data occasionally in case socket is not running yet
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  // Listen to custom window events for real-time socket updates from pages
  useEffect(() => {
    const handleUpdate = () => {
      fetchData()
    }
    window.addEventListener('socket-dispatch-update', handleUpdate)
    window.addEventListener('socket-presence-update', handleUpdate)
    return () => {
      window.removeEventListener('socket-dispatch-update', handleUpdate)
      window.removeEventListener('socket-presence-update', handleUpdate)
    }
  }, [])

  const fetchNurseHistory = async (nurseId: string) => {
    setHistoryLoading(true)
    try {
      const result = await dispatchApi.list({ nurseId })
      if (result.ok && result.data) {
        setNurseHistory(result.data.data as Dispatch[])
      }
    } catch (error) {
      console.error('Failed to fetch nurse history:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleNurseClick = (nurse: User) => {
    setSelectedNurse(nurse)
    fetchNurseHistory(nurse.id)
  }

  // Get active dispatch for a nurse (ASSIGNED or IN_PROGRESS)
  const getNurseActiveDispatch = (nurseId: string) => {
    return dispatches.find(
      (d) => d.nurseId === nurseId && ['ASSIGNED', 'IN_PROGRESS'].includes(d.status)
    )
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="relative">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {nurses.map((nurse) => {
          const activeDispatch = getNurseActiveDispatch(nurse.id)
          const isOnline = nurse.isOnline

          return (
            <div
              key={nurse.id}
              onClick={() => handleNurseClick(nurse)}
              className="group relative flex cursor-pointer items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:border-indigo-300 hover:shadow-md"
            >
              {/* Avatar & Online Dot */}
              <div className="relative shrink-0">
                <img
                  src={nurse.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${nurse.id}`}
                  alt={nurse.name}
                  className="h-12 w-12 rounded-full border border-gray-100 bg-gray-50"
                />
                <span
                  className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm ${
                    isOnline ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="truncate text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {nurse.name}
                </h3>
                <p className="truncate text-xs text-gray-500">{nurse.phone || 'No phone'}</p>
                
                {/* Status Badge */}
                <div className="mt-3">
                  {activeDispatch ? (
                    <div className="space-y-1">
                      <span
                        className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium border ${statusToColor(
                          activeDispatch.status
                        )}`}
                      >
                        {getStatusLabel(activeDispatch.status)}
                      </span>
                      <p className="truncate text-[10px] text-gray-400 font-medium">
                        Patient: {activeDispatch.patient?.name}
                      </p>
                    </div>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                      Available
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Side Panel for Nurse Dispatch History */}
      {selectedNurse && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-gray-500/50 backdrop-blur-sm transition-opacity" onClick={() => setSelectedNurse(null)} />
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-md transform bg-white shadow-2xl border-l border-gray-200 flex flex-col h-full">
              {/* Header */}
              <div className="border-b border-gray-200 px-6 py-5 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedNurse.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedNurse.id}`}
                    alt={selectedNurse.name}
                    className="h-10 w-10 rounded-full"
                  />
                  <div>
                    <h2 className="text-md font-bold text-gray-900">{selectedNurse.name}</h2>
                    <p className="text-xs text-gray-500">Nurse Dispatch History</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNurse(null)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-150 hover:text-gray-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* History Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {historyLoading ? (
                  <LoadingSpinner />
                ) : nurseHistory.length > 0 ? (
                  <div className="space-y-4">
                    {nurseHistory.map((dispatch) => (
                      <div
                        key={dispatch.id}
                        className="rounded-xl border border-gray-200 p-4 space-y-3 shadow-sm hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${statusToColor(
                              dispatch.status
                            )}`}
                          >
                            {getStatusLabel(dispatch.status)}
                          </span>
                          <span className="text-[11px] text-gray-400 font-medium">
                            {formatDate(dispatch.createdAt)}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">
                            {dispatch.patient?.name}
                          </h4>
                          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            {dispatch.patient?.address}
                          </p>
                        </div>

                        {dispatch.notes && (
                          <div className="rounded-lg bg-gray-50 p-2.5 text-xs text-gray-600 border border-gray-150">
                            <p className="font-semibold text-gray-500 mb-0.5">Notes:</p>
                            {dispatch.notes}
                          </div>
                        )}

                        <div className="flex items-center justify-between border-t border-gray-100 pt-2.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            {formatTime(dispatch.scheduledFor)}
                          </span>
                          {dispatch.completedAt && (
                            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 space-y-2">
                    <ShieldAlert className="h-10 w-10 text-gray-300" />
                    <p>No dispatch history found for this nurse.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default NurseMatrix
