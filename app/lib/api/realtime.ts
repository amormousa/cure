'use client'

import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { connectSocket, isSocketConnected } from '@/lib/socket'
import { queryKeys } from './hooks'

export function useRealtimeDispatches() {
  const queryClient = useQueryClient()

  const handleDispatchUpdate = useCallback(
    (data: unknown) => {
      const typedData = data as Record<string, unknown>
      queryClient.setQueryData(queryKeys.dispatches.detail(typedData.id as string), (old: unknown) => {
        const current = old && typeof old === 'object' ? old : {}

        return {
          ...current,
          ...typedData,
          updatedAt: new Date().toISOString(),
        }
      })

      queryClient.invalidateQueries({ queryKey: queryKeys.dispatches.all })
    },
    [queryClient]
  )

  const handleDispatchCreated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dispatches.all })
  }, [queryClient])

  const handleDispatchCancelled = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dispatches.all })
  }, [queryClient])

  const handleNurseStatusChanged = useCallback(() => {
    // Invalidate both dispatch and user queries when nurse status changes
    queryClient.invalidateQueries({ queryKey: queryKeys.dispatches.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
  }, [queryClient])

  useEffect(() => {
    if (!isSocketConnected()) {
      const socket = connectSocket()

      socket.on('dispatch:status_changed', handleDispatchUpdate)
      socket.on('dispatch:updated', handleDispatchUpdate)
      socket.on('dispatch:created', handleDispatchCreated)
      socket.on('dispatch:cancelled', handleDispatchCancelled)
      socket.on('dispatch:nurse_assigned', handleDispatchUpdate)
      socket.on('nurse:online', handleNurseStatusChanged)
      socket.on('nurse:offline', handleNurseStatusChanged)

      return () => {
        socket.off('dispatch:status_changed', handleDispatchUpdate)
        socket.off('dispatch:updated', handleDispatchUpdate)
        socket.off('dispatch:created', handleDispatchCreated)
        socket.off('dispatch:cancelled', handleDispatchCancelled)
        socket.off('dispatch:nurse_assigned', handleDispatchUpdate)
        socket.off('nurse:online', handleNurseStatusChanged)
        socket.off('nurse:offline', handleNurseStatusChanged)
      }
    }
  }, [handleDispatchUpdate, handleDispatchCreated, handleDispatchCancelled, handleNurseStatusChanged])

  return queryClient
}

export default useRealtimeDispatches
