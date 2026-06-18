import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Deliverable,
  DeliverableId,
  DeliverableStatus,
  DeliverableType,
  DigitalEmployeeId,
  EngagementRunId,
  OrganizationId,
  TenantId,
  UserId,
} from '@/shared/types'
import type { DeliverableApprovalDecision, DeliverableRevisionRequest } from './types'
import type { DeliverableQueryFilter, IDeliverablesRepository } from './repository'

// ---------------------------------------------------------------------------
// Database row types — mirror the schema in migration 005
// ---------------------------------------------------------------------------

interface DeliverableRow {
  id: string
  organization_id: string
  engagement_run_id: string
  tenant_id: string
  type: string
  title: string
  content: Record<string, unknown>
  status: string
  version: number
  attributed_to: string[]
  created_at: string
  updated_at: string
}

interface ApprovalDecisionRow {
  id: string
  deliverable_id: string
  organization_id: string
  reviewed_by: string
  decision: string
  feedback: string | null
  decided_at: string
}

interface RevisionRequestRow {
  id: string
  deliverable_id: string
  organization_id: string
  requested_by: string
  instructions: string
  requested_at: string
}

// ---------------------------------------------------------------------------
// Row ↔ entity mappers
// ---------------------------------------------------------------------------

function mapDeliverable(row: DeliverableRow): Deliverable {
  return {
    id: row.id as DeliverableId,
    organizationId: row.organization_id as OrganizationId,
    engagementRunId: row.engagement_run_id as EngagementRunId,
    type: row.type as DeliverableType,
    title: row.title,
    content: row.content,
    status: row.status as DeliverableStatus,
    version: row.version,
    attributedTo: row.attributed_to as DigitalEmployeeId[],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function deliverableToRow(d: Deliverable, tenantId: TenantId): DeliverableRow {
  return {
    id: d.id,
    organization_id: d.organizationId,
    engagement_run_id: d.engagementRunId,
    tenant_id: tenantId,
    type: d.type,
    title: d.title,
    content: d.content,
    status: d.status,
    version: d.version,
    attributed_to: d.attributedTo,
    created_at: d.createdAt.toISOString(),
    updated_at: d.updatedAt.toISOString(),
  }
}

function approvalDecisionToRow(
  decision: DeliverableApprovalDecision,
  organizationId: OrganizationId
): ApprovalDecisionRow {
  return {
    id: `apprdecision_${crypto.randomUUID()}`,
    deliverable_id: decision.deliverableId,
    organization_id: organizationId,
    reviewed_by: decision.reviewedBy,
    decision: decision.decision,
    feedback: decision.feedback ?? null,
    decided_at: decision.decidedAt.toISOString(),
  }
}

function revisionRequestToRow(
  request: DeliverableRevisionRequest,
  organizationId: OrganizationId
): RevisionRequestRow {
  return {
    id: `revrequest_${crypto.randomUUID()}`,
    deliverable_id: request.deliverableId,
    organization_id: organizationId,
    requested_by: request.requestedBy,
    instructions: request.instructions,
    requested_at: request.requestedAt.toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Repository implementation
// ---------------------------------------------------------------------------

export class SupabaseDeliverablesRepository implements IDeliverablesRepository {
  constructor(private readonly client: SupabaseClient) {}

  async saveDeliverable(deliverable: Deliverable, tenantId: TenantId): Promise<Deliverable> {
    const { data, error } = await this.client
      .from('deliverables')
      .upsert(deliverableToRow(deliverable, tenantId), { onConflict: 'id' })
      .select()
      .single()
    if (error || !data) throw new Error(`[DLVR_REPO] saveDeliverable failed: ${error?.message}`)
    return mapDeliverable(data as DeliverableRow)
  }

  async findDeliverableById(id: DeliverableId): Promise<Deliverable | null> {
    const { data, error } = await this.client
      .from('deliverables')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`[DLVR_REPO] findDeliverableById failed: ${error.message}`)
    return data ? mapDeliverable(data as DeliverableRow) : null
  }

  async listDeliverables(filter: DeliverableQueryFilter): Promise<Deliverable[]> {
    let query = this.client
      .from('deliverables')
      .select('*')
      .eq('organization_id', filter.organizationId)

    if (filter.status) query = query.eq('status', filter.status)
    if (filter.type) query = query.eq('type', filter.type)
    if (filter.limit) query = query.limit(filter.limit)
    if (filter.offset) query = query.range(filter.offset, filter.offset + (filter.limit ?? 50) - 1)

    const { data, error } = await query
    if (error) throw new Error(`[DLVR_REPO] listDeliverables failed: ${error.message}`)
    return (data ?? []).map((r) => mapDeliverable(r as DeliverableRow))
  }

  async saveApprovalDecision(
    decision: DeliverableApprovalDecision,
    organizationId: OrganizationId
  ): Promise<void> {
    const { error } = await this.client
      .from('deliverable_approval_decisions')
      .insert(approvalDecisionToRow(decision, organizationId))
    if (error) throw new Error(`[DLVR_REPO] saveApprovalDecision failed: ${error.message}`)
  }

  async saveRevisionRequest(
    request: DeliverableRevisionRequest,
    organizationId: OrganizationId
  ): Promise<void> {
    const { error } = await this.client
      .from('deliverable_revision_requests')
      .insert(revisionRequestToRow(request, organizationId))
    if (error) throw new Error(`[DLVR_REPO] saveRevisionRequest failed: ${error.message}`)
  }
}
