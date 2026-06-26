import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { billingService } from '@/domains/billing'
import type { PlanId } from '@/domains/billing/plans'
import { CheckoutButton } from './checkout-button'

/**
 * Billing page — AI Workforce Packages.
 *
 * UI/marketing update: repositions Koolerr as an AI workforce platform.
 * Backend plan IDs (starter, growth) are unchanged. SCALE is display-only
 * with a contact-sales CTA until a third Stripe tier is configured.
 *
 * See docs/adr/ADR-021-stripe-billing-integration.md
 */

// ── Package display data ──────────────────────────────────────────────────────

interface FeatureGroup {
  group: string
  items: string[]
}

interface Package {
  planId: PlanId
  tier: string
  price: string
  headline: string
  bestFor: string
  outcome: string
  badge?: string
  badgeSubtitle?: string
  featureGroups: FeatureGroup[]
  cta: string
}

const PACKAGES: Package[] = [
  {
    planId: 'build',
    tier: 'BUILD',
    price: '$99',
    headline: 'Build Your AI Marketing Team',
    bestFor: 'Small businesses ready to market consistently with AI.',
    outcome: 'Replace hours of weekly marketing work with your own AI workforce.',
    featureGroups: [
      {
        group: 'Your AI Workforce',
        items: [
          'Business Brain',
          'Marketing Director',
          'Content Strategist',
          'Copywriter',
          'Social Media Manager',
          'Up to 10 AI Workforce Employees',
        ],
      },
      {
        group: 'Monthly Output',
        items: [
          '20 AI Marketing Assets per month',
          'Up to 5 AI Spokesperson Videos per month',
          'AI Image Generation',
          'Social Media Captions',
        ],
      },
      {
        group: 'Platform',
        items: ['Mission Control', 'Email Support (48-hr response)'],
      },
    ],
    cta: 'Start Hiring AI',
  },
  {
    planId: 'grow',
    tier: 'GROW',
    price: '$499',
    headline: 'Replace Your Marketing Department',
    bestFor: 'Businesses ready to scale growth with AI.',
    outcome: 'Operate a complete AI-powered marketing department every month.',
    badge: 'Best Value',
    badgeSubtitle: 'Recommended for most businesses',
    featureGroups: [
      {
        group: 'Everything in BUILD, plus',
        items: [
          'Up to 50 AI Workforce Employees',
          '100 AI Marketing Assets per month',
          'Up to 30 AI Spokesperson Videos per month',
        ],
      },
      {
        group: 'Advanced Capabilities',
        items: [
          'Advanced Business Research',
          'AI Creative Asset Generation',
          'AI Marketing Campaign Generation',
        ],
      },
      {
        group: 'Content Production',
        items: ['Landing Pages', 'Blog Articles', 'Email Campaigns'],
      },
      {
        group: 'Support',
        items: ['Priority Support (8-hr response)'],
      },
    ],
    cta: 'Scale My AI Team',
  },
  {
    planId: 'scale',
    tier: 'SCALE',
    price: '$1,499',
    headline: 'Operate an AI-Powered Business',
    bestFor: 'Organizations deploying AI across multiple departments.',
    outcome: 'Run an AI workforce across your entire business from a single platform.',
    featureGroups: [
      {
        group: 'Everything in GROW, plus',
        items: [
          '200 AI Workforce Employees',
          '500 AI Marketing Assets per month',
          'Up to 100 AI Spokesperson Videos per month',
          'Multiple Organizations',
        ],
      },
      {
        group: 'Enterprise Capabilities',
        items: [
          'Dedicated CTO Agent',
          'Developer Workflow Integration',
          'API Access',
          'Custom Workflows',
          'White Label Ready',
        ],
      },
      {
        group: 'Enterprise Operations',
        items: [
          'Enterprise Security',
          'Team Collaboration',
          'Dedicated Onboarding',
          'Quarterly AI Strategy Reviews',
          'Dedicated Support (4-hr SLA, 24/7)',
        ],
      },
    ],
    cta: 'Talk to Our Team',
  },
]

// ── Comparison table rows ─────────────────────────────────────────────────────

interface ComparisonRow {
  label: string
  build: string
  grow: string
  scale: string
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: 'AI Workforce Employees',
    build: 'Up to 10',
    grow: 'Up to 50',
    scale: 'Up to 200',
  },
  {
    label: 'AI Marketing Assets / Month',
    build: '20',
    grow: '100',
    scale: '500',
  },
  {
    label: 'AI Spokesperson Videos / Month',
    build: 'Up to 5',
    grow: 'Up to 30',
    scale: 'Up to 100',
  },
  {
    label: 'AI Marketing Campaigns',
    build: '—',
    grow: '✓',
    scale: '✓',
  },
  {
    label: 'Landing Pages & Blog Articles',
    build: '—',
    grow: '✓',
    scale: '✓',
  },
  {
    label: 'Business Brain',
    build: '✓',
    grow: '✓',
    scale: '✓',
  },
  {
    label: 'Mission Control',
    build: '✓',
    grow: '✓',
    scale: '✓',
  },
  {
    label: 'Dedicated CTO Agent',
    build: '—',
    grow: '—',
    scale: '✓',
  },
  {
    label: 'API Access',
    build: '—',
    grow: '—',
    scale: '✓',
  },
  {
    label: 'Support',
    build: 'Email (48-hr)',
    grow: 'Priority (8-hr)',
    scale: 'Dedicated (24/7)',
  },
]

// ── Display names for active subscription widget ──────────────────────────────

const PACKAGE_DISPLAY_NAMES: Record<string, string> = {
  unpaid: 'No active package',
  build: 'BUILD — AI Workforce Package',
  grow: 'GROW — AI Workforce Package',
  scale: 'SCALE — AI Workforce Package',
}

// ── Plan order for upgrade logic (unpaid is the initial state, never shown as a card) ─────

const PLAN_ORDER: Record<string, number> = {
  unpaid: 0,
  build: 1,
  grow: 2,
  scale: 3,
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>
}) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  const { upgraded } = await searchParams
  const subscriptionResult = await billingService.getSubscription(ctx.organizationId)
  const subscription = subscriptionResult.ok ? subscriptionResult.value : null
  const currentPlanId = (subscription?.planId ?? 'unpaid') as PlanId
  const stripeEnabled = !!process.env.STRIPE_SECRET_KEY
  const currentOrder = PLAN_ORDER[currentPlanId] ?? 0

  return (
    <div className="space-y-12 overflow-x-hidden">
      {/* ── Page header ── */}
      <div className="border-b border-border pb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Koolerr
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          AI Workforce Packages
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Stop buying software. Start hiring AI. Every package gives you a fully-equipped team of AI
          employees — built for your brand, powered by your Business Brain, and working for your
          business around the clock.
        </p>
      </div>

      {/* ── Upgrade confirmation ── */}
      {upgraded && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-800">
          ✓ Your AI Workforce Package has been updated. Your new team is ready.
        </div>
      )}

      {/* ── Stripe not configured (internal ops notice) ── */}
      {!stripeEnabled && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 [overflow-wrap:anywhere]">
          <strong>Payments not yet active.</strong> Set{' '}
          <code className="rounded bg-amber-100 px-1 font-mono text-xs">STRIPE_SECRET_KEY</code>,{' '}
          <code className="rounded bg-amber-100 px-1 font-mono text-xs">STRIPE_WEBHOOK_SECRET</code>
          ,{' '}
          <code className="rounded bg-amber-100 px-1 font-mono text-xs">STRIPE_BUILD_PRICE_ID</code>
          ,{' '}
          <code className="rounded bg-amber-100 px-1 font-mono text-xs">STRIPE_GROW_PRICE_ID</code>,
          and{' '}
          <code className="rounded bg-amber-100 px-1 font-mono text-xs">STRIPE_SCALE_PRICE_ID</code>{' '}
          to enable billing.
        </div>
      )}

      {/* ── Active package summary ── */}
      {subscription && currentPlanId !== 'unpaid' && (
        <div className="flex items-start justify-between gap-6 rounded-xl border border-border bg-card p-5">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Active Package
            </p>
            <p className="text-xl font-bold text-foreground">
              {PACKAGE_DISPLAY_NAMES[currentPlanId] ?? currentPlanId}
            </p>
            <p className="text-sm capitalize text-muted-foreground">
              {subscription.status}
              {subscription.currentPeriodEnd && (
                <> · Renews {subscription.currentPeriodEnd.toLocaleDateString()}</>
              )}
            </p>
          </div>
          {subscription.stripeCustomerId && (
            <form action="/api/billing/portal" method="POST" className="flex-shrink-0">
              <button
                type="submit"
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                Manage Billing →
              </button>
            </form>
          )}
        </div>
      )}

      {/* ── Package cards ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {PACKAGES.map((pkg) => {
          const pkgOrder = PLAN_ORDER[pkg.planId ?? ''] ?? 99
          const isCurrent = pkg.planId !== null && pkg.planId === currentPlanId
          const isUpgrade = pkgOrder > currentOrder
          const isGrow = pkg.tier === 'GROW'

          if (isGrow) {
            // ── GROW: inverted dark card (best value, recommended) ───────────
            return (
              <div
                key={pkg.tier}
                className="relative flex flex-col rounded-xl bg-foreground p-6 text-background"
              >
                {/* Most Popular badge */}
                {pkg.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="whitespace-nowrap rounded-full bg-background px-4 py-1 text-xs font-extrabold uppercase tracking-widest text-foreground shadow-sm">
                      {pkg.badge}
                    </span>
                  </div>
                )}

                {/* Current badge */}
                {isCurrent && (
                  <span className="absolute right-4 top-4 rounded-full bg-background/20 px-3 py-0.5 text-xs font-bold text-background">
                    Current
                  </span>
                )}

                {/* Tier + price */}
                <div className="mb-5">
                  <p className="text-xs font-extrabold uppercase tracking-widest opacity-50">
                    {pkg.tier}
                  </p>
                  {pkg.badgeSubtitle && (
                    <p className="mt-1 text-[11px] font-medium opacity-60">{pkg.badgeSubtitle}</p>
                  )}
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold tracking-tight">{pkg.price}</span>
                    <span className="text-sm opacity-50">/ month</span>
                  </div>
                  <p className="mt-3 text-lg font-semibold leading-snug">{pkg.headline}</p>
                  <p className="mt-1.5 text-sm opacity-60">{pkg.bestFor}</p>
                </div>

                {/* Outcome */}
                <div className="mb-5 rounded-lg bg-white/10 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-50">
                    What you get
                  </p>
                  <p className="mt-1 text-sm font-medium leading-relaxed">{pkg.outcome}</p>
                </div>

                {/* Feature groups */}
                <div className="flex-1 space-y-5">
                  {pkg.featureGroups.map((group) => (
                    <div key={group.group}>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider opacity-40">
                        {group.group}
                      </p>
                      <ul className="space-y-1.5">
                        {group.items.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-sm">
                            <span className="mt-0.5 flex-shrink-0 text-emerald-400">✓</span>
                            <span className="opacity-90">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-8">
                  {isCurrent ? (
                    <div className="rounded-md bg-white/10 py-2.5 text-center text-sm font-bold">
                      Your Current Package
                    </div>
                  ) : isUpgrade && stripeEnabled ? (
                    <CheckoutButton
                      planId={pkg.planId}
                      className="w-full rounded-md bg-background py-2.5 text-sm font-extrabold text-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {pkg.cta}
                    </CheckoutButton>
                  ) : isUpgrade && !stripeEnabled ? (
                    <div className="rounded-md bg-white/10 py-2.5 text-center text-xs opacity-50">
                      Payments not yet active
                    </div>
                  ) : null}
                </div>
              </div>
            )
          }

          // ── BUILD and SCALE: light cards ────────────────────────────────────
          return (
            <div
              key={pkg.tier}
              className={`relative flex flex-col rounded-xl border bg-card p-6 ${
                pkg.tier === 'SCALE' ? 'border-foreground/20' : 'border-border'
              }`}
            >
              {/* Current badge */}
              {isCurrent && (
                <span className="absolute right-4 top-4 rounded-full bg-foreground px-3 py-0.5 text-xs font-bold text-background">
                  Current
                </span>
              )}

              {/* Tier + price */}
              <div className="mb-5">
                <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                  {pkg.tier}
                </p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold tracking-tight text-foreground">
                    {pkg.price}
                  </span>
                  <span className="text-sm text-muted-foreground">/ month</span>
                </div>
                <p className="mt-3 text-lg font-semibold leading-snug text-foreground">
                  {pkg.headline}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{pkg.bestFor}</p>
              </div>

              {/* Outcome */}
              <div className="mb-5 rounded-lg bg-muted px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  What you get
                </p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-foreground">
                  {pkg.outcome}
                </p>
              </div>

              {/* Feature groups */}
              <div className="flex-1 space-y-5">
                {pkg.featureGroups.map((group) => (
                  <div key={group.group}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {group.group}
                    </p>
                    <ul className="space-y-1.5">
                      {group.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="mt-0.5 flex-shrink-0 text-emerald-500">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-8">
                {isCurrent ? (
                  <div className="rounded-md border border-border py-2.5 text-center text-sm font-semibold text-muted-foreground">
                    Your Current Package
                  </div>
                ) : isUpgrade && stripeEnabled ? (
                  <CheckoutButton
                    planId={pkg.planId}
                    className="w-full rounded-md bg-foreground py-2.5 text-sm font-extrabold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {pkg.cta}
                  </CheckoutButton>
                ) : isUpgrade && !stripeEnabled ? (
                  <p className="text-center text-xs text-muted-foreground">
                    Payments not yet active
                  </p>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Comparison table ── */}
      <div>
        <h2 className="mb-5 text-lg font-bold text-foreground">Package Comparison</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="w-1/2 px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Feature
                </th>
                <th className="px-4 py-3.5 text-center text-xs font-extrabold uppercase tracking-wider text-foreground">
                  BUILD
                  <span className="block text-[10px] font-normal normal-case tracking-normal text-muted-foreground">
                    $99 / mo
                  </span>
                </th>
                <th className="bg-foreground/5 px-4 py-3.5 text-center text-xs font-extrabold uppercase tracking-wider text-foreground">
                  GROW ★
                  <span className="block text-[10px] font-normal normal-case tracking-normal text-muted-foreground">
                    $499 / mo
                  </span>
                </th>
                <th className="px-4 py-3.5 text-center text-xs font-extrabold uppercase tracking-wider text-foreground">
                  SCALE
                  <span className="block text-[10px] font-normal normal-case tracking-normal text-muted-foreground">
                    $1,499 / mo
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COMPARISON_ROWS.map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  <td className="px-5 py-3.5 font-medium text-foreground">{row.label}</td>
                  <td className="px-4 py-3.5 text-center text-muted-foreground">{row.build}</td>
                  <td className="bg-foreground/5 px-4 py-3.5 text-center font-medium text-foreground">
                    {row.grow}
                  </td>
                  <td className="px-4 py-3.5 text-center text-muted-foreground">{row.scale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          <strong className="font-medium text-foreground">AI Marketing Asset:</strong> One piece of
          AI-produced content — a social media post, blog article, email, landing page, or ad
          creative. Spokesperson videos count separately against the video limit.
        </p>
      </div>

      {/* ── Footer ── */}
      <div className="space-y-3 border-t border-border pt-8 text-center">
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
          <strong className="font-semibold text-foreground">Launch Pricing</strong> — As Koolerr
          grows, pricing may increase for future customers. Existing subscribers keep their pricing
          for as long as their subscription remains active.
        </p>
        <p className="text-xs text-muted-foreground">
          Questions?{' '}
          <Link href="/cto" className="underline underline-offset-2 hover:text-foreground">
            Ask your CTO Agent
          </Link>{' '}
          for workforce strategy advice.
        </p>
      </div>
    </div>
  )
}
