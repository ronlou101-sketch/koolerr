'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { RUNS_SEEN_COOKIE } from '../_lib/run-notifications'

/**
 * Acknowledges run notifications and opens the runs list.
 *
 * Records "now" as the last-seen timestamp in a cookie (so finished runs stop counting
 * as unread) and redirects to /runs. This is the canonical mark-as-read affordance —
 * clicking the notification bell both clears the badge and navigates to the runs.
 */
export async function markRunsSeenAndOpen() {
  const cookieStore = await cookies()
  cookieStore.set(RUNS_SEEN_COOKIE, new Date().toISOString(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  redirect('/runs')
}
