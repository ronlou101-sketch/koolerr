import type { SupabaseClient } from '@supabase/supabase-js'
import type { AutonomyLevel, DigitalEmployeeId, OrganizationId, TrustRule } from '@/shared/types'
import type { ITrustRuleRepository } from './repository'

/**
 * Supabase Trust Rule Repository
 *
 * Persists TrustRules to the `trust_rules` table. Upserts on
 * (digital_employee_id, action) — re-registering the same rule updates
 * it in place without creating duplicates (matches the DB UNIQUE constraint).
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.10 — Trust Engine.
 */
export class SupabaseTrustRuleRepository implements ITrustRuleRepository {
  constructor(private readonly client: SupabaseClient) {}

  async saveRule(rule: TrustRule): Promise<void> {
    const { error } = await this.client.from('trust_rules').upsert(
      {
        id: rule.id,
        organization_id: rule.organizationId,
        digital_employee_id: rule.digitalEmployeeId,
        action: rule.action,
        requires_approval: rule.requiresApproval,
        autonomy_level: rule.autonomyLevel,
        required_consent_scope: rule.requiredConsentScope ?? null,
      },
      { onConflict: 'digital_employee_id,action' }
    )

    if (error) {
      throw new Error(
        `[TRUST_REPO] Failed to save rule for action "${rule.action}": ${error.message}`
      )
    }
  }

  async listAllRules(): Promise<TrustRule[]> {
    const { data, error } = await this.client.from('trust_rules').select('*')

    if (error) {
      throw new Error(`[TRUST_REPO] Failed to list rules: ${error.message}`)
    }

    return (data ?? []).map((row) => ({
      id: row.id as string,
      organizationId: row.organization_id as OrganizationId,
      digitalEmployeeId: row.digital_employee_id as DigitalEmployeeId,
      action: row.action as string,
      requiresApproval: row.requires_approval as boolean,
      autonomyLevel: row.autonomy_level as AutonomyLevel,
      requiredConsentScope: (row.required_consent_scope as string | null) ?? undefined,
    }))
  }
}
