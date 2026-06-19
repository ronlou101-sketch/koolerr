import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  DigitalEmployee,
  DigitalEmployeeId,
  DigitalEmployeeStatus,
  EngagementRun,
  EngagementRunId,
  EngagementRunStatus,
  OrganizationId,
  TenantId,
  Workforce,
  WorkforceId,
  WorkforceStatus,
} from '@/shared/types'
import type { IWorkforceEngineRepository } from './repository'

// ---------------------------------------------------------------------------
// Database row types — mirror the schema in migration 004
// ---------------------------------------------------------------------------

interface WorkforceRow {
  id: string
  organization_id: string
  tenant_id: string
  name: string
  business_function: string
  goals: string[]
  status: string
  created_at: string
  updated_at: string
}

interface DigitalEmployeeRow {
  id: string
  workforce_id: string
  organization_id: string
  tenant_id: string
  name: string
  role: string
  responsibilities: string[]
  permitted_tools: string[]
  status: string
  created_at: string
  updated_at: string
}

interface EngagementRunRow {
  id: string
  organization_id: string
  workforce_id: string
  tenant_id: string
  parent_run_id: string | null
  objective: string
  status: string
  participant_ids: string[]
  deliverable_ids: string[]
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Row ↔ entity mappers
// ---------------------------------------------------------------------------

function mapWorkforce(row: WorkforceRow): Workforce {
  return {
    id: row.id as WorkforceId,
    organizationId: row.organization_id as OrganizationId,
    name: row.name,
    businessFunction: row.business_function,
    goals: row.goals ?? [],
    status: row.status as WorkforceStatus,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function workforceToRow(wf: Workforce, tenantId: TenantId): WorkforceRow {
  return {
    id: wf.id,
    organization_id: wf.organizationId,
    tenant_id: tenantId,
    name: wf.name,
    business_function: wf.businessFunction,
    goals: wf.goals,
    status: wf.status,
    created_at: wf.createdAt.toISOString(),
    updated_at: wf.updatedAt.toISOString(),
  }
}

function mapEmployee(row: DigitalEmployeeRow): DigitalEmployee {
  return {
    id: row.id as DigitalEmployeeId,
    workforceId: row.workforce_id as WorkforceId,
    organizationId: row.organization_id as OrganizationId,
    name: row.name,
    role: row.role,
    responsibilities: row.responsibilities,
    permittedTools: row.permitted_tools,
    status: row.status as DigitalEmployeeStatus,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function employeeToRow(de: DigitalEmployee, tenantId: TenantId): DigitalEmployeeRow {
  return {
    id: de.id,
    workforce_id: de.workforceId,
    organization_id: de.organizationId,
    tenant_id: tenantId,
    name: de.name,
    role: de.role,
    responsibilities: de.responsibilities,
    permitted_tools: de.permittedTools,
    status: de.status,
    created_at: de.createdAt.toISOString(),
    updated_at: de.updatedAt.toISOString(),
  }
}

function mapRun(row: EngagementRunRow): EngagementRun {
  return {
    id: row.id as EngagementRunId,
    organizationId: row.organization_id as OrganizationId,
    workforceId: row.workforce_id as WorkforceId,
    parentRunId: row.parent_run_id ? (row.parent_run_id as EngagementRunId) : undefined,
    objective: row.objective,
    status: row.status as EngagementRunStatus,
    participantIds: row.participant_ids as DigitalEmployeeId[],
    deliverableIds: row.deliverable_ids as import('@/shared/types').DeliverableId[],
    startedAt: row.started_at ? new Date(row.started_at) : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function runToRow(run: EngagementRun, tenantId: TenantId): EngagementRunRow {
  return {
    id: run.id,
    organization_id: run.organizationId,
    workforce_id: run.workforceId,
    tenant_id: tenantId,
    parent_run_id: run.parentRunId ?? null,
    objective: run.objective,
    status: run.status,
    participant_ids: run.participantIds,
    deliverable_ids: run.deliverableIds,
    started_at: run.startedAt?.toISOString() ?? null,
    completed_at: run.completedAt?.toISOString() ?? null,
    created_at: run.createdAt.toISOString(),
    updated_at: run.updatedAt.toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Repository implementation
// ---------------------------------------------------------------------------

export class SupabaseWorkforceEngineRepository implements IWorkforceEngineRepository {
  constructor(private readonly client: SupabaseClient) {}

  async saveWorkforce(workforce: Workforce, tenantId: TenantId): Promise<Workforce> {
    const { data, error } = await this.client
      .from('workforces')
      .upsert(workforceToRow(workforce, tenantId), { onConflict: 'id' })
      .select()
      .single()
    if (error || !data) throw new Error(`[WE_REPO] saveWorkforce failed: ${error?.message}`)
    return mapWorkforce(data as WorkforceRow)
  }

  async findWorkforceById(id: WorkforceId): Promise<Workforce | null> {
    const { data, error } = await this.client
      .from('workforces')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`[WE_REPO] findWorkforceById failed: ${error.message}`)
    return data ? mapWorkforce(data as WorkforceRow) : null
  }

  async listWorkforcesByOrganization(organizationId: OrganizationId): Promise<Workforce[]> {
    const { data, error } = await this.client
      .from('workforces')
      .select('*')
      .eq('organization_id', organizationId)
    if (error) throw new Error(`[WE_REPO] listWorkforcesByOrganization failed: ${error.message}`)
    return (data ?? []).map((r) => mapWorkforce(r as WorkforceRow))
  }

  async saveDigitalEmployee(
    employee: DigitalEmployee,
    tenantId: TenantId
  ): Promise<DigitalEmployee> {
    const { data, error } = await this.client
      .from('digital_employees')
      .upsert(employeeToRow(employee, tenantId), { onConflict: 'id' })
      .select()
      .single()
    if (error || !data) throw new Error(`[WE_REPO] saveDigitalEmployee failed: ${error?.message}`)
    return mapEmployee(data as DigitalEmployeeRow)
  }

  async findDigitalEmployeeById(id: DigitalEmployeeId): Promise<DigitalEmployee | null> {
    const { data, error } = await this.client
      .from('digital_employees')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`[WE_REPO] findDigitalEmployeeById failed: ${error.message}`)
    return data ? mapEmployee(data as DigitalEmployeeRow) : null
  }

  async listDigitalEmployeesByWorkforce(workforceId: WorkforceId): Promise<DigitalEmployee[]> {
    const { data, error } = await this.client
      .from('digital_employees')
      .select('*')
      .eq('workforce_id', workforceId)
    if (error) throw new Error(`[WE_REPO] listDigitalEmployeesByWorkforce failed: ${error.message}`)
    return (data ?? []).map((r) => mapEmployee(r as DigitalEmployeeRow))
  }

  async saveEngagementRun(run: EngagementRun, tenantId: TenantId): Promise<EngagementRun> {
    const { data, error } = await this.client
      .from('engagement_runs')
      .upsert(runToRow(run, tenantId), { onConflict: 'id' })
      .select()
      .single()
    if (error || !data) throw new Error(`[WE_REPO] saveEngagementRun failed: ${error?.message}`)
    return mapRun(data as EngagementRunRow)
  }

  async findEngagementRunById(id: EngagementRunId): Promise<EngagementRun | null> {
    const { data, error } = await this.client
      .from('engagement_runs')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`[WE_REPO] findEngagementRunById failed: ${error.message}`)
    return data ? mapRun(data as EngagementRunRow) : null
  }

  async listEngagementRunsByOrganization(organizationId: OrganizationId): Promise<EngagementRun[]> {
    const { data, error } = await this.client
      .from('engagement_runs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    if (error)
      throw new Error(`[WE_REPO] listEngagementRunsByOrganization failed: ${error.message}`)
    return (data ?? []).map((r) => mapRun(r as EngagementRunRow))
  }
}
