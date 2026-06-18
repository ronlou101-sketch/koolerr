import { auditLogger } from '@/shared/audit'
import { consentLedger } from '@/shared/consent'
import { logger } from '@/shared/lib/logger'
import type { DigitalEmployeeId, TrustRule } from '@/shared/types'
import type { ITrustRuleRepository } from './repository'
import type {
  EarnedAutonomy,
  ITrustEngine,
  PermissionCheck,
  PermissionResult,
  RecordEvaluationInput,
  TrustEvaluation,
} from './types'

/**
 * Trust Engine
 *
 * Evaluates PermissionChecks against registered TrustRules.
 * If no matching rule is found, the default is 'requires_approval' —
 * never 'permitted'. This enforces the principle from
 * FOUNDATION_004_PRODUCT_PRINCIPLES.md §4: trust before automation.
 *
 * Consent integration: if a TrustRule specifies `requiredConsentScope`,
 * the engine checks the Consent Ledger for an active consent record on
 * the requested action before evaluating the approval rule. Absence of
 * consent blocks the action with 'requires_approval', regardless of
 * whether the rule itself would permit it.
 *
 * Earned Autonomy: once a Digital Employee has accumulated
 * EARNED_AUTONOMY_THRESHOLD consecutive customer approvals for the same
 * action, the engine permits that action without requiring fresh per-action
 * approval. Any rejection resets the counter to zero — trust must be
 * re-earned from the beginning. See ADR-013.
 *
 * The engine always audits its decision. Whether the action is permitted,
 * denied, or requires approval, the Trust Engine's reasoning is on record.
 *
 * Rules are stored in an in-memory Map for O(1) lookups at check time.
 * An optional ITrustRuleRepository provides durable storage so rules
 * survive server restarts — bootstrap calls _loadRulesFromRepository()
 * after wiring the Supabase repository via _configureTrustRepository().
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.10 — Trust Engine.
 * See docs/adr/ADR-002-trust-engine-consent-integration.md.
 * See docs/adr/ADR-013-trust-engine-earned-autonomy.md.
 */

/**
 * Number of consecutive customer approvals required before a Digital Employee
 * earns autonomous permission for that action. Any rejection resets to zero.
 */
export const EARNED_AUTONOMY_THRESHOLD = 5

export class TrustEngine implements ITrustEngine {
  /** Rules indexed by DigitalEmployeeId for O(1) lookup. */
  private readonly rules = new Map<DigitalEmployeeId, TrustRule[]>()
  private repo: ITrustRuleRepository | null = null

  /**
   * Wire in the Supabase repository. Called once during bootstrap.
   * Must be called before loadRulesFromRepository().
   */
  _configureRepository(repo: ITrustRuleRepository): void {
    this.repo = repo
  }

  /**
   * Load all persisted rules from the repository into memory.
   * Idempotent — skips any rule whose (digitalEmployeeId, action) pair
   * is already in memory so repeated calls are safe.
   * Called during bootstrap after _configureRepository().
   */
  async _loadRulesFromRepository(): Promise<void> {
    if (!this.repo) return

    let allRules: TrustRule[]
    try {
      allRules = await this.repo.listAllRules()
    } catch (err) {
      logger.warn('[TRUST_ENGINE] Failed to load rules from repository — using in-memory only', {
        error: String(err),
      })
      return
    }

    let loaded = 0
    for (const rule of allRules) {
      const existing = this.rules.get(rule.digitalEmployeeId) ?? []
      if (!existing.some((r) => r.action === rule.action)) {
        this.rules.set(rule.digitalEmployeeId, [...existing, rule])
        loaded++
      }
    }

    logger.info(`[TRUST_ENGINE] Loaded ${loaded} rules from repository (${allRules.length} total)`)
  }

  registerRule(rule: TrustRule): void {
    const existing = this.rules.get(rule.digitalEmployeeId) ?? []
    // Deduplicate in memory — same (digitalEmployeeId, action) pair updates the rule.
    const updated = existing.filter((r) => r.action !== rule.action)
    this.rules.set(rule.digitalEmployeeId, [...updated, rule])

    // Persist asynchronously — fire-and-forget so registerRule stays synchronous.
    if (this.repo) {
      this.repo.saveRule(rule).catch((err) =>
        logger.warn('[TRUST_ENGINE] Failed to persist rule', {
          action: rule.action,
          error: String(err),
        })
      )
    }
  }

  rulesFor(digitalEmployeeId: DigitalEmployeeId): TrustRule[] {
    return this.rules.get(digitalEmployeeId) ?? []
  }

  async check(permission: PermissionCheck): Promise<PermissionResult> {
    const employeeRules = this.rules.get(permission.digitalEmployeeId) ?? []
    const matchingRule = employeeRules.find((r) => r.action === permission.action)

    let result: PermissionResult

    if (!matchingRule) {
      // No rule registered for this action — default to requires_approval.
      // Unlisted actions are never silently permitted.
      result = {
        outcome: 'requires_approval',
        autonomyLevel: 'supervised',
        reason: `No trust rule registered for action "${permission.action}". Defaulting to supervised approval.`,
      }
    } else {
      // Consent is a prerequisite — verify it before evaluating any approval logic.
      const consentRequired = matchingRule.requiredConsentScope !== undefined
      const consentActive = consentRequired
        ? !!(await consentLedger.check(permission.organizationId, permission.action))
        : true

      if (consentRequired && !consentActive) {
        result = {
          outcome: 'requires_approval',
          autonomyLevel: matchingRule.autonomyLevel,
          reason: `Action "${permission.action}" requires active consent for scope "${matchingRule.requiredConsentScope}". No active consent found — the customer must grant consent before this action proceeds.`,
          appliedRule: matchingRule,
        }
      } else if (matchingRule.requiresApproval) {
        // Check whether this employee has earned autonomous permission for this action.
        const earned = this.repo
          ? await this.repo
              .getEarnedAutonomy(
                permission.organizationId,
                permission.digitalEmployeeId,
                permission.action
              )
              .catch(() => null)
          : null

        if (earned?.isEarned) {
          result = {
            outcome: 'permitted',
            autonomyLevel: 'autonomous',
            reason: `Action "${permission.action}" permitted via earned autonomy (${EARNED_AUTONOMY_THRESHOLD} consecutive approvals).`,
            appliedRule: matchingRule,
          }
        } else {
          result = {
            outcome: 'requires_approval',
            autonomyLevel: matchingRule.autonomyLevel,
            reason: 'Action requires explicit customer approval per registered trust rule.',
            appliedRule: matchingRule,
          }
        }
      } else {
        result = {
          outcome: 'permitted',
          autonomyLevel: matchingRule.autonomyLevel,
          appliedRule: matchingRule,
        }
      }
    }

    await auditLogger.log({
      tenantId: permission.tenantId,
      organizationId: permission.organizationId,
      actor: { type: 'digital_employee', id: permission.digitalEmployeeId },
      action:
        result.outcome === 'denied'
          ? 'trust_engine.action_denied'
          : 'trust_engine.action_permitted',
      resourceType: 'engagement_run',
      resourceId: permission.engagementRunId,
      outcome: result.outcome === 'denied' ? 'denied' : 'success',
      metadata: {
        checkedAction: permission.action,
        permissionOutcome: result.outcome,
        autonomyLevel: result.autonomyLevel,
        reason: result.reason,
        workforceId: permission.workforceId,
      },
    })

    return result
  }

  async recordEvaluation(input: RecordEvaluationInput): Promise<void> {
    if (!this.repo) {
      logger.warn(
        '[TRUST_ENGINE] recordEvaluation called without repository — evaluation not persisted'
      )
      return
    }

    const evaluation: TrustEvaluation = {
      id: `evaluation_${crypto.randomUUID()}`,
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      digitalEmployeeId: input.digitalEmployeeId,
      action: input.action,
      engagementRunId: input.engagementRunId,
      decision: input.decision,
      decidedBy: input.decidedBy,
      decidedAt: input.decidedAt,
      reason: input.reason,
    }
    await this.repo.saveEvaluation(evaluation)

    // Update earned autonomy for this (org, employee, action) tuple.
    const existing = await this.repo.getEarnedAutonomy(
      input.organizationId,
      input.digitalEmployeeId,
      input.action
    )

    const consecutiveApprovals =
      input.decision === 'approved' ? (existing?.consecutiveApprovals ?? 0) + 1 : 0

    const isEarned = consecutiveApprovals >= EARNED_AUTONOMY_THRESHOLD

    // Preserve earnedAt from the first time threshold was crossed; clear on reset.
    const earnedAt = isEarned ? (existing?.earnedAt ?? new Date()) : undefined

    const updated: EarnedAutonomy = {
      id: existing?.id ?? `earned_${crypto.randomUUID()}`,
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      digitalEmployeeId: input.digitalEmployeeId,
      action: input.action,
      consecutiveApprovals,
      isEarned,
      earnedAt,
      lastEvaluatedAt: new Date(),
    }
    await this.repo.saveEarnedAutonomy(updated)

    await auditLogger.log({
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      actor: { type: 'user', id: input.decidedBy },
      action:
        input.decision === 'approved'
          ? 'trust_engine.evaluation_approved'
          : 'trust_engine.evaluation_rejected',
      resourceType: 'engagement_run',
      resourceId: input.engagementRunId,
      outcome: 'success',
      metadata: {
        digitalEmployeeId: input.digitalEmployeeId,
        checkedAction: input.action,
        consecutiveApprovals,
        isEarned,
      },
    })
  }
}

const _engine = new TrustEngine()

export const trustEngine: ITrustEngine = _engine

/** Wire the Supabase repository. Must be called before _loadTrustRulesFromRepository(). */
export function _configureTrustRepository(repo: ITrustRuleRepository): void {
  _engine._configureRepository(repo)
}

/** Load all persisted rules into memory. Call after _configureTrustRepository(). */
export async function _loadTrustRulesFromRepository(): Promise<void> {
  return _engine._loadRulesFromRepository()
}
