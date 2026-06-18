/**
 * Platform Account Provisioning
 *
 * Creates the platform records for a newly registered user:
 *   1. Platform User (linked to Supabase Auth by email)
 *   2. Organization (the user's company workspace)
 *   3. Business Brain (permanent memory for the Organization)
 *   4. Owner membership (user becomes the organization owner)
 *
 * This function is idempotent — calling it more than once for the same
 * Supabase Auth user is safe. If the user already has platform records and
 * memberships, the function returns successfully without creating duplicates.
 *
 * Call sites:
 * - app/(auth)/signup/actions.ts — after email/password sign-up succeeds
 * - app/auth/callback/route.ts — after the Supabase Auth code exchange
 *   (handles the email-confirmation flow where provisioning is deferred)
 *
 * Infrastructure placement: imports from both @/shared and @/domains (identity,
 * business-brain), which is permitted only in infrastructure/.
 *
 * See docs/adr/ADR-005-authentication-pattern.md
 */

import type { TenantId } from '@/shared/types'
import { PlatformErrorCode } from '@/shared/types'
import { env } from '@/shared/config/env'
import { identityService } from '@/domains/identity'
import { businessBrainService } from '@/domains/business-brain'
import { billingService, PLAN_ENTITLEMENTS, PLAN_IDS } from '@/domains/billing'
import { provisionContentWorkforce } from '@/infrastructure/content-workforce'

export interface ProvisionResult {
  success: true
  alreadyProvisioned: boolean
}

export interface ProvisionError {
  success: false
  error: string
}

/**
 * Provision a full platform account for the authenticated Supabase Auth user.
 *
 * @param email - The Supabase Auth user's verified email address.
 * @param organizationName - Display name for the new Organization. Defaults to
 *   "My Organization" if blank.
 */
export async function provisionPlatformAccount(
  email: string,
  organizationName: string
): Promise<ProvisionResult | ProvisionError> {
  const tenantId = env.platform.tenantId() as TenantId
  const name = organizationName.trim() || 'My Organization'

  // ------------------------------------------------------------------
  // Step 1: Get or create platform User (idempotent)
  // ------------------------------------------------------------------
  let userId
  const existingUser = await identityService.getUserByEmail(email, tenantId)

  if (existingUser.ok) {
    userId = existingUser.value.id
  } else if (existingUser.error.code === PlatformErrorCode.NOT_FOUND) {
    const createResult = await identityService.createUser({ tenantId, email })
    if (!createResult.ok) return { success: false, error: createResult.error.message }
    userId = createResult.value.id
  } else {
    return { success: false, error: existingUser.error.message }
  }

  // ------------------------------------------------------------------
  // Step 2: Check if already fully provisioned (idempotency)
  // ------------------------------------------------------------------
  const membershipsResult = await identityService.getMemberships(userId)
  if (membershipsResult.ok && membershipsResult.value.length > 0) {
    return { success: true, alreadyProvisioned: true }
  }

  // ------------------------------------------------------------------
  // Step 3: Create Organization
  // ------------------------------------------------------------------
  const orgResult = await identityService.createOrganization({ tenantId, name })
  if (!orgResult.ok) return { success: false, error: orgResult.error.message }
  const organization = orgResult.value

  // ------------------------------------------------------------------
  // Step 4: Initialize Business Brain for the Organization
  // ------------------------------------------------------------------
  const brainResult = await businessBrainService.createBusinessBrain({
    tenantId,
    organizationId: organization.id,
  })
  if (!brainResult.ok) return { success: false, error: brainResult.error.message }

  // ------------------------------------------------------------------
  // Step 5: Add user as the Organization owner
  // ------------------------------------------------------------------
  const memberResult = await identityService.addUserToOrganization({
    userId,
    organizationId: organization.id,
    role: 'owner',
  })
  if (!memberResult.ok) return { success: false, error: memberResult.error.message }

  // ------------------------------------------------------------------
  // Step 6: Provision the Content Workforce (employees + trust rules
  //         + consent grants on behalf of the new owner)
  // ------------------------------------------------------------------
  await provisionContentWorkforce(organization.id, tenantId, userId)

  // ------------------------------------------------------------------
  // Step 7: Create subscription + set default entitlements (free tier)
  //         Every new Organization starts on the free plan.
  // ------------------------------------------------------------------
  const subResult = await billingService.createSubscription({
    tenantId,
    organizationId: organization.id,
    planId: PLAN_IDS.free,
  })
  if (!subResult.ok) {
    // Non-fatal: billing failure should not block account creation.
    // The platform continues — the subscription can be corrected later.
    const { logger } = await import('@/shared/lib/logger')
    logger.warn('[PROVISION] Failed to create subscription — account provisioned without billing', {
      organizationId: organization.id,
      error: subResult.error.message,
    })
  } else {
    // Set entitlement limits for the free plan.
    const freeLimits = PLAN_ENTITLEMENTS[PLAN_IDS.free]
    for (const [feature, limit] of Object.entries(freeLimits)) {
      await billingService.setEntitlement({
        organizationId: organization.id,
        feature,
        limit,
      })
    }
  }

  return { success: true, alreadyProvisioned: false }
}
