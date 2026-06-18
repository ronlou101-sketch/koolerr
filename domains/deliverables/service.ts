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
import type { IDeliverablesRepository } from './repository'
import { InMemoryDeliverablesRepository } from './in-memory-repository'

/**
 * Deliverables Domain Service Interface & Stub
 *
 * The Deliverables domain is the permanent record of every output the
 * platform produces. It owns Deliverable storage, versioning, attribution,
 * and the customer review/approval workflow.
 *
 * Key invariants:
 * - Approval decisions are recorded as events — not state mutations
 * - Deliverables are versioned: a revision request bumps the version counter
 * - Every Deliverable is attributed to the Digital Employees that created it
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
    organizationId: OrganizationId,
    tenantId: TenantId
  ): Promise<PlatformResult<Deliverable>>

  /**
   * Record an approval or rejection decision from a customer.
   * Does not delete or mutate previous state — the decision is additive.
   */
  recordApprovalDecision(
    decision: DeliverableApprovalDecision,
    tenantId: TenantId
  ): Promise<PlatformResult<Deliverable>>

  /**
   * Record a revision request from a customer.
   * The Deliverable status returns to 'draft' so the workforce-engine can
   * produce an updated version.
   */
  requestRevision(
    request: DeliverableRevisionRequest,
    tenantId: TenantId
  ): Promise<PlatformResult<DeliverableRevisionRequest>>
}

// ---------------------------------------------------------------------------
// Service implementation
// ---------------------------------------------------------------------------

export class DeliverablesService implements IDeliverablesService {
  constructor(private readonly repo: IDeliverablesRepository) {}

  async storeDeliverable(input: StoreDeliverableInput): Promise<PlatformResult<Deliverable>> {
    try {
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

      await this.repo.saveDeliverable(deliverable, input.tenantId)
      logger.info('[DELIVERABLES] Deliverable stored', {
        tenantId: input.tenantId,
        organizationId: input.organizationId,
      })
      return ok(deliverable)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async getDeliverable(
    deliverableId: DeliverableId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<Deliverable>> {
    try {
      const deliverable = await this.repo.findDeliverableById(deliverableId)
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
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async listDeliverables(filter: DeliverableFilter): Promise<PlatformResult<Deliverable[]>> {
    try {
      const deliverables = await this.repo.listDeliverables({
        organizationId: filter.organizationId,
        status: filter.status,
        type: filter.type,
        limit: filter.limit,
        offset: filter.offset,
      })
      return ok(deliverables)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async submitForReview(
    deliverableId: DeliverableId,
    organizationId: OrganizationId,
    tenantId: TenantId
  ): Promise<PlatformResult<Deliverable>> {
    try {
      const result = await this.getDeliverable(deliverableId, organizationId)
      if (!result.ok) return result

      const deliverable = result.value
      if (deliverable.status !== 'draft') {
        return err({
          code: PlatformErrorCode.VALIDATION_ERROR,
          message: `Cannot submit for review: Deliverable status is '${deliverable.status}', expected 'draft'`,
        })
      }

      const updated: Deliverable = {
        ...deliverable,
        status: 'pending_review',
        updatedAt: new Date(),
      }
      await this.repo.saveDeliverable(updated, tenantId)
      return ok(updated)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async recordApprovalDecision(
    decision: DeliverableApprovalDecision,
    tenantId: TenantId
  ): Promise<PlatformResult<Deliverable>> {
    try {
      const deliverable = await this.repo.findDeliverableById(decision.deliverableId)
      if (!deliverable) {
        return err({ code: PlatformErrorCode.NOT_FOUND, message: 'Deliverable not found' })
      }
      if (deliverable.status !== 'pending_review') {
        return err({
          code: PlatformErrorCode.VALIDATION_ERROR,
          message: `Cannot record decision: Deliverable status is '${deliverable.status}', expected 'pending_review'`,
        })
      }

      await this.repo.saveApprovalDecision(decision, deliverable.organizationId)

      const newStatus: DeliverableStatus =
        decision.decision === 'approved' ? 'approved' : 'rejected'
      const updated: Deliverable = { ...deliverable, status: newStatus, updatedAt: new Date() }
      await this.repo.saveDeliverable(updated, tenantId)

      logger.info(`[DELIVERABLES] Deliverable ${decision.decision}`, {
        organizationId: deliverable.organizationId,
      })
      return ok(updated)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async requestRevision(
    request: DeliverableRevisionRequest,
    tenantId: TenantId
  ): Promise<PlatformResult<DeliverableRevisionRequest>> {
    try {
      const deliverable = await this.repo.findDeliverableById(request.deliverableId)
      if (!deliverable) {
        return err({ code: PlatformErrorCode.NOT_FOUND, message: 'Deliverable not found' })
      }

      await this.repo.saveRevisionRequest(request, deliverable.organizationId)

      const updated: Deliverable = {
        ...deliverable,
        status: 'draft',
        version: deliverable.version + 1,
        updatedAt: new Date(),
      }
      await this.repo.saveDeliverable(updated, tenantId)

      logger.info('[DELIVERABLES] Revision requested', {
        organizationId: deliverable.organizationId,
      })
      return ok(request)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton — defaults to in-memory; bootstrap swaps in Supabase repo
// ---------------------------------------------------------------------------

export let deliverablesService: IDeliverablesService = new DeliverablesService(
  new InMemoryDeliverablesRepository()
)

export function _configureDeliverablesRepository(repo: IDeliverablesRepository): void {
  deliverablesService = new DeliverablesService(repo)
}
