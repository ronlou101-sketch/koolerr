'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CampaignCreator } from '../../_components/campaign-creator'

/**
 * Home outcome tiles (Architect lock 94274eb9).
 *
 * Create tiles open the existing CampaignCreator (same flow as Campaigns →
 * New campaign). They do not navigate to /pipeline. Review uses the existing
 * /approvals destination.
 */
export const HOME_OUTCOME_TILES = [
  {
    id: 'customers',
    label: 'Get more customers',
    description: 'Ask your team to bring in more of the right people.',
    kind: 'create' as const,
  },
  {
    id: 'content',
    label: 'Create content',
    description: 'Have your team make the next piece of marketing.',
    kind: 'create' as const,
  },
  {
    id: 'review',
    label: 'Review your work',
    description: 'Approve what is ready whenever you have a minute.',
    kind: 'review' as const,
    href: '/approvals',
  },
] as const

/**
 * Time-of-day greeting, Ask(+) create affordance, and outcome tiles.
 *
 * Ask(+) invokes the existing New-campaign flow (`CampaignCreator` →
 * `POST /api/pipeline/run`) in a Home-local dialog. It does not add a create
 * API, route, or nav item, and it does not use /pipeline as the destination.
 *
 * Client component so the greeting reflects the viewer's local time (server
 * time could be a different timezone). Renders "Good morning" on the server and
 * as the initial client state — matching to avoid hydration mismatch — then
 * corrects to afternoon/evening after mount. Presentation only.
 */
export function Greeting({ subtitle }: { subtitle: string }) {
  const [greeting, setGreeting] = useState('Good morning')
  const [open, setOpen] = useState(false)
  const [started, setStarted] = useState(false)
  const [ask, setAsk] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()

  const close = useCallback(() => {
    setOpen(false)
    setAsk('')
    if (started) {
      setStarted(false)
      router.refresh()
    }
  }, [started, router])

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening')
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)
    closeButtonRef.current?.focus()
    const trigger = triggerRef.current
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      trigger?.focus()
    }
  }, [open, close])

  function openCreate() {
    setOpen(true)
  }

  function onAskSubmit(e: React.FormEvent) {
    e.preventDefault()
    openCreate()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{greeting}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <form onSubmit={onAskSubmit} className="relative">
        <label htmlFor="home-ask" className="sr-only">
          Ask your marketing team
        </label>
        <input
          id="home-ask"
          type="text"
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
          placeholder="Ask your marketing team…"
          className="block w-full rounded-xl border border-border bg-card py-3.5 pl-4 pr-14 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          ref={triggerRef}
          type="submit"
          aria-label="Ask+"
          title="Ask+"
          className="absolute inset-y-1.5 right-1.5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <span aria-hidden="true" className="text-xl font-semibold leading-none">
            +
          </span>
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-3">
        {HOME_OUTCOME_TILES.map((tile) =>
          tile.kind === 'review' ? (
            <Link
              key={tile.id}
              href={tile.href}
              className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-foreground/30 hover:bg-muted/30"
            >
              <p className="text-sm font-semibold text-foreground">{tile.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{tile.description}</p>
            </Link>
          ) : (
            <button
              key={tile.id}
              type="button"
              onClick={openCreate}
              className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-foreground/30 hover:bg-muted/30"
            >
              <p className="text-sm font-semibold text-foreground">{tile.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{tile.description}</p>
            </button>
          )
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="New campaign"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={close}
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
                onClick={close}
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
    </div>
  )
}
