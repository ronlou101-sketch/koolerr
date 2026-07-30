import { brandAmbassadorService } from '@/domains/brand-ambassador'
import { logger } from '@/shared/lib/logger'
import type { OrganizationId, TenantId } from '@/shared/types'

/**
 * Brand Ambassador Provisioning
 *
 * Every organization gets a persistent Brand Ambassador — a standalone,
 * first-class Digital Employee that represents the company itself (across
 * marketing, sales, support, onboarding, and future conversational experiences).
 *
 * It is intentionally NOT enrolled in the operational Workforce Engine: there is
 * no `workforces` row and no `digital_employees` row. Its entire record — a
 * minted stable id plus a provider-agnostic identity (persona, appearance, voice,
 * brand assets, provider references) — lives in the Business Brain as a
 * `visual_identity` memory. This keeps the Business Brain the source of truth and
 * avoids surfacing the Ambassador as a manageable operational workforce (no
 * workforce card, no count/reporting/readiness inflation).
 *
 * Provisioning is therefore a single additive Business-Brain write. Idempotent —
 * if an identity already exists, it is returned unchanged.
 *
 * See docs/adr/ADR-024-brand-ambassador.md.
 */
export async function provisionBrandAmbassador(
  organizationId: OrganizationId,
  tenantId: TenantId
): Promise<void> {
  const result = await brandAmbassadorService.assignDefaultBrandAmbassador({
    tenantId,
    organizationId,
  })
  if (!result.ok) {
    throw new Error(
      `[BRAND_AMBASSADOR] Failed to provision Brand Ambassador identity: ${result.error.message}`
    )
  }

  logger.info('[BRAND_AMBASSADOR] Provisioned Brand Ambassador', {
    organizationId,
    ambassadorId: result.value.ambassadorId,
    libraryId: result.value.libraryId,
  })
}
