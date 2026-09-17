'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CampaignCreator, GOALS, type GoalOption } from '../../_components/campaign-creator'

/**
 * Home outcome tiles (Architect lock c40f0ece / prior 8e01c1ed).
 *
 * Create tiles open the existing CampaignCreator (same POST /api/pipeline/run
 * path as Work) with a VISIBLE pre-filled outcome. They do not navigate to
 * /pipeline. Review uses the existing /approvals destination and is shown only
 * when something needs the customer (Founder override of reserved item 5).
 * Visual-only restyle: larger, colored first-viewport cards. No fourth tile
 * and no Phase 8 video capability.
 */
export const HOME_OUTCOME_TILES = [
  {
    id: 'content',
    label: 'Create content',
    description: 'Have your team make the next piece of marketing.',
    kind: 'create' as const,
    tone: 'bg-gradient-to-br from-blue-500 to-blue-600',
  },
  {
    id: 'customers',
    label: 'Get more customers',
    description: 'Ask your team to bring in more of the right people.',
    kind: 'create' as const,
    tone: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
  },
  {
    id: 'review',
    label: 'Review your work',
    description: 'Approve what is ready whenever you have a minute.',
    kind: 'review' as const,
    href: '/approvals',
    tone: 'bg-gradient-to-br from-orange-500 to-orange-600',
  },
] as const

/** Locked Home Ask dialog copy (c40f0ece). */
export const HOME_ASK_TITLE = 'Ask Koolerr'
export const HOME_ASK_SUPPORTING = 'What do you need?'
export const HOME_ASK_CTA = 'Start'
export const HOME_ASK_PLUS_LABEL = 'Ask Koolerr'
export const HOME_PROMPT_PLACEHOLDER = 'Or just tell Koolerr what you need…'

/** Home Ask goal list — content/marketing outcome is visible, not a secret clone. */
export const HOME_ASK_GOALS: readonly GoalOption[] = [
  { key: 'content', label: 'Create the next piece of marketing' },
  ...GOALS,
]

export type HomeAskIntent = 'blank' | 'content' | 'customers'

export interface HomeAskPrefill {
  initialGoal: string
  initialCustomTopic: string
  initialFocus: string
}

/**
 * Map a Home start path to CampaignCreator initial state.
 *
 * Cards pre-select a visible outcome. Prompt-bar + is blank Ask (no outcome)
 * unless the customer already typed freeform text, which lands in "Something
 * else…". Typed text on a card becomes optional focus. Same POST contract.
 */
export function homeAskPrefill(intent: HomeAskIntent, typedAsk: string): HomeAskPrefill {
  const typed = typedAsk.trim()
  if (intent === 'content') {
    return { initialGoal: 'content', initialCustomTopic: '', initialFocus: typed }
  }
  if (intent === 'customers') {
    return { initialGoal: 'leads', initialCustomTopic: '', initialFocus: typed }
  }
  if (typed) {
    return { initialGoal: 'other', initialCustomTopic: typed, initialFocus: '' }
  }
  return { initialGoal: '', initialCustomTopic: '', initialFocus: '' }
}

/** Review is a conditional Home action — hide the large card when nothing needs them. */
export function visibleHomeOutcomeTiles(showReview: boolean) {
  return HOME_OUTCOME_TILES.filter((tile) => tile.kind !== 'review' || showReview)
}

function TileIcon({ id }: { id: (typeof HOME_OUTCOME_TILES)[number]['id'] }) {
  const common = {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: 'h-8 w-8 sm:h-9 sm:w-9',
    'aria-hidden': true,
  }

  if (id === 'content') {
    return (
      <svg {...common}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
      </svg>
    )
  }

  if (id === 'customers') {
    return (
      <svg {...common}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M7 14l4-4 3 3 6-7" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

/**
 * Time-of-day greeting, outcome tiles, and Ask(+) create affordance.
 *
 * Visual hierarchy (Architect c40f0ece): greeting → large outcome tiles →
 * prominent Ask(+) beneath the tiles. Create cards pre-fill a visible outcome.
 * Prompt-bar + is blank Ask Koolerr. Review is conditional. Ask(+) invokes the
 * existing start flow (`CampaignCreator` → `POST /api/pipeline/run`) in a
 * Home-local dialog. It does not add a create API, route, or nav item, and it
 * does not use /pipeline as the destination.
 *
 * Client component so the greeting reflects the viewer's local time (server
 * time could be a different timezone). Renders "Good morning" on the server and
 * as the initial client state — matching to avoid hydration mismatch — then
 * corrects to afternoon/evening after mount. Presentation only.
 */
export function Greeting({
  subtitle,
  showReview = false,
}: {
  subtitle: string
  showReview?: boolean
}) {
  const [greeting, setGreeting] = useState('Good morning')
  const [open, setOpen] = useState(false)
  const [started, setStarted] = useState(false)
  const [ask, setAsk] = useState('')
  const [askIntent, setAskIntent] = useState<HomeAskIntent>('blank')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()
  const tiles = visibleHomeOutcomeTiles(showReview)
  const prefill = useMemo(() => homeAskPrefill(askIntent, ask), [askIntent, ask])

  const close = useCallback(() => {
    setOpen(false)
    setAsk('')
    setAskIntent('blank')
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

  function openAsk(intent: HomeAskIntent) {
    setAskIntent(intent)
    setOpen(true)
  }

  function onAskSubmit(e: React.FormEvent) {
    e.preventDefault()
    openAsk('blank')
  }

  const tileClassName =
    'flex w-full min-h-[9.5rem] flex-col justify-between rounded-3xl p-5 text-left text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-h-[11.5rem] sm:p-6'

  const tileGridClassName =
    tiles.length > 2
      ? 'grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4'
      : 'grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4'

  return (
    <div className="min-w-0 space-y-8 overflow-x-hidden">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {greeting}!{' '}
          <span aria-hidden="true" className="inline-block">
            👋
          </span>
        </h1>
        <p className="mt-2 max-w-2xl text-base text-muted-foreground sm:text-lg">{subtitle}</p>
      </div>

      <div>
        <h2 className="sr-only">What Koolerr can do</h2>
        <div className={tileGridClassName}>
          {tiles.map((tile) =>
            tile.kind === 'review' ? (
              <Link key={tile.id} href={tile.href} className={`${tileClassName} ${tile.tone}`}>
                <TileIcon id={tile.id} />
                <span>
                  <span className="block text-lg font-semibold sm:text-xl">{tile.label}</span>
                  <span className="mt-1 block text-sm text-white/85">{tile.description}</span>
                </span>
              </Link>
            ) : (
              <button
                key={tile.id}
                type="button"
                onClick={() => openAsk(tile.id === 'content' ? 'content' : 'customers')}
                className={`${tileClassName} ${tile.tone}`}
              >
                <TileIcon id={tile.id} />
                <span>
                  <span className="block text-lg font-semibold sm:text-xl">{tile.label}</span>
                  <span className="mt-1 block text-sm text-white/85">{tile.description}</span>
                </span>
              </button>
            )
          )}
        </div>
      </div>

      <form onSubmit={onAskSubmit} className="relative min-w-0">
        <label htmlFor="home-ask" className="sr-only">
          Tell Koolerr what you need
        </label>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-primary sm:left-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="h-5 w-5"
          >
            <path d="M12 3l1.2 3.6L17 8l-3.8 1.4L12 13l-1.2-3.6L7 8l3.8-1.4L12 3z" />
            <path d="M19 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" />
          </svg>
        </span>
        <input
          id="home-ask"
          type="text"
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
          placeholder={HOME_PROMPT_PLACEHOLDER}
          className="block min-h-14 w-full min-w-0 rounded-full border border-border bg-card py-3.5 pl-11 pr-16 text-[13px] text-foreground shadow-sm placeholder:text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:py-4 sm:pl-12 sm:pr-[4.25rem] sm:text-lg sm:placeholder:text-lg"
        />
        <button
          ref={triggerRef}
          type="submit"
          aria-label={HOME_ASK_PLUS_LABEL}
          title={HOME_ASK_PLUS_LABEL}
          className="absolute inset-y-1.5 right-1.5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span aria-hidden="true" className="text-xl font-semibold leading-none sm:text-2xl">
            +
          </span>
        </button>
      </form>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={HOME_ASK_TITLE}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative mt-8 w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold text-foreground">{HOME_ASK_TITLE}</h2>
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

            <CampaignCreator
              key={`${askIntent}:${prefill.initialGoal}:${prefill.initialCustomTopic}:${prefill.initialFocus}`}
              onStarted={() => setStarted(true)}
              goals={HOME_ASK_GOALS}
              initialGoal={prefill.initialGoal}
              initialCustomTopic={prefill.initialCustomTopic}
              initialFocus={prefill.initialFocus}
              question={HOME_ASK_SUPPORTING}
              submitLabel={HOME_ASK_CTA}
            />
          </div>
        </div>
      )}
    </div>
  )
}
