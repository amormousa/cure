// app/lib/socket-emitter.ts
import { io as clientIo } from 'socket.io-client'

export async function emitSocketEvent(event: string, data: any) {
  return new Promise<void>((resolve) => {
    try {
      const port = process.env.SOCKET_PORT ?? '3001'
      const socketUrl = `http://localhost:${port}`
      
      const socketClient = clientIo(socketUrl, {
        transports: ['websocket'],
        autoConnect: true,
      })

      socketClient.on('connect', () => {
        socketClient.emit(event, data)
        // Wait a small timeout to ensure the event is transmitted, then close
        setTimeout(() => {
          socketClient.disconnect()
          resolve()
        }, 50)
      })

      socketClient.on('connect_error', (err) => {
        console.error('[SocketEmitter] Connection error:', err.message)
        socketClient.disconnect()
        resolve()
      })
      
      // Safety timeout in case of hang
      setTimeout(() => {
        if (socketClient.connected) {
          socketClient.disconnect()
        }
        resolve()
      }, 1000)
    } catch (error) {
      console.error('[SocketEmitter] Error emitting socket event:', error)
      resolve()
    }
  })
}
