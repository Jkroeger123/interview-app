'use client'

import { Component, type ReactNode } from 'react'
import posthog from 'posthog-js'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Error boundary that captures React errors to PostHog
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Capture the error to PostHog
    posthog.captureException(error, {
      $exception_severity: 'fatal',
      $exception_source: 'react_error_boundary',
      componentStack: errorInfo.componentStack,
      // Get current URL for context
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    })

    // Also capture as an event
    posthog.capture('app_crash', {
      error_name: error.name,
      error_message: error.message,
      component_stack: errorInfo.componentStack,
    })

    console.error('[ErrorBoundary] React error caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Something went wrong</h1>
              <p className="text-muted-foreground">
                We've been notified and are looking into it. Please try again.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
                <p className="font-mono text-red-800 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
              >
                Go Home
              </Button>
              <Button onClick={this.handleReset}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
