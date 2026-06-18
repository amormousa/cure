'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      retry: (failureCount, error: Error & { status?: number }) => {
        // Don't retry on 4xx errors except 408 (timeout)
        if (error?.status && error.status >= 400 && error.status < 500 && error.status !== 408) {
          return false
        }
        // Retry up to 3 times on network errors
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
})

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

export { queryClient }
