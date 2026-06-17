'use client'

/**
 * useKanbanDnD — normalized Kanban board state with optimistic updates, rollback,
 * real-time socket conflict guarding, and position tracking.
 *
 * State shape:
 *   { PENDING: KanbanItem[], ASSIGNED: KanbanItem[], IN_PROGRESS: KanbanItem[], COMPLETED: KanbanItem[] }
 *
 * Each KanbanItem carries a `position` index derived from its array position.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { Dispatch, DispatchStatus } from '@/types'
import { dispatchApi } from '@/app/lib/api/endpoints'
import { toast } from '@/app/components/common/Toast'

// ─── Types ──────────────────────────────────────────────────────────

export const COLUMN_IDS: DispatchStatus[] = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED']

export const COLUMN_META: { id: DispatchStatus; title: string }[] = [
  { id: 'PENDING', title: 'Pending Dispatch' },
  { id: 'ASSIGNED', title: 'Nurse Assigned' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'COMPLETED', title: 'Completed' },
]

export interface KanbanItem extends Dispatch {
  position: number
}

export type KanbanState = Record<DispatchStatus, KanbanItem[]>

interface Snapshot {
  state: KanbanState
  sourceCol: DispatchStatus
  itemId: string
}

// ─── Normalization helpers ──────────────────────────────────────────

function toKanbanState(items: Dispatch[]): KanbanState {
  const state = {} as KanbanState
  for (const col of COLUMN_IDS) {
    state[col] = []
  }
  for (const item of items) {
    if (item.status !== 'CANCELLED' && COLUMN_IDS.includes(item.status)) {
      state[item.status].push({ ...item, position: state[item.status].length })
    }
  }
  return state
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useKanbanDnD() {
  const [columns, setColumns] = useState<KanbanState>(() => toKanbanState([]))
  const [loading, setLoading] = useState(true)

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null)

  // Rollback snapshot
  const snapshotRef = useRef<Snapshot | null>(null)
  const isDraggingRef = useRef(false)

  // ─── Data fetching ──────────────────────────────

  const fetchDispatches = useCallback(async () => {
    try {
      const result = await dispatchApi.list()
      if (result.ok && result.data) {
        const items = result.data.data as Dispatch[]
        setColumns(toKanbanState(items))
      }
    } catch (error) {
      console.error('fetchDispatches failed:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDispatches()
    const interval = setInterval(fetchDispatches, 10000)
    return () => clearInterval(interval)
  }, [fetchDispatches])

  // ─── Real-time socket sync ─────────────────────

  useEffect(() => {
    const handler = () => {
      if (!isDraggingRef.current) fetchDispatches()
    }
    window.addEventListener('socket-dispatch-update', handler)
    return () => window.removeEventListener('socket-dispatch-update', handler)
  }, [fetchDispatches])

  // ─── Drag handlers ──────────────────────────────

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string
    setActiveId(id)
    isDraggingRef.current = true

    setColumns((prev) => {
      for (const col of COLUMN_IDS) {
        const idx = prev[col].findIndex((i) => i.id === id)
        if (idx !== -1) {
          snapshotRef.current = { state: structuredClone(prev), sourceCol: col, itemId: id }
          break
        }
      }
      return prev
    })
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const snap = snapshotRef.current
    const itemId = activeId
    setActiveId(null)
    isDraggingRef.current = false
    snapshotRef.current = null

    const { active, over } = event
    if (!over || !snap || !itemId) return

    const sourceCol = snap.sourceCol
    const overId = over.id as string

    // Resolve target column: over.id may be a card ID (from closestCorners) or a column ID
    const targetCol = COLUMN_IDS.includes(overId as DispatchStatus)
      ? (overId as DispatchStatus)
      : (() => {
          for (const col of COLUMN_IDS) {
            if (columns[col].some((i) => i.id === overId)) return col
          }
          return null
        })()

    if (!targetCol || (sourceCol === targetCol && active.id === over.id)) return

    // ── 1. Optimistic update ──
    setColumns((prev) => {
      const item = prev[sourceCol].find((i) => i.id === itemId)
      if (!item) return prev

      const next = { ...prev }

      // Remove from source
      next[sourceCol] = next[sourceCol]
        .filter((i) => i.id !== itemId)
        .map((i, idx) => ({ ...i, position: idx }))

      if (!COLUMN_IDS.includes(targetCol)) return next

      // Determine insertion index: if over is a column header, append; if over is a card, insert before it
      const isOverColumn = COLUMN_IDS.includes(overId as DispatchStatus)
      const overItemId = isOverColumn ? null : overId
      let insertAt = next[targetCol].length
      if (overItemId) {
        const overIdx = next[targetCol].findIndex((i) => i.id === overItemId)
        if (overIdx !== -1) insertAt = overIdx
      }

      // Insert with updated status + position
      const updated = { ...item, status: targetCol as DispatchStatus, position: insertAt }
      next[targetCol] = [
        ...next[targetCol].slice(0, insertAt),
        updated,
        ...next[targetCol].slice(insertAt),
      ].map((i, idx) => ({ ...i, position: idx }))

      return next
    })

    // ── 2. API call ──
    try {
      const result = await dispatchApi.update(itemId, {
        status: targetCol as DispatchStatus,
      })
      if (!result.ok) {
        const msg = result.error?.message || 'Unknown server error'
        throw new Error(msg)
      }
      window.dispatchEvent(new Event('socket-dispatch-update'))
    } catch (error) {
      console.error('Drag update failed:', error)
      // Rollback to snapshot
      setColumns(snap.state)
      const msg = error instanceof Error ? error.message : 'Failed to update status'
      toast(`Could not move item: ${msg}`, 'error')
    }
  }, [activeId])

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
    isDraggingRef.current = false
    if (snapshotRef.current) {
      setColumns(snapshotRef.current.state)
      snapshotRef.current = null
    }
  }, [])

  // ─── Derived helpers ────────────────────────────

  const activeItem = activeId
    ? (() => {
        for (const col of COLUMN_IDS) {
          const found = columns[col].find((i) => i.id === activeId)
          if (found) return found
        }
        return null
      })()
    : null

  const getColumnItems = useCallback(
    (status: DispatchStatus) => columns[status] ?? [],
    [columns]
  )

  return {
    columns,
    loading,
    activeId,
    activeItem,
    getColumnItems,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    fetchDispatches,
  }
}
