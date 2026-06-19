import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  BusinessBrain,
  BusinessBrainId,
  BusinessMemory,
  BusinessMemoryId,
  BusinessMemoryType,
  OrganizationId,
  TenantId,
  WorkforceId,
} from '@/shared/types'
import type { IBusinessBrainRepository, MemoryQueryOptions } from './repository'

// ---------------------------------------------------------------------------
// Database row types — mirror the schema in migration 003
// ---------------------------------------------------------------------------

interface BusinessBrainRow {
  id: string
  organization_id: string
  tenant_id: string
  created_at: string
  updated_at: string
}

interface BusinessMemoryRow {
  id: string
  business_brain_id: string
  organization_id: string
  tenant_id: string
  workforce_id: string | null
  type: string
  content: Record<string, unknown>
  source: string
  relevance_scope: string[]
  version: number
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Row ↔ entity mappers
// ---------------------------------------------------------------------------

function mapBrain(row: BusinessBrainRow): BusinessBrain {
  return {
    id: row.id as BusinessBrainId,
    organizationId: row.organization_id as OrganizationId,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function brainToRow(brain: BusinessBrain, tenantId: TenantId): BusinessBrainRow {
  return {
    id: brain.id,
    organization_id: brain.organizationId,
    tenant_id: tenantId,
    created_at: brain.createdAt.toISOString(),
    updated_at: brain.updatedAt.toISOString(),
  }
}

function mapMemory(row: BusinessMemoryRow): BusinessMemory {
  return {
    id: row.id as BusinessMemoryId,
    businessBrainId: row.business_brain_id as BusinessBrainId,
    organizationId: row.organization_id as OrganizationId,
    workforceId: row.workforce_id ? (row.workforce_id as WorkforceId) : undefined,
    type: row.type as BusinessMemoryType,
    content: row.content,
    source: row.source,
    relevanceScope: row.relevance_scope,
    version: row.version,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function memoryToRow(memory: BusinessMemory, tenantId: TenantId): BusinessMemoryRow {
  return {
    id: memory.id,
    business_brain_id: memory.businessBrainId,
    organization_id: memory.organizationId,
    tenant_id: tenantId,
    workforce_id: memory.workforceId ?? null,
    type: memory.type,
    content: memory.content,
    source: memory.source,
    relevance_scope: memory.relevanceScope,
    version: memory.version,
    created_at: memory.createdAt.toISOString(),
    updated_at: memory.updatedAt.toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Repository implementation
// ---------------------------------------------------------------------------

export class SupabaseBusinessBrainRepository implements IBusinessBrainRepository {
  constructor(private readonly client: SupabaseClient) {}

  async saveBrain(brain: BusinessBrain, tenantId: TenantId): Promise<BusinessBrain> {
    const { data, error } = await this.client
      .from('business_brains')
      .upsert(brainToRow(brain, tenantId), { onConflict: 'id' })
      .select()
      .single()
    if (error || !data) throw new Error(`[BB_REPO] saveBrain failed: ${error?.message}`)
    return mapBrain(data as BusinessBrainRow)
  }

  async findBrainByOrganizationId(organizationId: OrganizationId): Promise<BusinessBrain | null> {
    const { data, error } = await this.client
      .from('business_brains')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle()
    if (error) throw new Error(`[BB_REPO] findBrainByOrganizationId failed: ${error.message}`)
    return data ? mapBrain(data as BusinessBrainRow) : null
  }

  async saveMemory(memory: BusinessMemory, tenantId: TenantId): Promise<BusinessMemory> {
    const { data, error } = await this.client
      .from('business_memories')
      .upsert(memoryToRow(memory, tenantId), { onConflict: 'id' })
      .select()
      .single()
    if (error || !data) throw new Error(`[BB_REPO] saveMemory failed: ${error?.message}`)
    return mapMemory(data as BusinessMemoryRow)
  }

  async findMemoryById(id: BusinessMemoryId): Promise<BusinessMemory | null> {
    const { data, error } = await this.client
      .from('business_memories')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`[BB_REPO] findMemoryById failed: ${error.message}`)
    return data ? mapMemory(data as BusinessMemoryRow) : null
  }

  async queryMemories(
    organizationId: OrganizationId,
    options: MemoryQueryOptions
  ): Promise<BusinessMemory[]> {
    let query = this.client
      .from('business_memories')
      .select('*')
      .eq('organization_id', organizationId)

    if (options.types && options.types.length > 0) {
      query = query.in('type', options.types)
    }

    if (options.relevanceScope && options.relevanceScope.length > 0) {
      // overlaps operator: row array contains ANY of the filter values
      query = query.overlaps('relevance_scope', options.relevanceScope)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query
    if (error) throw new Error(`[BB_REPO] queryMemories failed: ${error.message}`)
    return (data ?? []).map((r) => mapMemory(r as BusinessMemoryRow))
  }

  async listAllMemories(organizationId: OrganizationId): Promise<BusinessMemory[]> {
    const { data, error } = await this.client
      .from('business_memories')
      .select('*')
      .eq('organization_id', organizationId)
    if (error) throw new Error(`[BB_REPO] listAllMemories failed: ${error.message}`)
    return (data ?? []).map((r) => mapMemory(r as BusinessMemoryRow))
  }

  async listMemoriesByWorkforce(
    workforceId: WorkforceId,
    organizationId: OrganizationId
  ): Promise<BusinessMemory[]> {
    const { data, error } = await this.client
      .from('business_memories')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('workforce_id', workforceId)
    if (error) throw new Error(`[BB_REPO] listMemoriesByWorkforce failed: ${error.message}`)
    return (data ?? []).map((r) => mapMemory(r as BusinessMemoryRow))
  }
}
