import Image from 'next/image'
import Link from 'next/link'
import { headers } from 'next/headers'
import { signOut } from './layout-actions'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { isOwner, isOwnerAlwaysPath } from '@/infrastructure/auth/guards'
import { billingService } from '@/domains/billing'
import type { BillingStatus } from '@/domains/billing/types'
import { createSessionServerClient } from '@/shared/lib/supabase-session'
import { NotificationBell } from './_components/notification-bell'
import { MobileNav } from './_components/mobile-nav'
import { AccountMenu } from './_components/account-menu'
import { visibleNavItems } from './_lib/nav-items'

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

  // Tracker tab is visible only to the platform founder.
  // Every provisioned user holds role:'owner' for their own org, so isOwner()
  // returns true for all users and cannot distinguish the founder. Email is the
  // only reliable discriminator available at this layer without changing shared types.
  const supabase = await createSessionServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  const isFounder = authUser?.email === 'ronlou101@gmail.com'

  const navItems = visibleNavItems(isFounder)

  const nav = (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/dashboard" className="ml-1 inline-flex shrink-0 items-center">
            <Image
              src="/Koolerr_Logo_Trimmed.png"
              alt="Koolerr"
              width={3840}
              height={1441}
              className="h-10 w-auto"
              priority
            />
          </Link>
          <nav className="hidden min-w-0 items-center gap-6 overflow-x-auto sm:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  item.primary
                    ? 'shrink-0 whitespace-nowrap text-sm font-medium text-foreground hover:text-foreground'
                    : 'shrink-0 whitespace-nowrap text-sm text-muted-foreground hover:text-foreground'
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-5">
          {ctx && <NotificationBell organizationId={ctx.organizationId} />}
          <AccountMenu signOutAction={signOut} email={authUser?.email ?? undefined} />
          <MobileNav items={navItems} />
        </div>
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
