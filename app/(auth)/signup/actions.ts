'use server'

import { createSessionServerClient } from '@/shared/lib/supabase-session'
import { provisionPlatformAccount } from '@/infrastructure/auth'

/**
 * Server Action: create the platform account records for a newly registered user.
 *
 * Called from the signup page after supabase.auth.signUp() succeeds and a
 * session is immediately available (email confirmation disabled). For the
 * email-confirmation flow, provisioning is handled in app/auth/callback/route.ts.
 *
 * @param organizationName - The name the user entered for their workspace.
 */
export async function provision(
  organizationName: string
): Promise<{ success: true; alreadyProvisioned: boolean } | { success: false; error: string }> {
  const supabase = await createSessionServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser?.email) {
    return { success: false, error: 'No authenticated session. Please sign in again.' }
  }

  return provisionPlatformAccount(authUser.email, organizationName)
}
