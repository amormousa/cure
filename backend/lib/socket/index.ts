// backend/lib/socket/index.ts
// Enhanced Socket.io event emitter with retry logic and error handling

import { io as createSocketClient } from 'socket.io-client'
import { createLogger } from '@/backend/utils/logger'

const log = createLogger('SocketEmitter')

export type SocketEventPayload = Record<string, unknown> | unknown[] | string | number | boolean | null

interface EmitOptions {
  retries?: number
  timeout?: number
  backoffMultiplier?: number
}

const DEFAULT_OPTIONS: EmitOptions = {
  retries: 2,
  timeout: 2000,
  backoffMultiplier: 2,
}

// Skip socket emission in test environment
const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.VITEST

export async function emitSocketEvent(
  event: string,
  data: SocketEventPayload,
  options: EmitOptions = {}
): Promise<{ success: boolean; error?: string }> {
  // In test environment, just log and return success
  if (isTestEnvironment) {
    log.debug(`[TEST MODE] Skipping socket emit`, { event })
    return { success: true }
  }

  const opts = { ...DEFAULT_OPTIONS, ...options }
  let attempt = 0

  const attemptEmit = (): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      attempt++

      try {
        const socketUrl = process.env.SOCKET_URL || 'http://localhost:3001'
        const socketClient = createSocketClient(socketUrl, {
          transports: ['websocket'],
          autoConnect: true,
          reconnection: false,
          timeout: opts.timeout,
        })

        const cleanup = (success: boolean, error?: string) => {
          try {
            if (socketClient.connected) {
              socketClient.disconnect()
            }
          } catch (err) {
            log.warn('Error disconnecting socket client', { err })
          }
          resolve({ success, error })
        }

        const timer = setTimeout(() => {
          log.warn(`Socket emit timeout on attempt ${attempt}/${opts.retries}`, { event })
          cleanup(false, 'Timeout')
        }, opts.timeout! + 1000)

        socketClient.on('connect', () => {
          log.debug(`Socket connected for event: ${event}`)

          socketClient.emit(event, data, (ack: unknown) => {
            clearTimeout(timer)
            log.info(`Socket event emitted successfully`, { event, attempt })
            cleanup(true)
          })
        })

        socketClient.on('connect_error', async (err: Error) => {
          clearTimeout(timer)
          log.warn(`Socket connection error on attempt ${attempt}/${opts.retries}`, {
            event,
            error: err.message,
          })

          if (attempt < opts.retries!) {
            const delay = 1000 * Math.pow(opts.backoffMultiplier!, attempt - 1)
            log.info(`Retrying socket emit in ${delay}ms`, { event, attempt })
            setTimeout(() => {
              attemptEmit().then(resolve)
            }, delay)
          } else {
            cleanup(
              false,
              `Failed after ${opts.retries} attempts: ${err.message}`
            )
          }
        })

        socketClient.on('error', (err: any) => {
          clearTimeout(timer)
          log.error(`Socket error event`, { event, error: err })
          cleanup(false, err?.message || 'Socket error')
        })
      } catch (err) {
        log.error(`Exception during socket emit attempt ${attempt}:`, { event, err })

        if (attempt < opts.retries!) {
          const delay = 1000 * Math.pow(opts.backoffMultiplier!, attempt - 1)
          setTimeout(() => {
            attemptEmit().then(resolve)
          }, delay)
        } else {
          resolve({
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          })
        }
      }
    })
  }

  return attemptEmit()
}

// Batch emit for multiple events
export async function emitSocketEventBatch(
  events: Array<{ event: string; data: SocketEventPayload }>,
  options?: EmitOptions
): Promise<{ successCount: number; failureCount: number; errors: string[] }> {
  const results = await Promise.all(
    events.map((e) => emitSocketEvent(e.event, e.data, options))
  )

  return {
    successCount: results.filter((r) => r.success).length,
    failureCount: results.filter((r) => !r.success).length,
    errors: results.filter((r) => !r.success).map((r) => r.error!),
  }
}

