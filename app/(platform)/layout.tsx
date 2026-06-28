import Image from 'next/image'
import Link from 'next/link'
import { headers } from 'next/headers'
import { signOut } from './layout-actions'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { isOwner, isOwnerAlwaysPath } from '@/infrastructure/auth/guards'
import { billingService } from '@/domains/billing'
import type { BillingStatus } from '@/domains/billing/types'

export const runtime = 'nodejs'

type AccessLevel = 'full' | 'soft' | 'billing_only'

interface SubInfo {
  status: BillingStatus
  planId: string
  periodEnd: Date
}

function resolveAccessLevel(sub: SubInfo | undefined): AccessLevel {
  if (!sub) return 'soft'
  if (sub.planId === 'unpaid') return 'soft'
  if (sub.status === 'active' || sub.status === 'trialing') return 'full'
  if (sub.status === 'past_due') return 'soft'
  if (sub.status === 'canceled') {
    return sub.periodEnd > new Date() ? 'full' : 'billing_only'
  }
  return 'soft'
}

function softBanner(sub: SubInfo | undefined): string | null {
  if (!sub || sub.planId === 'unpaid') return 'Choose a plan to unlock all features.'
  if (sub.status === 'past_due')
    return 'Your last payment failed. Update your payment method to avoid interruption.'
  if (sub.status === 'canceled') return 'Your subscription is ending soon. Renew to keep access.'
  return null
}

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''

  // Resolve subscription status for access enforcement. Fails open (full access)
  // if context or subscription cannot be resolved — prevents blocking legitimate users.
  let accessLevel: AccessLevel = 'full'
  let bannerMessage: string | null = null

  const ctx = await getRequestPlatformContext()
  if (ctx) {
    const subResult = await billingService.getSubscription(ctx.organizationId)
    const sub = subResult.ok
      ? {
          status: subResult.value.status,
          planId: subResult.value.planId,
          periodEnd: subResult.value.currentPeriodEnd,
        }
      : undefined
    accessLevel = resolveAccessLevel(sub)
    if (accessLevel === 'soft') bannerMessage = softBanner(sub)
  }

  const nav = (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="ml-1 inline-flex items-center">
            <Image
              src="/Koolerr_Logo_Trimmed.png"
              alt="Koolerr"
              width={3840}
              height={1441}
              className="h-10 w-auto"
              priority
            />
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <Link href="/cto" className="text-sm font-medium text-foreground hover:text-foreground">
              CTO Agent
            </Link>
            <Link href="/runs" className="text-sm text-muted-foreground hover:text-foreground">
              Runs
            </Link>
            <Link
              href="/workforces"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Workforces
            </Link>
            <Link href="/approvals" className="text-sm text-muted-foreground hover:text-foreground">
              Approvals
            </Link>
            <Link href="/brain" className="text-sm text-muted-foreground hover:text-foreground">
              Brain
            </Link>
            <Link href="/consent" className="text-sm text-muted-foreground hover:text-foreground">
              Consent
            </Link>
            <Link href="/audit" className="text-sm text-muted-foreground hover:text-foreground">
              Audit
            </Link>
            <Link href="/usage" className="text-sm text-muted-foreground hover:text-foreground">
              Usage
            </Link>
            <Link href="/analytics" className="text-sm text-muted-foreground hover:text-foreground">
              Analytics
            </Link>
            <Link href="/revenue" className="text-sm text-muted-foreground hover:text-foreground">
              Revenue
            </Link>
            <Link
              href="/mission-control"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Mission Control
            </Link>
            <Link href="/billing" className="text-sm text-muted-foreground hover:text-foreground">
              Billing
            </Link>
            {ctx !== null && isOwner(ctx) && (
              <Link href="/tracker" className="text-sm text-muted-foreground hover:text-foreground">
                Tracker
              </Link>
            )}
          </nav>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
            Sign out
          </button>
        </form>
      </div>
    </header>
  )

  // Expired/canceled subscription: block all pages except /billing and owner-always paths.
  const ownerCanAccess = ctx !== null && isOwner(ctx) && isOwnerAlwaysPath(pathname)
  if (accessLevel === 'billing_only' && !pathname.startsWith('/billing') && !ownerCanAccess) {
    return (
      <div className="min-h-screen bg-background">
        {nav}
        <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-md text-center">
            <h1 className="text-xl font-semibold text-foreground">Subscription expired</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Your subscription has ended. Reactivate your plan to continue using Koolerr.
            </p>
            <Link
              href="/billing"
              className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Manage billing
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {nav}
      {bannerMessage && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          {bannerMessage}{' '}
          <Link href="/billing" className="font-medium underline hover:no-underline">
            Go to billing
          </Link>
        </div>
      )}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
