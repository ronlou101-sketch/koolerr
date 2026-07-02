'use server'

import { createSessionServerClient } from '@/shared/lib/supabase-session'
import { provisionPlatformAccount } from '@/infrastructure/auth'
import { logger } from '@/shared/lib/logger'

/**
 * Server Action: create the platform account records for a newly registered user.
 *
 * Called from the signup page after supabase.auth.signUp() succeeds and a
 * session is immediately available (email confirmation disabled). For the
 * email-confirmation flow, provisioning is handled in app/auth/callback/route.ts.
 * Also called from the login page (idempotent) to recover from any case where
 * email-confirmation provisioning failed.
 *
 * @param organizationName - The name the user entered for their workspace.
 */
export async function provision(
  organizationName: string
): Promise<{ success: true; alreadyProvisioned: boolean } | { success: false; error: string }> {
  try {
    const supabase = await createSessionServerClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser?.email) {
      return { success: false, error: 'No authenticated session. Please sign in again.' }
    }

    return await provisionPlatformAccount(authUser.email, organizationName, authUser.id)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error('provision: uncaught exception', { message: msg })
    return { success: false, error: msg }
  }
}
