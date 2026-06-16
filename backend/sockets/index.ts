// backend/sockets/index.ts
// Standalone Socket.io server — runs on SOCKET_PORT (default 3001).
// Start with: npx tsx backend/sockets/index.ts
// Replaces the old socket-server.ts at project root.

import 'dotenv/config'
import http from 'http'
import { Server } from 'socket.io'
import { prisma } from '@/lib/prisma'
import { createLogger } from '@/backend/utils/logger'
import type { SocketDispatchUpdate, SocketNursePresence } from '@/backend/types/models'

const log = createLogger('SocketServer')

const PORT = parseInt(process.env.SOCKET_PORT ?? '3001', 10)
const CORS_ORIGIN = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

const httpServer = http.createServer()

const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

io.on('connection', async (socket) => {
  log.info(`Client connected: ${socket.id}`)

  const userId = socket.handshake.auth?.userId as string | undefined

  // Mark nurse as online
  if (userId) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: true },
      })
      socket.broadcast.emit('nurse:online', { userId } satisfies SocketNursePresence)
      log.info(`User ${userId} is now ONLINE`)
    } catch (err) {
      log.error('Failed to mark user online', err)
    }
  }

  // ── Dispatch events ────────────────────────────────────────
  socket.on('dispatch:status_changed', (data: SocketDispatchUpdate) => {
    socket.broadcast.emit('dispatch:updated', data)
    log.debug('dispatch:status_changed → broadcast', data)
  })

  socket.on('dispatch:nurse_assigned', (data: { id: string; nurseId: string | null }) => {
    socket.broadcast.emit('dispatch:updated', {
      ...data,
      status: data.nurseId ? 'ASSIGNED' : 'PENDING',
    })
    log.debug('dispatch:nurse_assigned → broadcast', data)
  })

  socket.on('dispatch:created', (data: unknown) => {
    socket.broadcast.emit('dispatch:created', data)
    log.debug('dispatch:created → broadcast')
  })

  // ── Disconnect ─────────────────────────────────────────────
  socket.on('disconnect', async () => {
    log.info(`Client disconnected: ${socket.id}`)

    if (userId) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: false },
        })
        io.emit('nurse:offline', { userId } satisfies SocketNursePresence)
        log.info(`User ${userId} is now OFFLINE`)
      } catch (err) {
        log.error('Failed to mark user offline', err)
      }
    }
  })
})

httpServer.listen(PORT, () => {
  log.info(`✅ Socket.io server running on http://localhost:${PORT}`)
  log.info(`   CORS origin: ${CORS_ORIGIN}`)
})

export { io, httpServer }
