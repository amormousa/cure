// backend/utils/logger.ts
// Structured logger — replaces raw console.log/error across the backend.
// No external deps; wraps console with timestamps, levels, and context.

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
}

const RESET = '\x1b[0m'

const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'debug'

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL]
}

function formatTimestamp(): string {
  return new Date().toISOString()
}

function formatMessage(level: LogLevel, context: string, message: string, meta?: unknown): string {
  const ts = formatTimestamp()
  const color = LEVEL_COLORS[level]
  const prefix = `${color}[${level.toUpperCase()}]${RESET} ${ts} [${context}]`
  if (meta !== undefined) {
    return `${prefix} ${message} ${JSON.stringify(meta, null, 0)}`
  }
  return `${prefix} ${message}`
}

/** Create a logger scoped to a specific context (e.g. route or service name). */
export function createLogger(context: string) {
  return {
    debug(message: string, meta?: unknown) {
      if (shouldLog('debug')) console.debug(formatMessage('debug', context, message, meta))
    },
    info(message: string, meta?: unknown) {
      if (shouldLog('info')) console.info(formatMessage('info', context, message, meta))
    },
    warn(message: string, meta?: unknown) {
      if (shouldLog('warn')) console.warn(formatMessage('warn', context, message, meta))
    },
    error(message: string, meta?: unknown) {
      if (shouldLog('error')) console.error(formatMessage('error', context, message, meta))
    },
  }
}

/** Default application-wide logger. */
export const logger = createLogger('App')
