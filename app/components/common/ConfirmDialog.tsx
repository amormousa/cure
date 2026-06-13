'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const variantColors = {
    danger: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
      btn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    },
    warning: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200',
      btn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    },
    info: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      btn: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
    },
  }

  const activeColor = variantColors[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={onCancel} />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 shadow-2xl transition-all border border-gray-100">
        <div className="flex gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${activeColor.bg} ${activeColor.text}`}>
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition ${activeColor.btn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
export default ConfirmDialog
