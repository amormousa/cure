'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in boundary:', error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
          <div className="rounded-full bg-red-50 p-4 text-red-600 shadow-sm border border-red-100">
            <AlertTriangle className="h-10 w-10 animate-bounce" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900 tracking-tight">Something went wrong</h2>
          <p className="mt-2 max-w-md text-sm text-gray-600">
            An unexpected error occurred in this section of the portal. Our team has been notified.
          </p>
          {this.state.error && (
            <pre className="mt-4 max-h-40 max-w-lg overflow-auto rounded bg-gray-50 p-3 text-left text-xs font-mono text-gray-500 border border-gray-200">
              {this.state.error.toString()}
            </pre>
          )}
          <button
            onClick={this.handleRetry}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
export default ErrorBoundary
