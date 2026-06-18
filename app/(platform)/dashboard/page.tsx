import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'

/**
 * Dashboard — the authenticated landing page.
 *
 * Server Component. Resolves the PlatformContext from the session and
 * renders a workspace overview. In Phase 2 this will become a full
 * customer dashboard showing Workforce activity, Deliverables, and
 * Business Brain health.
 *
 * If getRequestPlatformContext() returns null (session exists in Supabase
 * Auth but the platform account has not been provisioned yet), the user is
 * redirected to sign up again so provisioning can complete.
 *
 * See FOUNDATION_003_DEVELOPMENT_ROADMAP.md §Phase 2 — Customer Dashboard.
 */
export default async function DashboardPage() {
  const ctx = await getRequestPlatformContext()

  if (!ctx) {
    // Supabase Auth session present but no platform account found.
    // This can happen if signup provisioning failed (e.g. missing PLATFORM_TENANT_ID).
    redirect('/signup?error=no_platform_account')
  }

  const actorLabel =
    ctx.actor.type === 'user'
      ? `${ctx.actor.role} · ${ctx.actor.userId}`
      : ctx.actor.type === 'api_key'
        ? `API key · ${ctx.actor.keyId}`
        : `System · ${ctx.actor.serviceId}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Your workforce is ready</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform is running. The full dashboard arrives in Phase 2.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Organization
          </p>
          <p className="mt-1 font-mono text-sm text-foreground">{ctx.organizationId}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tenant
          </p>
          <p className="mt-1 font-mono text-sm text-foreground">{ctx.tenantId}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Actor</p>
          <p className="mt-1 font-mono text-sm text-foreground">{actorLabel}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Request ID
          </p>
          <p className="mt-1 font-mono text-sm text-foreground">{ctx.requestId}</p>
        </div>
      </div>
    </div>
  )
}
