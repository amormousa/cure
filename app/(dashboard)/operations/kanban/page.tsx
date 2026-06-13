'use client'

import { useState } from 'react'
import { KanbanBoard } from '@/app/components/kanban/KanbanBoard'
import { CreateDispatchModal } from '@/app/components/kanban/CreateDispatchModal'
import { ErrorBoundary } from '@/app/components/common/ErrorBoundary'
import { useSocket } from '@/app/hooks/useSocket'
import { PlusCircle, Columns } from 'lucide-react'

export default function KanbanPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [boardKey, setBoardKey] = useState(0)

  // Connect to real-time socket for live updates
  useSocket()

  const handleDispatchCreated = () => {
    // Re-mount board to pick up the new dispatch
    setBoardKey((k) => k + 1)
    window.dispatchEvent(new Event('socket-dispatch-update'))
  }

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-600/25">
            <Columns className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Operations Board</h1>
            <p className="text-sm text-gray-500">Drag cards between columns to update dispatch status</p>
          </div>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <PlusCircle className="h-4 w-4" />
          New Dispatch
        </button>
      </div>

      {/* Kanban Board */}
      <ErrorBoundary>
        <KanbanBoard key={boardKey} />
      </ErrorBoundary>

      {/* Create Dispatch Modal */}
      <CreateDispatchModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleDispatchCreated}
      />
    </div>
  )
}
