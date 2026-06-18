// app/lib/socket.ts
// Client-side Socket.io singleton — lazy connect, only runs in browser

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001'
    socket = io(url, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      // Reconnection config
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15000,
      timeout: 20000,
    })

    // Log lifecycle events (useful during dev, safe in prod)
    socket.on('connect', () => {
      console.info('[Socket] Connected:', socket?.id)
    })

    socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason)
      // If server disconnected us, try to reconnect manually
      if (reason === 'io server disconnect') {
        socket?.connect()
      }
    })

    socket.on('reconnect_attempt', (attempt) => {
      console.info(`[Socket] Reconnect attempt #${attempt}`)
    })

    socket.on('reconnect', (attempt) => {
      console.info(`[Socket] Reconnected after ${attempt} attempt(s)`)
    })

    socket.on('reconnect_failed', () => {
      console.error('[Socket] Reconnection failed after all attempts')
      // Emit a custom window event so the UI can show a persistent banner
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('socket-reconnect-failed'))
      }
    })

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message)
    })
  }
  return socket
}

export function connectSocket(): Socket {
  const s = getSocket()
  if (!s.connected) {
    s.connect()
  }
  return s
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect()
  }
}

/** Returns current connection state without creating the socket */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false
}
