import type { DigitalEmployeeId, OrganizationId, TrustRule } from '@/shared/types'
import type { EarnedAutonomy, TrustEvaluation } from './types'
import type { ITrustRuleRepository } from './repository'

/**
 * In-memory Trust Rule Repository
 *
 * Used in tests and local development. No persistence — all state is lost
 * when the process exits. Swap for SupabaseTrustRuleRepository in production
 * via _configureTrustRepository() during bootstrap.
 */
export class InMemoryTrustRuleRepository implements ITrustRuleRepository {
  private readonly rules = new Map<string, TrustRule>()
  private readonly evaluations: TrustEvaluation[] = []
  private readonly earnedAutonomyMap = new Map<string, EarnedAutonomy>()

  private ruleKey(digitalEmployeeId: DigitalEmployeeId, action: string): string {
    return `${digitalEmployeeId}::${action}`
  }

  private autonomyKey(
    organizationId: OrganizationId,
    digitalEmployeeId: DigitalEmployeeId,
    action: string
  ): string {
    return `${organizationId}::${digitalEmployeeId}::${action}`
  }

  async saveRule(rule: TrustRule): Promise<void> {
    this.rules.set(this.ruleKey(rule.digitalEmployeeId, rule.action), rule)
  }

  async listAllRules(): Promise<TrustRule[]> {
    return Array.from(this.rules.values())
  }

  async saveEvaluation(evaluation: TrustEvaluation): Promise<void> {
    this.evaluations.push(evaluation)
  }

  async getEarnedAutonomy(
    organizationId: OrganizationId,
    digitalEmployeeId: DigitalEmployeeId,
    action: string
  ): Promise<EarnedAutonomy | null> {
    return (
      this.earnedAutonomyMap.get(this.autonomyKey(organizationId, digitalEmployeeId, action)) ??
      null
    )
  }

  async saveEarnedAutonomy(earned: EarnedAutonomy): Promise<void> {
    this.earnedAutonomyMap.set(
      this.autonomyKey(earned.organizationId, earned.digitalEmployeeId, earned.action),
      earned
    )
  }
}
