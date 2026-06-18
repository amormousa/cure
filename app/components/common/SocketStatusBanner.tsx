// app/components/common/SocketStatusBanner.tsx
'use client'

import { useEffect, useState } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

export function SocketStatusBanner() {
  const [status, setStatus] = useState<'ok' | 'reconnecting' | 'failed'>('ok')

  useEffect(() => {
    const handleDisconnect = () => setStatus('reconnecting')
    const handleReconnect = () => setStatus('ok')
    const handleFailed = () => setStatus('failed')

    window.addEventListener('socket-reconnect-failed', handleFailed)

    // Also listen to socket events if socket was already created
    try {
      // Dynamic import avoids SSR crash
      import('@/app/lib/socket').then(({ getSocket }) => {
        const s = getSocket()
        s.on('disconnect', handleDisconnect)
        s.on('reconnect', handleReconnect)
        s.on('reconnect_failed', handleFailed)
      })
    } catch {}

    return () => {
      window.removeEventListener('socket-reconnect-failed', handleFailed)
    }
  }, [])

  if (status === 'ok') return null

  return (
    <div
      role="alert"
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-2.5 shadow-lg text-sm font-medium transition-all
        ${status === 'reconnecting' ? 'bg-amber-500 text-white' : 'bg-red-600 text-white'}`}
    >
      {status === 'reconnecting' ? (
        <>
          <Wifi className="h-4 w-4 animate-pulse" />
          Reconnecting to live server…
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          Live connection lost. Please refresh.
          <button
            onClick={() => window.location.reload()}
            className="ml-2 underline underline-offset-2 hover:no-underline"
          >
            Refresh
          </button>
        </>
      )}
    </div>
  )
}
