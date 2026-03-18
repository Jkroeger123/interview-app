import posthog from 'posthog-js'

/**
 * PostHog error tracking utilities for interview app
 */

type ErrorSeverity = 'error' | 'warning' | 'fatal'

interface ErrorContext {
  // Interview context
  interviewId?: string
  visaType?: string
  userId?: string
  
  // Call context
  roomName?: string
  agentState?: string
  connectionState?: string
  
  // Additional context
  [key: string]: unknown
}

/**
 * Capture an exception/error to PostHog
 */
export function captureError(
  error: Error | string,
  context?: ErrorContext,
  severity: ErrorSeverity = 'error'
) {
  const errorObj = typeof error === 'string' ? new Error(error) : error

  posthog.captureException(errorObj, {
    ...context,
    $exception_severity: severity,
    $exception_source: 'frontend',
  })

  // Also log to console for debugging
  console.error(`[PostHog ${severity}]`, errorObj.message, context)
}

/**
 * Interview-specific error tracking
 */
export const interviewErrors = {
  /**
   * Agent failed to join the call within timeout
   */
  agentNotJoined: (context: {
    timeoutMs: number
    agentState: string
    roomName?: string
    interviewId?: string
    visaType?: string
  }) => {
    captureError(
      new Error(`Agent did not join call within ${context.timeoutMs / 1000}s`),
      {
        error_type: 'agent_not_joined',
        ...context,
      },
      'error'
    )

    // Also capture as an event for easier querying
    posthog.capture('interview_error', {
      error_type: 'agent_not_joined',
      ...context,
    })
  },

  /**
   * Connection to LiveKit room failed
   */
  connectionFailed: (context: {
    error: Error
    roomName?: string
    interviewId?: string
    visaType?: string
  }) => {
    captureError(
      context.error,
      {
        error_type: 'connection_failed',
        error_name: context.error.name,
        error_message: context.error.message,
        ...context,
      },
      'error'
    )

    posthog.capture('interview_error', {
      error_type: 'connection_failed',
      error_name: context.error.name,
      error_message: context.error.message,
      ...context,
    })
  },

  /**
   * Media device error (microphone/camera issues)
   */
  mediaDeviceError: (context: {
    error: Error
    deviceType?: 'microphone' | 'camera' | 'unknown'
    roomName?: string
    interviewId?: string
  }) => {
    captureError(
      context.error,
      {
        error_type: 'media_device_error',
        error_name: context.error.name,
        error_message: context.error.message,
        ...context,
      },
      'error'
    )

    posthog.capture('interview_error', {
      error_type: 'media_device_error',
      ...context,
    })
  },

  /**
   * Unexpected disconnection from call
   */
  unexpectedDisconnect: (context: {
    reason?: string
    roomName?: string
    interviewId?: string
    elapsedTimeMs?: number
  }) => {
    captureError(
      new Error(`Unexpected disconnect: ${context.reason || 'unknown'}`),
      {
        error_type: 'unexpected_disconnect',
        ...context,
      },
      'warning'
    )

    posthog.capture('interview_error', {
      error_type: 'unexpected_disconnect',
      ...context,
    })
  },

  /**
   * Failed to fetch connection details from API
   */
  connectionDetailsFailed: (context: {
    error: Error
    interviewId?: string
  }) => {
    captureError(
      context.error,
      {
        error_type: 'connection_details_failed',
        error_message: context.error.message,
        ...context,
      },
      'error'
    )

    posthog.capture('interview_error', {
      error_type: 'connection_details_failed',
      ...context,
    })
  },

  /**
   * Generic interview error
   */
  generic: (
    message: string,
    context?: ErrorContext,
    severity: ErrorSeverity = 'error'
  ) => {
    captureError(new Error(message), context, severity)

    posthog.capture('interview_error', {
      error_type: 'generic',
      error_message: message,
      ...context,
    })
  },
}

/**
 * Capture successful interview events for comparison
 */
export const interviewEvents = {
  started: (context: { interviewId?: string; visaType?: string; roomName?: string }) => {
    posthog.capture('interview_started', context)
  },

  agentJoined: (context: { interviewId?: string; roomName?: string; joinTimeMs?: number }) => {
    posthog.capture('interview_agent_joined', context)
  },

  completed: (context: { interviewId?: string; durationMs?: number; visaType?: string; roomName?: string }) => {
    posthog.capture('interview_completed', context)
  },

  userDisconnected: (context: { interviewId?: string; reason?: string }) => {
    posthog.capture('interview_user_disconnected', context)
  },
}
