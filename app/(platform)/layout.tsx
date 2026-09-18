import Image from 'next/image'
import Link from 'next/link'
import { headers } from 'next/headers'
import { signOut } from './layout-actions'
import { getRequestAuthEmail, getRequestPlatformContext } from '@/infrastructure/auth'
import { isOwner, isOwnerAlwaysPath } from '@/infrastructure/auth/guards'
import { billingService } from '@/domains/billing'
import type { BillingStatus } from '@/domains/billing/types'
import { NotificationBell } from './_components/notification-bell'
import { MobileNav } from './_components/mobile-nav'
import { AccountMenu } from './_components/account-menu'
import { NavDropdown } from './_components/nav-dropdown'
import { isNavItemActive, platformNav, type NavItem } from './_lib/nav-items'
import { getPendingReviewCount } from './_lib/review-queue'

export const runtime = 'nodejs'

/**
 * Viewports where ⌘ Owner and the notification bell must stay independently
 * reachable when Owner is shown (Architect lock 6fbbe92b).
 */
export const HEADER_OWNER_BELL_BREAKPOINTS_PX = [1280, 768, 390] as const

/**
 * Header row wraps instead of clipping or introducing H-scroll when Owner and
 * the bell compete for width (lock 6fbbe92b).
 */
export const HEADER_BAR_CLASS =
  'mx-auto flex min-h-14 max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 sm:px-6'

/**
 * Right-side chrome: compact wrapping actions so Owner + bell stay available
 * without overlapping Account or the mobile trigger.
 */
export const HEADER_ACTIONS_CLASS =
  'ml-auto flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-1 sm:gap-x-5'

/**
 * Dedicated Owner × notification cluster. Gap + wrap keep separate hit targets;
 * Owner is not hidden to resolve overlap.
 */
export const HEADER_OWNER_BELL_CLUSTER_CLASS = 'flex flex-wrap items-center gap-3'

/**
 * Header peer links: visible selected shade (not type-weight alone).
 * Matches the bottom-nav selected treatment using existing tokens.
 */
export const HEADER_PEER_SELECTED_CLASS =
  'rounded-md bg-primary/10 px-2 py-1 font-medium text-foreground'

/** Idle header peer / dropdown trigger. */
export const HEADER_PEER_IDLE_CLASS = 'text-muted-foreground hover:text-foreground'

/**
 * Wrap a header NavDropdown when its peer is current. Forces the trigger
 * (including Work on the /work hub, which NavDropdown children alone miss)
 * to the same shade/color selected treatment without editing nav-dropdown.
 */
export const HEADER_DROPDOWN_SELECTED_WRAP_CLASS =
  'rounded-md bg-primary/10 px-2 py-1 [&_button[aria-haspopup=menu]]:font-medium [&_button[aria-haspopup=menu]]:text-foreground'

/**
 * Primary header links: hidden on phone (portrait and landscape) so the
 * five-tab bar is the nav; shown on tablet/desktop. Same viewport rule as
 * the bottom bar hide query — do not use width-only `sm:flex` or phone
 * landscape (~844×390) would show header links AND hide the five tabs.
 */
export const HEADER_PRIMARY_NAV_CLASS =
  'hidden min-w-0 items-center gap-6 [@media(min-width:768px)_and_(min-height:32.5rem)]:flex'

/** Main padding that clears the fixed five-tab bar on phone, including landscape. */
export const MAIN_WITH_BOTTOM_NAV_PAD_CLASS =
  'mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 [@media(min-width:768px)_and_(min-height:32.5rem)]:pb-8'

/** Billing-only main padding — same phone-bar clearance as the default main. */
export const MAIN_BILLING_ONLY_PAD_CLASS =
  'mx-auto max-w-7xl px-4 py-16 pb-24 sm:px-6 [@media(min-width:768px)_and_(min-height:32.5rem)]:pb-16'

/**
 * Header peer is current on its href, nested paths, and composed children.
 * Work is therefore current on the /work hub, not only /runs /approvals /deliverables.
 */
export function isHeaderPeerActive(pathname: string, item: NavItem): boolean {
  return isNavItemActive(pathname, item)
}

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
  // Live count for the primary-nav Work badge (pending review).
  let pendingReviewCount = 0

  // Auth/context (+ email) resolve once via React cache() in resolve.ts;
  // billing + review stay parallel after organizationId is known.
  const [ctx, authEmail] = await Promise.all([getRequestPlatformContext(), getRequestAuthEmail()])
  if (ctx) {
    const [subResult, reviewCount] = await Promise.all([
      billingService.getSubscription(ctx.organizationId),
      getPendingReviewCount(ctx.organizationId, ctx.tenantId),
    ])
    pendingReviewCount = reviewCount
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
  // Email comes from the same cached getUser() as getRequestPlatformContext — no second session client.
  const isFounder = authEmail === 'ronlou101@gmail.com'

  const { primary, more, owner } = platformNav(isFounder)
  // Resolve the live badge count onto whichever primary item declares it.
  const primaryNav = primary.map((item) =>
    item.badgeKey === 'review' ? { ...item, badge: pendingReviewCount } : item
  )

  const nav = (
    <header className="border-b border-border bg-card">
      <div className={HEADER_BAR_CLASS}>
        <div className="flex shrink-0 items-center gap-8">
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
          <nav className={HEADER_PRIMARY_NAV_CLASS}>
            {primaryNav.map((item) => {
              const children = item.children ?? []
              const active = isHeaderPeerActive(pathname, item)
              if (children.length > 0) {
                // Work (and any future grouped peer): lifecycle chrome via the
                // existing NavDropdown. Badge stays on the peer so pending
                // review is discoverable without opening the menu.
                // Selected wrap marks /work hub as well as child routes.
                return (
                  <span
                    key={item.href}
                    className={`inline-flex shrink-0 items-center gap-1.5 ${
                      active ? HEADER_DROPDOWN_SELECTED_WRAP_CLASS : ''
                    }`}
                  >
                    <NavDropdown label={item.label} items={children} ariaLabel={item.label} />
                    <ReviewBadge count={item.badge} />
                  </span>
                )
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm hover:text-foreground ${
                    active ? HEADER_PEER_SELECTED_CLASS : HEADER_PEER_IDLE_CLASS
                  }`}
                >
                  {item.label}
                  <ReviewBadge count={item.badge} />
                </Link>
              )
            })}
            <span
              className={
                more.some((item) => isNavItemActive(pathname, item))
                  ? HEADER_DROPDOWN_SELECTED_WRAP_CLASS
                  : ''
              }
            >
              <NavDropdown label="More" items={more} />
            </span>
          </nav>
        </div>
        <div className={HEADER_ACTIONS_CLASS}>
          <div className={HEADER_OWNER_BELL_CLUSTER_CLASS}>
            {owner.length > 0 && (
              <NavDropdown label="⌘ Owner" items={owner} ariaLabel="Owner tools" />
            )}
            {ctx && <NotificationBell organizationId={ctx.organizationId} />}
          </div>
          <AccountMenu signOutAction={signOut} email={authEmail} />
          <MobileNav primary={primaryNav} more={more} owner={owner} />
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
        <main className={MAIN_BILLING_ONLY_PAD_CLASS}>
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
      <main className={MAIN_WITH_BOTTOM_NAV_PAD_CLASS}>{children}</main>
    </div>
  )
}

/** Pending-review count pill. Hidden at 0 so the header stays quiet when caught up. */
function ReviewBadge({ count }: { count?: number }) {
  if (!count) return null
  return (
    <span
      aria-label={`${count} awaiting review`}
      className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-yellow-500 px-1.5 text-xs font-semibold leading-5 text-white"
    >
      {count}
    </span>
  )
}
