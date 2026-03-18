import { PostHog } from 'posthog-node'

export default function PostHogClient() {
  const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_TOKEN!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    // Because server-side functions in Next.js can be short-lived,
    // we set flushAt to 1 and flushInterval to 0 to send events immediately
    flushAt: 1,
    flushInterval: 0,
  })
  return posthogClient
}
