'use client'

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { DispatchStatus } from '@/types'

interface KanbanColumnProps {
  id: DispatchStatus
  title: string
  count: number
  children: React.ReactNode
}

const statusColors: Record<DispatchStatus, string> = {
  PENDING: 'bg-slate-100/60 border-slate-200',
  ASSIGNED: 'bg-blue-50/50 border-blue-200',
  IN_PROGRESS: 'bg-purple-50/50 border-purple-200',
  COMPLETED: 'bg-emerald-50/50 border-emerald-200',
  CANCELLED: 'bg-rose-50/50 border-rose-200',
}

function KanbanColumnComponent({ id, title, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const columnBg = statusColors[id] || 'bg-gray-50/50 border-gray-200'

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl border-2 p-4 transition-all duration-200 w-80 shrink-0 snap-start ${
        isOver
          ? 'bg-indigo-50/80 border-indigo-400 shadow-md scale-[1.01]'
          : `${columnBg} border-transparent`
      }`}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between pb-2 border-b border-gray-150">
        <h3 className="text-sm font-bold text-gray-900 tracking-wide uppercase flex items-center gap-2">
          {title}
        </h3>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-bold shadow-sm transition-colors ${
            isOver
              ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
              : 'bg-white text-gray-650 border-gray-200'
          }`}
        >
          {count}
        </span>
      </div>

      {/* Cards area — droppable region fills remaining height */}
      <div
        className={`flex-1 space-y-3 overflow-y-auto min-h-[350px] pb-20 custom-scrollbar rounded-xl transition-colors ${
          isOver && count === 0 ? 'bg-indigo-50/40' : ''
        }`}
      >
        {children}

        {/* Empty column drop zone */}
        {count === 0 && (
          <div
            className={`flex items-center justify-center rounded-xl border-2 border-dashed text-xs font-semibold text-center p-4 transition-all min-h-[200px] ${
              isOver
                ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                : 'border-gray-300/80 text-gray-400'
            }`}
          >
            {isOver ? (
              <span className="flex flex-col items-center gap-2">
                <span className="inline-block h-8 w-1 rounded-full bg-indigo-400 animate-pulse" />
                Drop here
              </span>
            ) : (
              <span className="flex flex-col items-center gap-1">
                <span className="text-lg">—</span>
                <span>Drag dispatches here</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export const KanbanColumn = React.memo(KanbanColumnComponent)
export default KanbanColumn
