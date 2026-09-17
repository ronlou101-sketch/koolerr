'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { isNavItemActive, type NavItem } from '../_lib/nav-items'
import { CampaignCreator } from './campaign-creator'

/**
 * One slot on the persistent mobile bottom bar.
 *
 * Destinations are the existing primary peers. Ask is an in-place create
 * action (not a route). More opens the existing overflow drawer — it is not
 * a destination and must not grow a new URL.
 */
export type BottomNavSlot =
  | { kind: 'destination'; item: NavItem }
  | { kind: 'ask' }
  | { kind: 'more' }

/**
 * Persistent mobile bar slots: primary peers with Ask in the visual center
 * and More as overflow (not a destination).
 *
 * Inserts Ask after the first two peers so Home / Work / Ask / Business
 * matches PRIMARY_NAV order (Home, Work, Business) plus the founder Ask
 * affordance. More is always last and never a route.
 */
export function bottomNavSlots(primary: NavItem[]): BottomNavSlot[] {
  const destinations: BottomNavSlot[] = primary.map((item) => ({
    kind: 'destination',
    item,
  }))
  const askAt = Math.min(2, destinations.length)
  return [
    ...destinations.slice(0, askAt),
    { kind: 'ask' },
    ...destinations.slice(askAt),
    { kind: 'more' },
  ]
}

/** Labels in visual order — used by tests so slot identity is not inferred from JSX. */
export function bottomNavSlotLabels(primary: NavItem[]): string[] {
  return bottomNavSlots(primary).map((slot) => {
    if (slot.kind === 'destination') return slot.item.label
    if (slot.kind === 'ask') return 'Ask+'
    return 'More'
  })
}

/** Destination hrefs only — Ask and More are excluded because they are not routes. */
export function bottomNavDestinationHrefs(primary: NavItem[]): string[] {
  return bottomNavSlots(primary).flatMap((slot) =>
    slot.kind === 'destination' ? [slot.item.href] : []
  )
}

/**
 * Whether a primary peer should show as the current location.
 *
 * Matches the desktop convention: the peer href itself, nested paths under
 * that href, or any composed descendant (so Work is current on /approvals
 * and Business is current on /billing, /usage, /consent, and /audit without
 * promoting those children to peers).
 */
export function isDestinationActive(pathname: string, item: NavItem): boolean {
  return isNavItemActive(pathname, item)
}

/** Escape dismisses the Ask dialog, matching Home Ask(+) / New campaign. */
export function isAskDialogDismissKey(key: string): boolean {
  return key === 'Escape'
}

/**
 * Persistent mobile bottom navigation.
 *
 * Rendered only below the `sm` breakpoint (the desktop header bar handles
 * larger screens). Home / Work / Business are the existing primary peers;
 * the center Ask(+) control opens the existing CampaignCreator flow in a
 * local dialog — same path as Home Ask(+), not a /pipeline destination.
 * More is an overflow action that opens the existing hamburger drawer.
 */
export function BottomNav({
  primary,
  moreOpen = false,
  onMoreClick,
}: {
  primary: NavItem[]
  moreOpen?: boolean
  onMoreClick?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [askOpen, setAskOpen] = useState(false)
  const [started, setStarted] = useState(false)
  const askTriggerRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const closeAsk = useCallback(() => {
    setAskOpen(false)
    if (started) {
      setStarted(false)
      router.refresh()
    }
  }, [started, router])

  useEffect(() => {
    if (!askOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (isAskDialogDismissKey(e.key)) closeAsk()
    }
    document.addEventListener('keydown', onKeyDown)
    closeButtonRef.current?.focus()
    const trigger = askTriggerRef.current
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      trigger?.focus()
    }
  }, [askOpen, closeAsk])

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:hidden"
      >
        <ul className="mx-auto flex w-full max-w-7xl items-end overflow-visible">
          {bottomNavSlots(primary).map((slot) => {
            if (slot.kind === 'ask') {
              return (
                <li key="ask" className="flex min-w-0 flex-1 justify-center">
                  <button
                    ref={askTriggerRef}
                    type="button"
                    aria-label="Ask Koolerr"
                    title="Ask Koolerr"
                    aria-haspopup="dialog"
                    aria-expanded={askOpen}
                    onClick={() => setAskOpen(true)}
                    className="-mt-4 inline-flex h-14 min-h-11 w-14 min-w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span aria-hidden="true" className="text-2xl font-semibold leading-none">
                      +
                    </span>
                  </button>
                </li>
              )
            }

            if (slot.kind === 'more') {
              return (
                <li key="more" className="flex min-w-0 flex-1 justify-center">
                  <button
                    type="button"
                    aria-label="More"
                    aria-haspopup="dialog"
                    aria-expanded={moreOpen}
                    onClick={onMoreClick}
                    className="inline-flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 px-1 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <MoreIcon />
                    <span className="text-[11px] font-medium leading-none">More</span>
                  </button>
                </li>
              )
            }

            const { item } = slot
            const active = isDestinationActive(pathname, item)
            return (
              <li key={item.href} className="flex min-w-0 flex-1 justify-center">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative inline-flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 px-1 py-2 ${
                    active
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <PeerIcon label={item.label} />
                  <span className="max-w-full truncate text-[11px] leading-none">{item.label}</span>
                  {item.badge ? (
                    <span
                      aria-label={`${item.badge} awaiting review`}
                      className="absolute right-1 top-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-yellow-500 px-1 text-[10px] font-semibold leading-4 text-white"
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {askOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="New campaign"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={closeAsk}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative mt-8 w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">New campaign</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Tell me what you&apos;d like your marketing to accomplish, and I&apos;ll take it
                  from there.
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close"
                onClick={closeAsk}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <CampaignCreator onStarted={() => setStarted(true)} />
          </div>
        </div>
      )}
    </>
  )
}

function PeerIcon({ label }: { label: string }) {
  const common = {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: 'h-5 w-5',
    'aria-hidden': true,
  }

  if (label === 'Work') {
    return (
      <svg {...common}>
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <rect x="4" y="7" width="16" height="13" rx="2" />
      </svg>
    )
  }

  if (label === 'Business') {
    return (
      <svg {...common}>
        <path d="M4 21V5a1 1 0 0 1 1-1h6v17" />
        <path d="M11 21h9V9a1 1 0 0 0-1-1h-8" />
        <path d="M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path d="M4 11.5L12 4l8 7.5" />
      <path d="M6 10.5V20h12v-9.5" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}
