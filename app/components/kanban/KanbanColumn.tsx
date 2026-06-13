'use client'

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { DispatchStatus } from '@/types'

interface KanbanColumnProps {
  id: DispatchStatus
  title: string
  count: number
  children: React.ReactNode
}

export function KanbanColumn({ id, title, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  // Theme-tailored background accent on drag over
  const statusColors: Record<DispatchStatus, string> = {
    PENDING: 'bg-slate-100/60 border-slate-200',
    ASSIGNED: 'bg-blue-50/50 border-blue-200',
    IN_PROGRESS: 'bg-purple-50/50 border-purple-200',
    COMPLETED: 'bg-emerald-50/50 border-emerald-200',
    CANCELLED: 'bg-rose-50/50 border-rose-200',
  }

  const columnBg = statusColors[id] || 'bg-gray-50/50 border-gray-200'

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-full rounded-2xl border-2 p-4 transition-all duration-200 w-80 shrink-0 ${
        isOver
          ? 'bg-indigo-50/70 border-indigo-400 shadow-md scale-[1.01]'
          : `${columnBg} border-transparent`
      }`}
    >
      {/* Column Header */}
      <div className="mb-4 flex items-center justify-between pb-2 border-b border-gray-150">
        <h3 className="text-sm font-bold text-gray-900 tracking-wide uppercase flex items-center gap-2">
          {title}
        </h3>
        <span className="rounded-full bg-white border border-gray-200 px-2.5 py-0.5 text-xs font-bold text-gray-650 shadow-sm">
          {count}
        </span>
      </div>

      {/* Cards Container */}
      <div className="flex-1 space-y-3 overflow-y-auto min-h-[500px] pb-20 custom-scrollbar">
        {children}
        {count === 0 && (
          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-gray-300/80 text-xs font-semibold text-gray-400 text-center p-4">
            Drag dispatches here
          </div>
        )}
      </div>
    </div>
  )
}
export default KanbanColumn
