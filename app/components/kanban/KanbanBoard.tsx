'use client'

import React, { useState, useEffect } from 'react'
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { Dispatch, DispatchStatus } from '@/types'
import { KanbanColumn } from './KanbanColumn'
import { DispatchCard } from './DispatchCard'
import { AssignNurseModal } from './AssignNurseModal'
import { ConfirmDialog } from '@/app/components/common/ConfirmDialog'
import { LoadingSpinner } from '@/app/components/common/LoadingSpinner'
import { PlusCircle, Search, Filter } from 'lucide-react'
import { dispatchApi } from '@/app/lib/api/endpoints'

export function KanbanBoard() {
  const [dispatches, setDispatches] = useState<Dispatch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [nurseFilter, setNurseFilter] = useState('ALL')

  // Modals state
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null)
  
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [noteValue, setNoteValue] = useState('')

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require drag to move 8px before activation to allow clicks on action buttons
      },
    })
  )

  const fetchDispatches = async () => {
    try {
      const result = await dispatchApi.list()
      if (result.ok && result.data) {
        setDispatches(result.data.data as Dispatch[])
      }
    } catch (error) {
      console.error('Failed to fetch dispatches:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDispatches()

    // Poll for changes
    const interval = setInterval(fetchDispatches, 10000)
    return () => clearInterval(interval)
  }, [])

  // Listen to custom window events for real-time socket updates from page
  useEffect(() => {
    const handleUpdate = () => {
      fetchDispatches()
    }
    window.addEventListener('socket-dispatch-update', handleUpdate)
    return () => {
      window.removeEventListener('socket-dispatch-update', handleUpdate)
    }
  }, [])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const dispatchId = active.id as string
    const newStatus = over.id as DispatchStatus

    const originalDispatch = dispatches.find((d) => d.id === dispatchId)
    if (!originalDispatch) return

    if (originalDispatch.status === newStatus) return

    // Optimistic UI update
    setDispatches((prev) =>
      prev.map((d) => (d.id === dispatchId ? { ...d, status: newStatus } : d))
    )

    try {
      const result = await dispatchApi.update(dispatchId, { status: newStatus })

      if (!result.ok) {
        throw new Error('Failed to update dispatch status')
      }

      // Dispatch custom event to notify other components (e.g. NurseMatrix)
      window.dispatchEvent(new Event('socket-dispatch-update'))
    } catch (error) {
      console.error('Drag update failed:', error)
      // Revert on error
      setDispatches((prev) =>
        prev.map((d) => (d.id === dispatchId ? { ...d, status: originalDispatch.status } : d))
      )
      alert('Failed to update status. Reverting changes.')
    }
  }

  const handleAssignNurse = (dispatch: Dispatch) => {
    setSelectedDispatch(dispatch)
    setAssignModalOpen(true)
  }

  const handleSaveAssignment = async (nurseId: string | null) => {
    if (!selectedDispatch) return

    const originalDispatches = [...dispatches]

    // Optimistic UI update
    setDispatches((prev) =>
      prev.map((d) =>
        d.id === selectedDispatch.id
          ? {
              ...d,
              nurseId,
              // If unassigning, set nurse to null, else we'll let it fetch the new nurse info or temporary name
              nurse: nurseId ? { id: nurseId, name: 'Updating...', avatar: '' } : null,
              status: nurseId ? 'ASSIGNED' : 'PENDING',
            }
          : d
      )
    )

    try {
      const result = await dispatchApi.update(selectedDispatch.id, {
        nurseId,
        status: nurseId ? 'ASSIGNED' : 'PENDING',
      })

      if (!result.ok) {
        throw new Error('Failed to assign nurse')
      }

      fetchDispatches() // Get complete updated objects with nurse profile
      window.dispatchEvent(new Event('socket-dispatch-update'))
    } catch (error) {
      console.error('Assignment failed:', error)
      setDispatches(originalDispatches)
      alert('Failed to assign nurse. Reverting.')
    }
  }

  const handleAddNote = (dispatch: Dispatch) => {
    setSelectedDispatch(dispatch)
    setNoteValue(dispatch.notes || '')
    setNoteDialogOpen(true)
  }

  const handleSaveNote = async () => {
    if (!selectedDispatch) return

    try {
      const result = await dispatchApi.update(selectedDispatch.id, { notes: noteValue })

      if (!result.ok) {
        throw new Error('Failed to save notes')
      }

      setNoteDialogOpen(false)
      fetchDispatches()
    } catch (error) {
      console.error('Save notes failed:', error)
      alert('Failed to save notes.')
    }
  }

  const handleCancelClick = (dispatch: Dispatch) => {
    setSelectedDispatch(dispatch)
    setCancelDialogOpen(true)
  }

  const handleConfirmCancel = async () => {
    if (!selectedDispatch) return

    try {
      const result = await dispatchApi.cancel(selectedDispatch.id)

      if (!result.ok) {
        throw new Error('Failed to cancel dispatch')
      }

      setCancelDialogOpen(false)
      fetchDispatches()
      window.dispatchEvent(new Event('socket-dispatch-update'))
    } catch (error) {
      console.error('Cancel failed:', error)
      alert('Failed to cancel dispatch.')
    }
  }

  // Filter logic
  const filteredDispatches = dispatches.filter((d) => {
    const patientName = d.patient?.name || ''
    const matchesSearch = patientName.toLowerCase().includes(search.toLowerCase())
    const matchesPriority = priorityFilter === 'ALL' || d.priority === priorityFilter
    const matchesNurse =
      nurseFilter === 'ALL' ||
      (nurseFilter === 'UNASSIGNED' && !d.nurseId) ||
      d.nurseId === nurseFilter

    // Don't show CANCELLED on main Kanban columns (we handle columns for PENDING, ASSIGNED, IN_PROGRESS, COMPLETED)
    return matchesSearch && matchesPriority && matchesNurse && d.status !== 'CANCELLED'
  })

  // Grouping dispatches by status
  const getDispatchesByStatus = (status: DispatchStatus) => {
    return filteredDispatches.filter((d) => d.status === status)
  }

  // Get unique nurses for filtering dropdown
  const uniqueNurses = Array.from(
    new Map(
      dispatches
        .filter((d) => d.nurse)
        .map((d) => [d.nurse!.id, d.nurse])
    ).values()
  )

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        {/* Search */}
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

        {/* Priority Filter */}
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

        {/* Nurse Filter */}
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

      {/* Kanban Board Container */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-8 snap-x scroll-smooth custom-scrollbar">
          <KanbanColumn
            id="PENDING"
            title="Pending Dispatch"
            count={getDispatchesByStatus('PENDING').length}
          >
            {getDispatchesByStatus('PENDING').map((d) => (
              <DispatchCard
                key={d.id}
                dispatch={d}
                onAssignNurse={handleAssignNurse}
                onAddNote={handleAddNote}
                onCancel={handleCancelClick}
              />
            ))}
          </KanbanColumn>

          <KanbanColumn
            id="ASSIGNED"
            title="Nurse Assigned"
            count={getDispatchesByStatus('ASSIGNED').length}
          >
            {getDispatchesByStatus('ASSIGNED').map((d) => (
              <DispatchCard
                key={d.id}
                dispatch={d}
                onAssignNurse={handleAssignNurse}
                onAddNote={handleAddNote}
                onCancel={handleCancelClick}
              />
            ))}
          </KanbanColumn>

          <KanbanColumn
            id="IN_PROGRESS"
            title="In Progress"
            count={getDispatchesByStatus('IN_PROGRESS').length}
          >
            {getDispatchesByStatus('IN_PROGRESS').map((d) => (
              <DispatchCard
                key={d.id}
                dispatch={d}
                onAssignNurse={handleAssignNurse}
                onAddNote={handleAddNote}
                onCancel={handleCancelClick}
              />
            ))}
          </KanbanColumn>

          <KanbanColumn
            id="COMPLETED"
            title="Completed"
            count={getDispatchesByStatus('COMPLETED').length}
          >
            {getDispatchesByStatus('COMPLETED').map((d) => (
              <DispatchCard
                key={d.id}
                dispatch={d}
                onAssignNurse={handleAssignNurse}
                onAddNote={handleAddNote}
                onCancel={handleCancelClick}
              />
            ))}
          </KanbanColumn>
        </div>
      </DndContext>

      {/* Assign Nurse Modal */}
      <AssignNurseModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        currentNurseId={selectedDispatch?.nurseId}
        onAssign={handleSaveAssignment}
      />

      {/* Note Modification Dialog */}
      {noteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm" onClick={() => setNoteDialogOpen(false)} />
          <div className="relative z-10 w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 shadow-2xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Edit Notes</h3>
            <p className="text-xs text-gray-500 mb-4">Update operational notes for {selectedDispatch?.patient?.name}</p>
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

      {/* Cancel Confirmation Dialog */}
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
