import { auditLogger } from '@/shared/audit'
import { logger } from '@/shared/lib/logger'
import { trustEngine } from '@/shared/trust'
import { err, ok, PlatformErrorCode } from '@/shared/types'
import type { ApprovalRequestId, OrganizationId, PlatformResult } from '@/shared/types'
import { InMemoryApprovalRepository } from './in-memory-repository'
import type { IApprovalRepository } from './repository'
import type {
  ApprovalRequest,
  CreateApprovalRequestInput,
  IApprovalWorkflowService,
  ResolveApprovalInput,
} from './types'

/**
 * Approval Workflow Service
 *
 * Manages the lifecycle of ApprovalRequests — formal records of Digital Employee
 * actions pending customer review. When a customer resolves a request, the decision
 * is forwarded to TrustEngine.recordEvaluation() so consecutive approvals accumulate
 * toward earned autonomy (see ADR-013, ADR-014).
 *
 * Every resolution is audited, ensuring a permanent, queryable record of customer
 * decisions and Trust Engine state changes.
 *
 * See FOUNDATION_003_DEVELOPMENT_ROADMAP.md §Phase 2 — Approval Workflows.
 * See docs/adr/ADR-014-approval-workflows.md.
 */
export class ApprovalWorkflowService implements IApprovalWorkflowService {
  constructor(private readonly repo: IApprovalRepository) {}

  async createRequest(input: CreateApprovalRequestInput): Promise<PlatformResult<ApprovalRequest>> {
    try {
      const request: ApprovalRequest = {
        id: `approval_${crypto.randomUUID()}` as ApprovalRequestId,
        tenantId: input.tenantId,
        organizationId: input.organizationId,
        workforceId: input.workforceId,
        digitalEmployeeId: input.digitalEmployeeId,
        engagementRunId: input.engagementRunId,
        action: input.action,
        description: input.description,
        context: input.context,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: input.expiresAt,
      }

      await this.repo.saveRequest(request)

      await auditLogger.log({
        tenantId: input.tenantId,
        organizationId: input.organizationId,
        actor: { type: 'digital_employee', id: input.digitalEmployeeId },
        action: 'engagement_run.approval_requested',
        resourceType: 'engagement_run',
        resourceId: input.engagementRunId,
        outcome: 'success',
        metadata: {
          approvalRequestId: request.id,
          requestedAction: input.action,
        },
      })

      logger.info('[APPROVAL] Request created', {
        id: request.id,
        action: input.action,
        organizationId: input.organizationId,
      })

      return ok(request)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async getRequest(
    id: ApprovalRequestId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<ApprovalRequest>> {
    try {
      const request = await this.repo.findById(id)
      if (!request) {
        return err({ code: PlatformErrorCode.NOT_FOUND, message: 'Approval request not found' })
      }
      if (request.organizationId !== organizationId) {
        return err({
          code: PlatformErrorCode.TENANT_ISOLATION_VIOLATION,
          message: 'Approval request does not belong to this organization',
        })
      }
      return ok(request)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async listPending(
    organizationId: OrganizationId,
    tenantId: import('@/shared/types').TenantId
  ): Promise<PlatformResult<ApprovalRequest[]>> {
    try {
      const requests = await this.repo.listPending(organizationId, tenantId)
      return ok(requests)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async resolveRequest(input: ResolveApprovalInput): Promise<PlatformResult<ApprovalRequest>> {
    try {
      const fetchResult = await this.getRequest(input.id, input.organizationId)
      if (!fetchResult.ok) return fetchResult

      const request = fetchResult.value

      if (request.status !== 'pending') {
        return err({
          code: PlatformErrorCode.VALIDATION_ERROR,
          message: `Cannot resolve request: status is '${request.status}', expected 'pending'`,
        })
      }

      const resolved: ApprovalRequest = {
        ...request,
        status: input.decision,
        resolvedAt: new Date(),
        resolvedBy: input.resolvedBy,
        resolutionNote: input.resolutionNote,
      }

      await this.repo.saveRequest(resolved)

      // Forward the decision to the Trust Engine so earned-autonomy counters stay current.
      await trustEngine.recordEvaluation({
        tenantId: request.tenantId,
        organizationId: request.organizationId,
        digitalEmployeeId: request.digitalEmployeeId,
        action: request.action,
        engagementRunId: request.engagementRunId,
        decision: input.decision,
        decidedBy: input.resolvedBy,
        decidedAt: resolved.resolvedAt!,
        reason: input.resolutionNote,
      })

      await auditLogger.log({
        tenantId: request.tenantId,
        organizationId: request.organizationId,
        actor: { type: 'user', id: input.resolvedBy },
        action:
          input.decision === 'approved' ? 'engagement_run.approved' : 'engagement_run.rejected',
        resourceType: 'engagement_run',
        resourceId: request.engagementRunId,
        outcome: 'success',
        metadata: {
          approvalRequestId: request.id,
          requestedAction: request.action,
          decision: input.decision,
        },
      })

      logger.info('[APPROVAL] Request resolved', {
        id: request.id,
        decision: input.decision,
        organizationId: request.organizationId,
      })

      return ok(resolved)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async cancelRequest(
    id: ApprovalRequestId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<ApprovalRequest>> {
    try {
      const fetchResult = await this.getRequest(id, organizationId)
      if (!fetchResult.ok) return fetchResult

      const request = fetchResult.value

      if (request.status !== 'pending') {
        return err({
          code: PlatformErrorCode.VALIDATION_ERROR,
          message: `Cannot cancel request: status is '${request.status}', expected 'pending'`,
        })
      }

      const cancelled: ApprovalRequest = {
        ...request,
        status: 'cancelled',
        resolvedAt: new Date(),
      }

      await this.repo.saveRequest(cancelled)

      logger.info('[APPROVAL] Request cancelled', {
        id: request.id,
        organizationId: request.organizationId,
      })

      return ok(cancelled)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton — defaults to in-memory; bootstrap swaps in Supabase repo
// ---------------------------------------------------------------------------

export let approvalWorkflowService: IApprovalWorkflowService = new ApprovalWorkflowService(
  new InMemoryApprovalRepository()
)

export function _configureApprovalRepository(repo: IApprovalRepository): void {
  approvalWorkflowService = new ApprovalWorkflowService(repo)
}
