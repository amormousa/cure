// socket-server.ts
// Standalone Socket.io server — runs on SOCKET_PORT (default 3001)
// Start with: npx tsx socket-server.ts

import 'dotenv/config'
import http from 'http'
import { Server } from 'socket.io'
import { prisma } from './app/lib/prisma'

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
  console.log(`[socket] client connected: ${socket.id}`)

  const userId = socket.handshake.auth?.userId as string | undefined

  // Mark nurse as online when they connect with a userId
  if (userId) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: true },
      })
      // Broadcast to all other clients that this nurse is online
      socket.broadcast.emit('nurse:online', { userId })
      console.log(`[socket] user ${userId} is now ONLINE`)
    } catch (err) {
      console.error('[socket] Failed to mark user online:', err)
    }
  }

  // ── Dispatch events ────────────────────────────────────────
  socket.on('dispatch:status_changed', (data: { id: string; status: string; nurseId?: string | null }) => {
    // Broadcast to ALL other clients so their boards update live
    socket.broadcast.emit('dispatch:updated', data)
    console.log(`[socket] dispatch:status_changed → broadcast dispatch:updated`, data)
  })

  socket.on('dispatch:nurse_assigned', (data: { id: string; nurseId: string | null }) => {
    socket.broadcast.emit('dispatch:updated', { ...data, status: data.nurseId ? 'ASSIGNED' : 'PENDING' })
    console.log(`[socket] dispatch:nurse_assigned → broadcast dispatch:updated`, data)
  })

  socket.on('dispatch:created', (data: unknown) => {
    socket.broadcast.emit('dispatch:created', data)
    console.log(`[socket] dispatch:created → broadcast`, data)
  })

  // ── Disconnect ─────────────────────────────────────────────
  socket.on('disconnect', async () => {
    console.log(`[socket] client disconnected: ${socket.id}`)

    if (userId) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: false },
        })
        io.emit('nurse:offline', { userId })
        console.log(`[socket] user ${userId} is now OFFLINE`)
      } catch (err) {
        console.error('[socket] Failed to mark user offline:', err)
      }
    }
  })
})

httpServer.listen(PORT, () => {
  console.log(`✅ Socket.io server running on http://localhost:${PORT}`)
  console.log(`   CORS origin: ${CORS_ORIGIN}`)
})
