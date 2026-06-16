'use client'

import React from 'react'
import { Loader2, AlertCircle } from 'lucide-react'

interface AsyncStateWrapperProps<T> {
  isLoading?: boolean
  error?: string | null | { message: string }
  data?: T | null
  children: (data: T) => React.ReactNode
  loadingFallback?: React.ReactNode
  errorFallback?: (error: string, retry?: () => void) => React.ReactNode
  emptyFallback?: React.ReactNode
  onRetry?: () => void
}

export function AsyncStateWrapper<T>({
  isLoading = false,
  error,
  data,
  children,
  loadingFallback,
  errorFallback,
  emptyFallback,
  onRetry,
}: AsyncStateWrapperProps<T>) {
  const errorMessage = typeof error === 'string' ? error : error?.message

  if (isLoading) {
    return loadingFallback ?? <DefaultLoadingFallback />
  }

  if (errorMessage) {
    return errorFallback ? (
      errorFallback(errorMessage, onRetry)
    ) : (
      <DefaultErrorFallback message={errorMessage} onRetry={onRetry} />
    )
  }

  if (!data) {
    return emptyFallback ?? <DefaultEmptyFallback />
  }

  return children(data)
}

function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="space-y-4 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

interface DefaultErrorFallbackProps {
  message: string
  onRetry?: () => void
}

function DefaultErrorFallback({ message, onRetry }: DefaultErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{message}</p>
          </div>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}

function DefaultEmptyFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-gray-500 text-center">No data available</p>
    </div>
  )
}

export default AsyncStateWrapper
