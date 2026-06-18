'use client'

import React, { useState, useEffect } from 'react'
import { User } from '@/types'
import { LoadingSpinner } from '@/app/components/common/LoadingSpinner'
import { X, Check } from 'lucide-react'
import { userApi } from '@/app/lib/api/endpoints'

interface AssignNurseModalProps {
  isOpen: boolean
  onClose: () => void
  currentNurseId?: string | null
  onAssign: (nurseId: string | null) => void
}

export function AssignNurseModal({ isOpen, onClose, currentNurseId, onAssign }: AssignNurseModalProps) {
  const [nurses, setNurses] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen) return

    const fetchNurses = async () => {
      try {
        const result = await userApi.list({ role: 'NURSE' })
        if (result.ok && result.data) {
          // Filter to show active nurses
          setNurses(
            result.data.data
              .filter((u) => u.role === 'NURSE' && (u.isActive ?? true))
              .map((u) => ({ ...u, isActive: u.isActive ?? true, isOnline: u.isOnline ?? false }) as User)
          )
        }
      } catch (error) {
        console.error('Failed to fetch nurses for assignment:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNurses()
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm" onClick={onClose} />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 shadow-2xl transition-all border border-gray-200 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Assign Nurse</h3>
            <p className="text-xs text-gray-500">Select a nurse for this dispatch</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nurses List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              {/* Unassign Option */}
              <button
                onClick={() => {
                  onAssign(null)
                  onClose()
                }}
                className={`flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm transition-all ${
                  !currentNurseId
                    ? 'border-indigo-500 bg-indigo-50/50 font-semibold text-indigo-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span>Unassigned</span>
                {!currentNurseId && <Check className="h-4 w-4" />}
              </button>

              {nurses.map((nurse) => {
                const isSelected = currentNurseId === nurse.id
                return (
                  <button
                    key={nurse.id}
                    onClick={() => {
                      onAssign(nurse.id)
                      onClose()
                    }}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 font-semibold text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {nurse.avatar ? (
                        <img src={nurse.avatar} alt={nurse.name} className="h-8 w-8 rounded-full bg-gray-50 border border-gray-100" />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500">
                          {nurse.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                          {nurse.name}
                          <span
                            className={`h-2 w-2 rounded-full ${
                              nurse.isOnline ? 'bg-emerald-500' : 'bg-gray-300'
                            }`}
                          />
                        </div>
                        <div className="text-xs text-gray-500">{nurse.phone || 'No phone'}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
                  </button>
                )
              })}
              {nurses.length === 0 && (
                <div className="py-10 text-center text-sm text-gray-400">
                  No active nurses available.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
export default AssignNurseModal
