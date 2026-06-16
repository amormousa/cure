// app/lib/socket/index.ts
// Enhanced Socket.io client with authentication and reconnection logic

import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'

const log = {
  debug: (message: string, data?: unknown) => {
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.debug(message, data)
  },
  info: (message: string, data?: unknown) => {
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.info(message, data)
  },
  warn: (message: string, data?: unknown) => console.warn(message, data),
  error: (message: string, data?: unknown) => console.error(message, data),
}

let socketInstance: Socket | null = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 10

export function connectSocket(): Socket {
  if (socketInstance?.connected) {
    return socketInstance
  }

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

  socketInstance = io(socketUrl, {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    transports: ['websocket', 'polling'],
    withCredentials: true,
  })

  // Connection event handlers
  socketInstance.on('connect', () => {
    log.info('Socket connected')
    reconnectAttempts = 0
    window.dispatchEvent(new CustomEvent('socket-connected'))
  })

  socketInstance.on('disconnect', (reason) => {
    log.warn('Socket disconnected', { reason })
    window.dispatchEvent(new CustomEvent('socket-disconnected', { detail: { reason } }))
  })

  socketInstance.on('connect_error', (error) => {
    log.error('Socket connection error', { error: error.message })
    reconnectAttempts++
    window.dispatchEvent(new CustomEvent('socket-error', { detail: { error: error.message } }))
  })

  socketInstance.on('reconnect_attempt', () => {
    log.info('Socket reconnect attempt', { attempt: reconnectAttempts })
  })

  socketInstance.on('reconnect_failed', () => {
    log.error('Socket reconnect failed after max attempts')
    window.dispatchEvent(new CustomEvent('socket-reconnect-failed'))
  })

  return socketInstance
}

export function getSocket(): Socket {
  if (!socketInstance) {
    return connectSocket()
  }
  return socketInstance
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
    log.info('Socket disconnected')
  }
}

export function isSocketConnected(): boolean {
  return socketInstance?.connected ?? false
}

// Event listener setup
export function setupSocketListeners(
  callbacks: Record<string, (data: any) => void>
): () => void {
  const socket = getSocket()

  // Setup all provided callbacks
  Object.entries(callbacks).forEach(([event, callback]) => {
    socket.on(event, (data) => {
      log.debug(`Socket event received: ${event}`, { data })
      callback(data)
    })
  })

  // Return cleanup function
  return () => {
    Object.keys(callbacks).forEach((event) => {
      socket.off(event)
    })
  }
}

// Emit event with promise (for acknowledgments)
export async function emitSocketEvent<T = any>(
  event: string,
  data?: any,
  timeout: number = 5000
): Promise<T | null> {
  return new Promise((resolve) => {
    const socket = getSocket()

    if (!socket.connected) {
      log.warn(`Socket not connected, cannot emit ${event}`)
      resolve(null)
      return
    }

    const timeoutId = setTimeout(() => {
      log.warn(`Socket event timeout: ${event}`)
      resolve(null)
    }, timeout)

    socket.emit(event, data, (ack: T) => {
      clearTimeout(timeoutId)
      log.debug(`Socket event acknowledgment: ${event}`, { ack })
      resolve(ack)
    })
  })
}

// Hook for real-time events
export function useSocketListener(
  events: Record<string, (data: any) => void>,
  enabled: boolean = true
) {
  if (typeof window === 'undefined') return

  useEffect(() => {
    if (!enabled) return

    const cleanup = setupSocketListeners(events)
    return cleanup
  }, [events, enabled])
}
