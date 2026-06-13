'use client'

import React, { useState, useEffect } from 'react'
import { Patient } from '@/types'
import { LoadingSpinner } from '@/app/components/common/LoadingSpinner'
import { X, PlusCircle } from 'lucide-react'

interface CreateDispatchModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

export function CreateDispatchModal({ isOpen, onClose, onCreated }: CreateDispatchModalProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    patientId: '',
    priority: 'MEDIUM' as const,
    scheduledFor: '',
    notes: '',
  })

  useEffect(() => {
    if (!isOpen) return
    setError('')
    const fetchPatients = async () => {
      try {
        const res = await fetch('/api/patients')
        if (res.ok) {
          const { data } = await res.json()
          setPatients(data)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchPatients()
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.patientId || !form.scheduledFor) {
      setError('Please fill in all required fields.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/dispatches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          scheduledFor: new Date(form.scheduledFor).toISOString(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to create dispatch.')
        return
      }
      onCreated()
      onClose()
      setForm({ patientId: '', priority: 'MEDIUM', scheduledFor: '', notes: '' })
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Create New Dispatch</h3>
            <p className="text-xs text-gray-500">Assign a patient for home-care visit</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Patient */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Patient <span className="text-red-500">*</span>
            </label>
            {loading ? (
              <LoadingSpinner className="h-5 w-5 text-indigo-600" />
            ) : (
              <select
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                required
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select patient…</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.condition}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Priority</label>
            <div className="grid grid-cols-4 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => {
                const colors: Record<string, string> = {
                  LOW: 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400',
                  MEDIUM: 'border-yellow-300 bg-yellow-50 text-yellow-800 hover:border-yellow-400',
                  HIGH: 'border-orange-300 bg-orange-50 text-orange-800 hover:border-orange-400',
                  URGENT: 'border-red-300 bg-red-50 text-red-800 hover:border-red-400',
                }
                const activeColors: Record<string, string> = {
                  LOW: 'border-gray-500 bg-gray-200 text-gray-900 ring-2 ring-gray-400',
                  MEDIUM: 'border-yellow-500 bg-yellow-100 text-yellow-900 ring-2 ring-yellow-400',
                  HIGH: 'border-orange-500 bg-orange-100 text-orange-900 ring-2 ring-orange-400',
                  URGENT: 'border-red-500 bg-red-100 text-red-900 ring-2 ring-red-400',
                }
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm({ ...form, priority: p })}
                    className={`rounded-lg border px-2 py-1.5 text-xs font-bold transition-all ${
                      form.priority === p ? activeColors[p] : colors[p]
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Scheduled For */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Scheduled For <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={form.scheduledFor}
              onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })}
              required
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              maxLength={500}
              placeholder="Any specific instructions…"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              {submitting ? 'Creating…' : 'Create Dispatch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default CreateDispatchModal
