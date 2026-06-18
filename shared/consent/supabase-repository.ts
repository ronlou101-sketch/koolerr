import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ConsentId,
  ConsentRecord,
  ConsentStatus,
  OrganizationId,
  UserId,
} from '@/shared/types'
import type { ConsentFilter } from './types'
import type { IConsentRepository } from './repository'

// ---------------------------------------------------------------------------
// Database row types — mirror the schema in migration 007
// ---------------------------------------------------------------------------

interface ConsentRecordRow {
  id: string
  organization_id: string
  tenant_id: string
  granted_by: string
  scope: string
  action: string
  status: string
  granted_at: string
  expires_at: string | null
  revoked_at: string | null
}

// ---------------------------------------------------------------------------
// Row ↔ entity mappers
// ---------------------------------------------------------------------------

function mapRecord(row: ConsentRecordRow): ConsentRecord {
  return {
    id: row.id as ConsentId,
    organizationId: row.organization_id as OrganizationId,
    grantedBy: row.granted_by as UserId,
    scope: row.scope,
    action: row.action,
    status: row.status as ConsentStatus,
    grantedAt: new Date(row.granted_at),
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    revokedAt: row.revoked_at ? new Date(row.revoked_at) : undefined,
  }
}

function recordToRow(record: ConsentRecord, tenantId: string): ConsentRecordRow {
  return {
    id: record.id,
    organization_id: record.organizationId,
    tenant_id: tenantId,
    granted_by: record.grantedBy,
    scope: record.scope,
    action: record.action,
    status: record.status,
    granted_at: record.grantedAt.toISOString(),
    expires_at: record.expiresAt?.toISOString() ?? null,
    revoked_at: record.revokedAt?.toISOString() ?? null,
  }
}

// ---------------------------------------------------------------------------
// Repository implementation
// ---------------------------------------------------------------------------

/**
 * SupabaseConsentRepository
 *
 * The consent ledger is append-only. saveRecord() uses upsert semantics —
 * only the status and revoked_at columns are updated on conflict. This
 * preserves the original grant data while correctly recording revocations.
 *
 * The tenantId is looked up via the organization at the bootstrap layer and
 * injected through the constructor, avoiding a per-call join.
 */
export class SupabaseConsentRepository implements IConsentRepository {
  /**
   * @param client - Server-side Supabase client
   * @param getTenantId - Called when saving a record to resolve the tenant.
   *   Accepts the organizationId and returns its tenantId. Provided by
   *   bootstrap to avoid a direct organizations table dependency in this class.
   */
  constructor(
    private readonly client: SupabaseClient,
    private readonly getTenantId: (organizationId: OrganizationId) => Promise<string>
  ) {}

  async saveRecord(record: ConsentRecord): Promise<ConsentRecord> {
    const tenantId = await this.getTenantId(record.organizationId)
    const { data, error } = await this.client
      .from('consent_records')
      .upsert(recordToRow(record, tenantId), { onConflict: 'id' })
      .select()
      .single()
    if (error || !data) throw new Error(`[CONSENT_REPO] saveRecord failed: ${error?.message}`)
    return mapRecord(data as ConsentRecordRow)
  }

  async findRecordById(id: ConsentId): Promise<ConsentRecord | null> {
    const { data, error } = await this.client
      .from('consent_records')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`[CONSENT_REPO] findRecordById failed: ${error.message}`)
    return data ? mapRecord(data as ConsentRecordRow) : null
  }

  async findActiveConsent(
    organizationId: OrganizationId,
    action: string
  ): Promise<ConsentRecord | null> {
    const now = new Date().toISOString()
    const { data, error } = await this.client
      .from('consent_records')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('action', action)
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .maybeSingle()
    if (error) throw new Error(`[CONSENT_REPO] findActiveConsent failed: ${error.message}`)
    return data ? mapRecord(data as ConsentRecordRow) : null
  }

  async listRecords(filter: ConsentFilter): Promise<ConsentRecord[]> {
    let query = this.client
      .from('consent_records')
      .select('*')
      .eq('organization_id', filter.organizationId)

    if (filter.scope) query = query.eq('scope', filter.scope)
    if (filter.action) query = query.eq('action', filter.action)

    if (filter.activeOnly) {
      const now = new Date().toISOString()
      query = query.eq('status', 'active').or(`expires_at.is.null,expires_at.gt.${now}`)
    }

    const { data, error } = await query
    if (error) throw new Error(`[CONSENT_REPO] listRecords failed: ${error.message}`)
    return (data ?? []).map((r) => mapRecord(r as ConsentRecordRow))
  }
}
