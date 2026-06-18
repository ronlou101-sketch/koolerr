'use server'

import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { consentLedger } from '@/shared/consent'
import type { ConsentId } from '@/shared/types'

/**
 * Revoke a previously granted consent record.
 * Called by the revoke form on the /consent page.
 *
 * Updates the record status to 'revoked' in the Consent & Rights Ledger
 * (the original record is preserved — append-only invariant) and emits
 * a consent.revoked audit event.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.11 — Consent & Rights Ledger.
 */
export async function revokeConsentFormAction(formData: FormData) {
  const ctx = await getRequestPlatformContext()
  if (!ctx || ctx.actor.type !== 'user') return

  const consentId = formData.get('consentId') as string
  if (!consentId) return

  await consentLedger.revoke({
    tenantId: ctx.tenantId,
    consentId: consentId as ConsentId,
    organizationId: ctx.organizationId,
    revokedBy: ctx.actor.userId,
  })

  redirect('/consent?revoked=true')
}
