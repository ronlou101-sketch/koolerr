import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { consentLedger } from '@/shared/consent'
import type { ConsentScope } from '@/shared/consent'
import { revokeConsentFormAction } from './actions'

interface Props {
  searchParams: Promise<{ revoked?: string }>
}

/**
 * Consent & Permissions page — Phase 2 Customer Dashboard.
 *
 * Shows the full consent history for the organization: what permissions
 * have been granted, by whom, and when. Active consents can be revoked.
 * Revoked records remain visible — the Consent Ledger is append-only.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.11 — Consent & Rights Ledger.
 * See FOUNDATION_003 §Phase 2 — Approval Workflows.
 */

const SCOPE_LABELS: Record<ConsentScope, string> = {
  content_creation: 'Content Creation',
  content_publishing: 'Content Publishing',
  email_sending: 'Email Sending',
  social_media_posting: 'Social Media Posting',
  customer_communication: 'Customer Communication',
  data_export: 'Data Export',
  external_api_access: 'External API Access',
  autonomous_action: 'Autonomous Action',
  business_brain_write: 'Business Brain Write',
}

function formatDate(date: Date | undefined): string {
  if (!date) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function ConsentPage({ searchParams }: Props) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  const { revoked } = await searchParams

  const records = await consentLedger.history({ organizationId: ctx.organizationId })

  const active = records.filter((r) => r.status === 'active')
  const revokedRecords = records.filter((r) => r.status === 'revoked')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Permissions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consents granted to your Digital Employees. You can revoke any active permission at any
          time.
        </p>
      </div>

      {revoked && (
        <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
          Permission revoked. Your Digital Employees will no longer take that action autonomously.
        </div>
      )}

      {/* Active consents */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">
          Active Permissions
          {active.length > 0 && (
            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              {active.length}
            </span>
          )}
        </h2>

        {active.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">No active permissions granted yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Permissions appear here when your Digital Employees request authorization for
              consequential actions.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {active.map((record) => (
              <div key={record.id} className="flex items-start justify-between gap-4 px-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      {SCOPE_LABELS[record.scope as ConsentScope] ?? record.scope}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{record.action}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Granted: {formatDate(record.grantedAt)}</span>
                    {record.expiresAt && <span>Expires: {formatDate(record.expiresAt)}</span>}
                  </div>
                </div>
                <form action={revokeConsentFormAction} className="shrink-0">
                  <input type="hidden" name="consentId" value={record.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-destructive px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-1"
                  >
                    Revoke
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Revoked consents — historical record */}
      {revokedRecords.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Revoked Permissions</h2>
          <div className="divide-y divide-border rounded-lg border border-border bg-card opacity-60">
            {revokedRecords.map((record) => (
              <div key={record.id} className="flex items-start justify-between gap-4 px-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {SCOPE_LABELS[record.scope as ConsentScope] ?? record.scope}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground line-through">
                      {record.action}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Granted: {formatDate(record.grantedAt)}</span>
                    <span>Revoked: {formatDate(record.revokedAt)}</span>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  Revoked
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Revoked permissions are retained for audit purposes. The Consent Ledger is append-only.
          </p>
        </section>
      )}
    </div>
  )
}
