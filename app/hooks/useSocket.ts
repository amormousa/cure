'use client'

// app/hooks/useSocket.ts
// Connects to Socket.io server and maps events to window custom events
// so any component can react without prop drilling.

import { useEffect } from 'react'
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket'

type SocketEventMap = Record<string, (data: unknown) => void>

/**
 * Mount this hook once per page-tree (e.g. in dashboard layout or root page).
 * It connects the socket, attaches the provided event handlers, and cleans up on unmount.
 *
 * Additionally, every socket event is re-dispatched as a window CustomEvent
 * so decoupled components (NurseMatrix, KanbanBoard) can react without receiving props.
 */
export function useSocket(events?: SocketEventMap) {
  useEffect(() => {
    const socket = connectSocket()

    // Attach caller-supplied listeners
    if (events) {
      Object.entries(events).forEach(([event, handler]) => {
        socket.on(event, handler)
      })
    }

    // Also forward all known events as window CustomEvents
    const broadcastEvents = [
      'dispatch:created',
      'dispatch:updated',
      'dispatch:cancelled',
      'nurse:online',
      'nurse:offline',
    ]

    const broadcastHandlers: Record<string, (data: unknown) => void> = {}

    broadcastEvents.forEach((eventName) => {
      const handler = (data: unknown) => {
        const isPresenceEvent = eventName.startsWith('nurse:')
        window.dispatchEvent(
          new CustomEvent(
            isPresenceEvent ? 'socket-presence-update' : 'socket-dispatch-update',
            { detail: { event: eventName, data } }
          )
        )
      }
      broadcastHandlers[eventName] = handler
      socket.on(eventName, handler)
    })

    return () => {
      // Cleanup caller listeners
      if (events) {
        Object.entries(events).forEach(([event, handler]) => {
          socket.off(event, handler)
        })
      }
      // Cleanup broadcast listeners
      broadcastEvents.forEach((eventName) => {
        socket.off(eventName, broadcastHandlers[eventName])
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export default useSocket
