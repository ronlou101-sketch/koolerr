import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { billingService, ENTITLEMENT_FEATURES, PLAN_IDS, PLAN_LABELS } from '@/domains/billing'

/**
 * Usage page — shows the customer their current plan, entitlement limits,
 * and usage progress for the current billing period.
 *
 * Satisfies FOUNDATION_003 Phase 1: "A simple subscription or usage model
 * must be in place before the first real customer activates."
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.14 — Billing.
 */

function UsageBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit === Infinity ? 0 : Math.min(100, Math.round((used / limit) * 100))
  const isWarning = pct >= 80
  const isFull = pct >= 100

  return (
    <div className="mt-2 space-y-1">
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${
            isFull ? 'bg-destructive' : isWarning ? 'bg-yellow-500' : 'bg-primary'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {limit === Infinity
          ? `${used.toLocaleString()} used (unlimited)`
          : `${used.toLocaleString()} / ${limit.toLocaleString()} used`}
      </p>
    </div>
  )
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default async function UsagePage() {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  const [subscriptionResult, entitlementsResult] = await Promise.all([
    billingService.getSubscription(ctx.tenantId),
    billingService.getEntitlements(ctx.organizationId),
  ])

  const subscription = subscriptionResult.ok ? subscriptionResult.value : null
  const entitlements = entitlementsResult.ok ? entitlementsResult.value : []

  const runEntitlement = entitlements.find((e) => e.feature === ENTITLEMENT_FEATURES.engagementRun)
  const tokenEntitlement = entitlements.find(
    (e) => e.feature === ENTITLEMENT_FEATURES.modelInvocation
  )

  const planLabel = subscription
    ? (PLAN_LABELS[subscription.planId as keyof typeof PLAN_LABELS] ?? subscription.planId)
    : 'Free'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Usage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your current plan and usage for this billing period.
        </p>
      </div>

      {/* Plan card */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Current Plan
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">{planLabel}</p>
            {subscription && (
              <p className="mt-1 text-sm text-muted-foreground">
                Period: {formatDate(subscription.currentPeriodStart)} —{' '}
                {formatDate(subscription.currentPeriodEnd)}
              </p>
            )}
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              subscription?.status === 'active'
                ? 'bg-green-100 text-green-700'
                : subscription?.status === 'trialing'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-destructive/10 text-destructive'
            }`}
          >
            {subscription?.status ?? 'Unknown'}
          </span>
        </div>
      </div>

      {/* Entitlements */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-foreground">Usage This Period</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Engagement Runs */}
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm font-medium text-foreground">Engagement Runs</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Complete content workflows produced by your workforce.
            </p>
            {runEntitlement ? (
              <UsageBar used={runEntitlement.used} limit={runEntitlement.limit} />
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">No entitlement data yet.</p>
            )}
            {runEntitlement &&
              runEntitlement.limit !== Infinity &&
              runEntitlement.used >= runEntitlement.limit && (
                <p className="mt-2 text-xs font-medium text-destructive">
                  Run limit reached. Usage resets at the start of your next billing period.
                </p>
              )}
          </div>

          {/* Model Tokens */}
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm font-medium text-foreground">Model Tokens</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              AI tokens consumed across all runs (input + output).
            </p>
            {tokenEntitlement ? (
              <UsageBar used={tokenEntitlement.used} limit={tokenEntitlement.limit} />
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">No token usage recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          Usage limits reset at the start of each billing period. All usage data is recorded in your{' '}
          <Link href="/audit" className="text-primary hover:underline">
            Audit Trail
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
