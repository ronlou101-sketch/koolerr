import { err, ok } from '@/shared/types'
import { PlatformErrorCode } from '@/shared/types'
import type {
  Deliverable,
  DeliverableId,
  DeliverableStatus,
  DeliverableType,
  DigitalEmployeeId,
  EngagementRunId,
  OrganizationId,
  PlatformResult,
  TenantId,
} from '@/shared/types'
import { logger } from '@/shared/lib/logger'
import type {
  DeliverableApprovalDecision,
  DeliverableFilter,
  DeliverableRevisionRequest,
} from './types'

/**
 * Deliverables Domain Service Interface & Stub
 *
 * The Deliverables domain is the permanent record of every output the
 * platform produces. It owns Deliverable storage, versioning, attribution,
 * and the customer review/approval workflow.
 *
 * Key invariants:
 * - Deliverable creation is performed by the workforce-engine (via Digital
 *   Employees); the deliverables domain stores, versions, and tracks approval
 * - Every Deliverable is attributed to the Digital Employees that created it
 * - Approval decisions are recorded as events — not state mutations that
 *   replace previous decisions (the history is preserved)
 * - Deliverables are versioned: requesting a revision creates a new version,
 *   not in-place mutation
 *
 * The stub manages state in memory. The production implementation will
 * persist to Supabase with RLS enforcing tenant isolation.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.9, §3 — Deliverables.
 */

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface StoreDeliverableInput {
  tenantId: TenantId
  organizationId: OrganizationId
  engagementRunId: EngagementRunId
  type: DeliverableType
  title: string
  content: Record<string, unknown>
  attributedTo: DigitalEmployeeId[]
}

// ---------------------------------------------------------------------------
// Deliverables service interface
// ---------------------------------------------------------------------------

export interface IDeliverablesService {
  /** Called by the workforce-engine when a Digital Employee produces an output. */
  storeDeliverable(input: StoreDeliverableInput): Promise<PlatformResult<Deliverable>>
  getDeliverable(
    deliverableId: DeliverableId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<Deliverable>>
  listDeliverables(filter: DeliverableFilter): Promise<PlatformResult<Deliverable[]>>

  /**
   * Advance a draft Deliverable to 'pending_review'.
   * Called by the workforce-engine when work is complete and ready for customer approval.
   */
  submitForReview(
    deliverableId: DeliverableId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<Deliverable>>

  /**
   * Record an approval or rejection decision from a customer.
   * Does not delete or mutate previous state — the decision is additive.
   */
  recordApprovalDecision(
    decision: DeliverableApprovalDecision
  ): Promise<PlatformResult<Deliverable>>

  /**
   * Record a revision request from a customer.
   * The Deliverable status returns to 'draft' so the workforce-engine can
   * produce an updated version.
   */
  requestRevision(
    request: DeliverableRevisionRequest
  ): Promise<PlatformResult<DeliverableRevisionRequest>>
}

// ---------------------------------------------------------------------------
// In-memory stub implementation
// ---------------------------------------------------------------------------

class DeliverablesService implements IDeliverablesService {
  private readonly deliverables = new Map<DeliverableId, Deliverable>()
  private readonly approvalHistory = new Map<DeliverableId, DeliverableApprovalDecision[]>()
  private readonly revisionHistory = new Map<DeliverableId, DeliverableRevisionRequest[]>()
  /** organizationId → Set<DeliverableId> */
  private readonly orgIndex = new Map<OrganizationId, Set<DeliverableId>>()

  async storeDeliverable(input: StoreDeliverableInput): Promise<PlatformResult<Deliverable>> {
    const deliverable: Deliverable = {
      id: `deliverable_${crypto.randomUUID()}` as DeliverableId,
      organizationId: input.organizationId,
      engagementRunId: input.engagementRunId,
      type: input.type,
      title: input.title,
      content: input.content,
      status: 'draft',
      version: 1,
      attributedTo: input.attributedTo,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.deliverables.set(deliverable.id, deliverable)
    this.approvalHistory.set(deliverable.id, [])
    this.revisionHistory.set(deliverable.id, [])
    this.indexByOrg(input.organizationId, deliverable.id)

    logger.info('[DELIVERABLES] Deliverable stored', {
      tenantId: input.tenantId,
      organizationId: input.organizationId,
    })

    return ok(deliverable)
  }

  async getDeliverable(
    deliverableId: DeliverableId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<Deliverable>> {
    const deliverable = this.deliverables.get(deliverableId)
    if (!deliverable) {
      return err({ code: PlatformErrorCode.NOT_FOUND, message: 'Deliverable not found' })
    }
    if (deliverable.organizationId !== organizationId) {
      return err({
        code: PlatformErrorCode.TENANT_ISOLATION_VIOLATION,
        message: 'Deliverable does not belong to this organization',
      })
    }
    return ok(deliverable)
  }

  async listDeliverables(filter: DeliverableFilter): Promise<PlatformResult<Deliverable[]>> {
    const ids = this.orgIndex.get(filter.organizationId) ?? new Set()
    let results: Deliverable[] = []

    for (const id of ids) {
      const d = this.deliverables.get(id)
      if (!d) continue
      if (filter.status && d.status !== filter.status) continue
      if (filter.type && d.type !== filter.type) continue
      results.push(d)
    }

    const offset = filter.offset ?? 0
    const limit = filter.limit ?? results.length
    results = results.slice(offset, offset + limit)

    return ok(results)
  }

  async submitForReview(
    deliverableId: DeliverableId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<Deliverable>> {
    const result = await this.getDeliverable(deliverableId, organizationId)
    if (!result.ok) return result

    const deliverable = result.value
    if (deliverable.status !== 'draft') {
      return err({
        code: PlatformErrorCode.VALIDATION_ERROR,
        message: `Cannot submit for review: Deliverable status is '${deliverable.status}', expected 'draft'`,
      })
    }

    const updated = this.applyStatus(deliverable, 'pending_review')
    return ok(updated)
  }

  async recordApprovalDecision(
    decision: DeliverableApprovalDecision
  ): Promise<PlatformResult<Deliverable>> {
    const result = await this.getDeliverable(
      decision.deliverableId,
      this.getOrgForDeliverable(decision.deliverableId)
    )
    if (!result.ok) return result

    const deliverable = result.value
    if (deliverable.status !== 'pending_review') {
      return err({
        code: PlatformErrorCode.VALIDATION_ERROR,
        message: `Cannot record decision: Deliverable status is '${deliverable.status}', expected 'pending_review'`,
      })
    }

    const history = this.approvalHistory.get(decision.deliverableId) ?? []
    history.push(decision)
    this.approvalHistory.set(decision.deliverableId, history)

    const newStatus: DeliverableStatus = decision.decision === 'approved' ? 'approved' : 'rejected'
    const updated = this.applyStatus(deliverable, newStatus)
    logger.info(`[DELIVERABLES] Deliverable ${decision.decision}`, {
      organizationId: deliverable.organizationId,
    })

    return ok(updated)
  }

  async requestRevision(
    request: DeliverableRevisionRequest
  ): Promise<PlatformResult<DeliverableRevisionRequest>> {
    const orgId = this.getOrgForDeliverable(request.deliverableId)
    const result = await this.getDeliverable(request.deliverableId, orgId)
    if (!result.ok) return result

    const deliverable = result.value
    const history = this.revisionHistory.get(request.deliverableId) ?? []
    history.push(request)
    this.revisionHistory.set(request.deliverableId, history)

    // Return to draft so the workforce-engine can produce a new version.
    const updated: Deliverable = {
      ...deliverable,
      status: 'draft',
      version: deliverable.version + 1,
      updatedAt: new Date(),
    }
    this.deliverables.set(updated.id, updated)
    logger.info('[DELIVERABLES] Revision requested', { organizationId: deliverable.organizationId })

    return ok(request)
  }

  private applyStatus(deliverable: Deliverable, status: DeliverableStatus): Deliverable {
    const updated: Deliverable = { ...deliverable, status, updatedAt: new Date() }
    this.deliverables.set(updated.id, updated)
    return updated
  }

  /** Returns the organizationId for a deliverable, or throws if not found. */
  private getOrgForDeliverable(deliverableId: DeliverableId): OrganizationId {
    const d = this.deliverables.get(deliverableId)
    if (!d) throw new Error(`[DELIVERABLES] Deliverable not found: ${deliverableId}`)
    return d.organizationId
  }

  private indexByOrg(organizationId: OrganizationId, deliverableId: DeliverableId): void {
    const existing = this.orgIndex.get(organizationId) ?? new Set<DeliverableId>()
    existing.add(deliverableId)
    this.orgIndex.set(organizationId, existing)
  }
}

export const deliverablesService: IDeliverablesService = new DeliverablesService()
