'use client'

import React, { useState, useCallback } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core'
import type { Dispatch, DispatchStatus } from '@/types'
import { useKanbanDnD, COLUMN_META, type KanbanItem } from '@/app/hooks/useKanbanDnD'
import { KanbanColumn } from './KanbanColumn'
import { DispatchCard } from './DispatchCard'
import { AssignNurseModal } from './AssignNurseModal'
import { ConfirmDialog } from '@/app/components/common/ConfirmDialog'
import { LoadingSpinner } from '@/app/components/common/LoadingSpinner'
import { Search } from 'lucide-react'
import { dispatchApi } from '@/app/lib/api/endpoints'

// ─── Filter helpers (moved outside component for stability) ─────────
function filterItems(
  items: KanbanItem[],
  search: string,
  priorityFilter: string,
  nurseFilter: string,
): KanbanItem[] {
  return items.filter((d) => {
    const name = d.patient?.name || ''
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase())
    const matchesPriority = priorityFilter === 'ALL' || d.priority === priorityFilter
    const matchesNurse =
      nurseFilter === 'ALL' ||
      (nurseFilter === 'UNASSIGNED' && !d.nurseId) ||
      d.nurseId === nurseFilter
    return matchesSearch && matchesPriority && matchesNurse
  })
}

function getUniqueNurses(items: KanbanItem[]) {
  return Array.from(
    new Map(items.filter((d) => d.nurse).map((d) => [d.nurse!.id, d.nurse])).values(),
  )
}

// ─── Board ───────────────────────────────────────────────────────────
export function KanbanBoard() {
  const {
    columns,
    loading,
    activeId,
    activeItem,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    fetchDispatches,
  } = useKanbanDnD()

  // Filters
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [nurseFilter, setNurseFilter] = useState('ALL')

  // Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [noteValue, setNoteValue] = useState('')
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

  // ─── Handlers ──────────────────────────────────────

  const handleAssignNurse = useCallback((dispatch: Dispatch) => {
    setSelectedDispatch(dispatch)
    setAssignModalOpen(true)
  }, [])

  const handleAddNote = useCallback((dispatch: Dispatch) => {
    setSelectedDispatch(dispatch)
    setNoteValue(dispatch.notes || '')
    setNoteDialogOpen(true)
  }, [])

  const handleCancelClick = useCallback((dispatch: Dispatch) => {
    setSelectedDispatch(dispatch)
    setCancelDialogOpen(true)
  }, [])

  const handleSaveAssignment = useCallback(async (nurseId: string | null) => {
    if (!selectedDispatch) return

    const dispatchId = selectedDispatch.id
    const originalColumns = structuredClone(columns)

    // Optimistic update
    fetchDispatches()

    try {
      const result = await dispatchApi.update(dispatchId, {
        nurseId,
        status: nurseId ? 'ASSIGNED' : 'PENDING',
      })
      if (!result.ok) {
        const msg = result.error?.message || 'Unknown server error'
        throw new Error(msg)
      }
      window.dispatchEvent(new Event('socket-dispatch-update'))
    } catch (error) {
      console.error('Assignment failed:', error)
      const msg = error instanceof Error ? error.message : 'Failed to assign nurse'
      alert(`Assignment failed: ${msg}`)
    }
  }, [selectedDispatch, columns, fetchDispatches])

  const handleSaveNote = useCallback(async () => {
    if (!selectedDispatch) return
    try {
      const result = await dispatchApi.update(selectedDispatch.id, { notes: noteValue })
      if (!result.ok) throw new Error('Failed to save notes')
      setNoteDialogOpen(false)
      fetchDispatches()
    } catch (error) {
      console.error('Save notes failed:', error)
      alert('Failed to save notes.')
    }
  }, [selectedDispatch, noteValue, fetchDispatches])

  const handleConfirmCancel = useCallback(async () => {
    if (!selectedDispatch) return
    try {
      const result = await dispatchApi.cancel(selectedDispatch.id)
      if (!result.ok) throw new Error('Failed to cancel dispatch')
      setCancelDialogOpen(false)
      fetchDispatches()
      window.dispatchEvent(new Event('socket-dispatch-update'))
    } catch (error) {
      console.error('Cancel failed:', error)
      alert('Failed to cancel dispatch.')
    }
  }, [selectedDispatch, fetchDispatches])

  // ─── Filtered data ─────────────────────────────────

  const allItems = (Object.values(columns) as KanbanItem[]).flat()
  const uniqueNurses = getUniqueNurses(allItems)

  // ─── Render ────────────────────────────────────────

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Nurse:</span>
          <select
            value={nurseFilter}
            onChange={(e) => setNurseFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none max-w-[180px]"
          >
            <option value="ALL">All Nurses</option>
            <option value="UNASSIGNED">Unassigned</option>
            {uniqueNurses.map((nurse) => (
              <option key={nurse!.id} value={nurse!.id}>
                {nurse!.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-6 overflow-x-auto pb-8 snap-x scroll-smooth custom-scrollbar">
          {COLUMN_META.map((col) => {
            const raw = columns[col.id] ?? []
            const items = filterItems(raw, search, priorityFilter, nurseFilter)
            return (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                count={items.length}
              >
                {items.map((item) => (
                  <DispatchCard
                    key={item.id}
                    dispatch={item}
                    onAssignNurse={handleAssignNurse}
                    onAddNote={handleAddNote}
                    onCancel={handleCancelClick}
                  />
                ))}
              </KanbanColumn>
            )
          })}
        </div>

        {/* Drag overlay — floating card clone */}
        <DragOverlay dropAnimation={null}>
          {activeItem ? (
            <DispatchCard
              dispatch={activeItem}
              isDragOverlay
              onAssignNurse={() => {}}
              onAddNote={() => {}}
              onCancel={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ─── Modals ──────────────────────────────── */}

      <AssignNurseModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        currentNurseId={selectedDispatch?.nurseId}
        onAssign={handleSaveAssignment}
      />

      {noteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm" onClick={() => setNoteDialogOpen(false)} />
          <div className="relative z-10 w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 shadow-2xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Edit Notes</h3>
            <p className="text-xs text-gray-500 mb-4">
              Update operational notes for {selectedDispatch?.patient?.name}
            </p>
            <textarea
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Enter details..."
              className="w-full rounded-lg border border-gray-250 bg-white p-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setNoteDialogOpen(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-750 transition shadow-sm"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={cancelDialogOpen}
        title="Cancel Dispatch"
        description={`Are you sure you want to cancel the dispatch for ${selectedDispatch?.patient?.name}? This will change the status to CANCELLED and remove it from active columns.`}
        confirmText="Cancel Dispatch"
        cancelText="Keep Active"
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelDialogOpen(false)}
        variant="danger"
      />
    </div>
  )
}
export default KanbanBoard
