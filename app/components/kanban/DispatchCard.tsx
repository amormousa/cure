'use client'

import React, { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Dispatch } from '@/types'
import { CSS } from '@dnd-kit/utilities'
import { MapPin, Calendar, Clock, UserPlus, FileText, CheckCircle2 } from 'lucide-react'
import { priorityToColor, formatTime, formatDate } from '@/lib/utils'

interface DispatchCardProps {
  dispatch: Dispatch
  onAssignNurse: (dispatch: Dispatch) => void
  onAddNote: (dispatch: Dispatch) => void
  onCancel: (dispatch: Dispatch) => void
}

export function DispatchCard({ dispatch, onAssignNurse, onAddNote, onCancel }: DispatchCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dispatch.id,
    data: {
      dispatch,
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  const priorityColors = {
    URGENT: 'bg-red-50 text-red-700 border-red-200',
    HIGH: 'bg-orange-50 text-orange-750 border-orange-200',
    MEDIUM: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    LOW: 'bg-gray-50 text-gray-700 border-gray-200',
  }

  const activeColor = priorityColors[dispatch.priority] || priorityColors.MEDIUM

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md ${
        isDragging ? 'cursor-grabbing shadow-lg border-indigo-400 ring-2 ring-indigo-500/10' : ''
      }`}
    >
      {/* Drag Handle & Header */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${activeColor}`}
        >
          {dispatch.priority}
        </span>
        
        {/* Drag Anchor Area */}
        <div
          {...listeners}
          {...attributes}
          className="flex h-6 w-8 cursor-grab items-center justify-center rounded hover:bg-gray-100 active:cursor-grabbing text-gray-400 group-hover:text-gray-600 transition"
          title="Drag to move status"
        >
          ⋮⋮
        </div>
      </div>

      {/* Patient details */}
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
          {dispatch.patient?.name}
        </h4>
        <p className="flex items-start gap-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400 mt-0.5" />
          {dispatch.patient?.address}
        </p>
      </div>

      {/* Scheduled date/time */}
      <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          <span>{formatDate(dispatch.scheduledFor)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          <span>{formatTime(dispatch.scheduledFor)}</span>
        </div>
      </div>

      {/* Notes preview if any */}
      {dispatch.notes && (
        <p className="rounded-lg bg-gray-50 p-2 text-xs text-gray-600 border border-gray-150 line-clamp-2">
          {dispatch.notes}
        </p>
      )}

      {/* Bottom Assignment / Nurse Status */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        {dispatch.nurse ? (
          <div className="flex items-center gap-2">
            <img
              src={dispatch.nurse.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${dispatch.nurse.id}`}
              alt={dispatch.nurse.name}
              className="h-7 w-7 rounded-full border border-gray-100 bg-gray-50"
            />
            <span className="text-xs font-semibold text-gray-700 truncate max-w-[120px]">
              {dispatch.nurse.name}
            </span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 rounded bg-slate-50 border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
            Unassigned
          </span>
        )}

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAssignNurse(dispatch)}
            className="rounded p-1.5 text-gray-500 hover:bg-indigo-50 hover:text-indigo-650 transition"
            title="Assign nurse"
          >
            <UserPlus className="h-4 w-4" />
          </button>
          <button
            onClick={() => onAddNote(dispatch)}
            className="rounded p-1.5 text-gray-500 hover:bg-indigo-50 hover:text-indigo-650 transition"
            title="Add notes"
          >
            <FileText className="h-4 w-4" />
          </button>
          {dispatch.status !== 'CANCELLED' && dispatch.status !== 'COMPLETED' && (
            <button
              onClick={() => onCancel(dispatch)}
              className="rounded p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-650 transition"
              title="Cancel dispatch"
            >
              <CheckCircle2 className="h-4 w-4 text-gray-400 hover:text-rose-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
export default DispatchCard
