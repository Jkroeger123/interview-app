import { PostHog } from 'posthog-node'

/**
 * Server-side PostHog client for backend error tracking and analytics.
 * Use this in API routes, server actions, and cron jobs.
 */

// Singleton instance to avoid creating multiple clients
let posthogInstance: PostHog | null = null

function getPostHogClient(): PostHog {
  if (!posthogInstance) {
    posthogInstance = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_TOKEN!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      // Flush immediately for serverless environments
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return posthogInstance
}

type ErrorSeverity = 'error' | 'warning' | 'fatal'

interface ServerErrorContext {
  // Request context
  endpoint?: string
  method?: string
  userId?: string
  
  // Interview context
  interviewId?: string
  roomName?: string
  visaType?: string
  
  // Additional context
  [key: string]: unknown
}

/**
 * Capture a server-side error to PostHog
 */
export async function captureServerError(
  error: Error | string,
  context?: ServerErrorContext,
  severity: ErrorSeverity = 'error'
) {
  const posthog = getPostHogClient()
  const errorObj = typeof error === 'string' ? new Error(error) : error
  
  // Use a distinct ID - prefer userId if available, otherwise use 'server'
  const distinctId = context?.userId || 'server-backend'

  posthog.capture({
    distinctId,
    event: '$exception',
    properties: {
      $exception_message: errorObj.message,
      $exception_type: errorObj.name,
      $exception_stack_trace_raw: errorObj.stack,
      $exception_severity: severity,
      $exception_source: 'backend',
      ...context,
    },
  })

  // Also capture as a custom event for easier filtering
  posthog.capture({
    distinctId,
    event: 'server_error',
    properties: {
      error_name: errorObj.name,
      error_message: errorObj.message,
      error_severity: severity,
      ...context,
    },
  })

  // Flush immediately for serverless
  await posthog.shutdown()
  
  // Re-create instance for next call
  posthogInstance = null

  console.error(`[PostHog Server ${severity}]`, errorObj.message, context)
}

/**
 * Server-side error tracking utilities
 */
export const serverErrors = {
  /**
   * API route error
   */
  apiError: async (context: {
    endpoint: string
    method: string
    error: Error
    userId?: string
    statusCode?: number
  }) => {
    await captureServerError(
      context.error,
      {
        error_type: 'api_error',
        endpoint: context.endpoint,
        method: context.method,
        userId: context.userId,
        status_code: context.statusCode,
      },
      'error'
    )
  },

  /**
   * Database error
   */
  databaseError: async (context: {
    operation: string
    error: Error
    table?: string
    userId?: string
    interviewId?: string
  }) => {
    await captureServerError(
      context.error,
      {
        error_type: 'database_error',
        operation: context.operation,
        table: context.table,
        userId: context.userId,
        interviewId: context.interviewId,
      },
      'error'
    )
  },

  /**
   * External service error (OpenAI, LiveKit, Stripe, etc.)
   */
  externalServiceError: async (context: {
    service: 'openai' | 'livekit' | 'stripe' | 'resend' | 'clerk' | 'ragie' | string
    operation: string
    error: Error
    userId?: string
    interviewId?: string
  }) => {
    await captureServerError(
      context.error,
      {
        error_type: 'external_service_error',
        service: context.service,
        operation: context.operation,
        userId: context.userId,
        interviewId: context.interviewId,
      },
      'error'
    )
  },

  /**
   * Report generation error
   */
  reportGenerationError: async (context: {
    error: Error
    interviewId: string
    stage: 'transcript' | 'analysis' | 'saving' | string
    userId?: string
  }) => {
    await captureServerError(
      context.error,
      {
        error_type: 'report_generation_error',
        interviewId: context.interviewId,
        stage: context.stage,
        userId: context.userId,
      },
      'error'
    )
  },

  /**
   * Credit/billing error
   */
  billingError: async (context: {
    error: Error
    operation: 'charge' | 'refund' | 'balance_check' | string
    userId: string
    amount?: number
    interviewId?: string
  }) => {
    await captureServerError(
      context.error,
      {
        error_type: 'billing_error',
        operation: context.operation,
        userId: context.userId,
        amount: context.amount,
        interviewId: context.interviewId,
      },
      'error'
    )
  },

  /**
   * Cron job error
   */
  cronError: async (context: {
    jobName: string
    error: Error
  }) => {
    await captureServerError(
      context.error,
      {
        error_type: 'cron_error',
        job_name: context.jobName,
      },
      'error'
    )
  },

  /**
   * Generic server error
   */
  generic: async (
    message: string,
    context?: ServerErrorContext,
    severity: ErrorSeverity = 'error'
  ) => {
    await captureServerError(new Error(message), context, severity)
  },
}

/**
 * Track successful server events (for comparison with errors)
 */
export const serverEvents = {
  /**
   * Report generated successfully
   */
  reportGenerated: async (context: { 
    interviewId: string
    userId?: string
    durationMs?: number 
  }) => {
    const posthog = getPostHogClient()
    posthog.capture({
      distinctId: context.userId || 'server-backend',
      event: 'report_generated',
      properties: context,
    })
    await posthog.shutdown()
    posthogInstance = null
  },

  /**
   * Interview session processed
   */
  sessionProcessed: async (context: {
    interviewId: string
    roomName: string
    userId?: string
    transcriptSegments: number
    charged: boolean
    creditsDeducted?: number
  }) => {
    const posthog = getPostHogClient()
    posthog.capture({
      distinctId: context.userId || 'server-backend',
      event: 'session_processed',
      properties: context,
    })
    await posthog.shutdown()
    posthogInstance = null
  },

  /**
   * Email sent
   */
  emailSent: async (context: {
    type: 'report_ready' | 'deletion_warning' | string
    userId?: string
    to: string
  }) => {
    const posthog = getPostHogClient()
    posthog.capture({
      distinctId: context.userId || 'server-backend',
      event: 'email_sent',
      properties: {
        email_type: context.type,
        // Don't log full email address for privacy
        email_domain: context.to.split('@')[1],
      },
    })
    await posthog.shutdown()
    posthogInstance = null
  },
}
