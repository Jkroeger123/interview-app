'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import posthog from 'posthog-js'

/**
 * Syncs Clerk authenticated user with PostHog identity.
 * Must be placed inside ClerkProvider.
 */
export function PostHogIdentify() {
  const { user, isLoaded, isSignedIn } = useUser()

  useEffect(() => {
    if (!isLoaded) return

    if (isSignedIn && user) {
      // Identify the user in PostHog with their Clerk ID and email
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
      })
    } else {
      // User logged out - reset PostHog identity
      posthog.reset()
    }
  }, [isLoaded, isSignedIn, user])

  return null
}
