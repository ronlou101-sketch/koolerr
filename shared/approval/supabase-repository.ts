import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ApprovalRequestId,
  DigitalEmployeeId,
  EngagementRunId,
  OrganizationId,
  TenantId,
  UserId,
  WorkforceId,
} from '@/shared/types'
import type { IApprovalRepository } from './repository'
import type { ApprovalRequest, ApprovalRequestStatus } from './types'

/**
 * Supabase Approval Repository
 *
 * Persists ApprovalRequests to the `approval_requests` table.
 * Upserts on id — resolving or cancelling a request is an update to the
 * same row (status, resolved_at, resolved_by, resolution_note change).
 *
 * See docs/adr/ADR-014-approval-workflows.md.
 */
export class SupabaseApprovalRepository implements IApprovalRepository {
  constructor(private readonly client: SupabaseClient) {}

  async saveRequest(request: ApprovalRequest): Promise<void> {
    const { error } = await this.client.from('approval_requests').upsert({
      id: request.id,
      tenant_id: request.tenantId,
      organization_id: request.organizationId,
      workforce_id: request.workforceId,
      digital_employee_id: request.digitalEmployeeId,
      engagement_run_id: request.engagementRunId,
      action: request.action,
      description: request.description,
      context: request.context,
      status: request.status,
      created_at: request.createdAt.toISOString(),
      expires_at: request.expiresAt?.toISOString() ?? null,
      resolved_at: request.resolvedAt?.toISOString() ?? null,
      resolved_by: request.resolvedBy ?? null,
      resolution_note: request.resolutionNote ?? null,
    })

    if (error) {
      throw new Error(`[APPROVAL_REPO] Failed to save approval request: ${error.message}`)
    }
  }

  async findById(id: ApprovalRequestId): Promise<ApprovalRequest | null> {
    const { data, error } = await this.client
      .from('approval_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      throw new Error(`[APPROVAL_REPO] Failed to find approval request: ${error.message}`)
    }

    if (!data) return null
    return this.mapRow(data)
  }

  async listPending(
    organizationId: OrganizationId,
    _tenantId: TenantId
  ): Promise<ApprovalRequest[]> {
    const { data, error } = await this.client
      .from('approval_requests')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`[APPROVAL_REPO] Failed to list pending requests: ${error.message}`)
    }

    return (data ?? []).map((row) => this.mapRow(row))
  }

  private mapRow(row: Record<string, unknown>): ApprovalRequest {
    return {
      id: row.id as ApprovalRequestId,
      tenantId: row.tenant_id as TenantId,
      organizationId: row.organization_id as OrganizationId,
      workforceId: row.workforce_id as WorkforceId,
      digitalEmployeeId: row.digital_employee_id as DigitalEmployeeId,
      engagementRunId: row.engagement_run_id as EngagementRunId,
      action: row.action as string,
      description: row.description as string,
      context: (row.context ?? {}) as Record<string, unknown>,
      status: row.status as ApprovalRequestStatus,
      createdAt: new Date(row.created_at as string),
      expiresAt: row.expires_at ? new Date(row.expires_at as string) : undefined,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at as string) : undefined,
      resolvedBy: (row.resolved_by as UserId | null) ?? undefined,
      resolutionNote: (row.resolution_note as string | null) ?? undefined,
    }
  }
}
