import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  AutonomyLevel,
  DigitalEmployeeId,
  EngagementRunId,
  OrganizationId,
  TenantId,
  TrustRule,
  UserId,
} from '@/shared/types'
import type { ITrustRuleRepository } from './repository'
import type { EarnedAutonomy, EvaluationDecision, TrustEvaluation } from './types'

/**
 * Supabase Trust Rule Repository
 *
 * Persists TrustRules, TrustEvaluations, and EarnedAutonomy records to Supabase.
 *
 * TrustRules: upserts on (digital_employee_id, action).
 * TrustEvaluations: append-only INSERT — never updated or deleted.
 * EarnedAutonomy: upserts on (organization_id, digital_employee_id, action).
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.10 — Trust Engine.
 * See docs/adr/ADR-013-trust-engine-earned-autonomy.md.
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

  async saveEvaluation(evaluation: TrustEvaluation): Promise<void> {
    const { error } = await this.client.from('trust_evaluations').insert({
      id: evaluation.id,
      tenant_id: evaluation.tenantId,
      organization_id: evaluation.organizationId,
      digital_employee_id: evaluation.digitalEmployeeId,
      action: evaluation.action,
      engagement_run_id: evaluation.engagementRunId,
      decision: evaluation.decision,
      decided_by: evaluation.decidedBy,
      decided_at: evaluation.decidedAt.toISOString(),
      reason: evaluation.reason ?? null,
    })

    if (error) {
      throw new Error(`[TRUST_REPO] Failed to save evaluation: ${error.message}`)
    }
  }

  async getEarnedAutonomy(
    organizationId: OrganizationId,
    digitalEmployeeId: DigitalEmployeeId,
    action: string
  ): Promise<EarnedAutonomy | null> {
    const { data, error } = await this.client
      .from('earned_autonomy')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('digital_employee_id', digitalEmployeeId)
      .eq('action', action)
      .maybeSingle()

    if (error) {
      throw new Error(`[TRUST_REPO] Failed to get earned autonomy: ${error.message}`)
    }

    if (!data) return null

    return {
      id: data.id as string,
      tenantId: data.tenant_id as TenantId,
      organizationId: data.organization_id as OrganizationId,
      digitalEmployeeId: data.digital_employee_id as DigitalEmployeeId,
      action: data.action as string,
      consecutiveApprovals: data.consecutive_approvals as number,
      isEarned: data.is_earned as boolean,
      earnedAt: data.earned_at ? new Date(data.earned_at as string) : undefined,
      lastEvaluatedAt: new Date(data.last_evaluated_at as string),
    }
  }

  async saveEarnedAutonomy(earned: EarnedAutonomy): Promise<void> {
    const { error } = await this.client.from('earned_autonomy').upsert(
      {
        id: earned.id,
        tenant_id: earned.tenantId,
        organization_id: earned.organizationId,
        digital_employee_id: earned.digitalEmployeeId,
        action: earned.action,
        consecutive_approvals: earned.consecutiveApprovals,
        is_earned: earned.isEarned,
        earned_at: earned.earnedAt?.toISOString() ?? null,
        last_evaluated_at: earned.lastEvaluatedAt.toISOString(),
      },
      { onConflict: 'organization_id,digital_employee_id,action' }
    )

    if (error) {
      throw new Error(`[TRUST_REPO] Failed to save earned autonomy: ${error.message}`)
    }
  }
}
