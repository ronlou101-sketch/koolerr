import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pricing — Koolerr',
  description:
    'Simple, transparent pricing for every stage of growth. Build, Grow, or Scale your AI Marketing Team with Koolerr.',
}

const PLANS = [
  {
    tier: 'BUILD',
    price: '$99',
    period: '/ month',
    description: 'For small businesses ready to market consistently with AI.',
    highlight: false,
    badge: null,
    features: [
      '1 AI Marketing Workforce',
      '3 AI Employees',
      '10 Engagement Runs / month',
      'Business Brain (up to 50 entries)',
      'Human Approval Workflow',
      'Full Audit Trail',
      'Mission Control Dashboard',
      'Email support',
    ],
    cta: 'Get started',
    checkoutHref: '/api/checkout/start?plan=build',
  },
  {
    tier: 'GROW',
    price: '$499',
    period: '/ month',
    description: 'For businesses ready to scale growth with a full AI workforce.',
    highlight: true,
    badge: 'MOST POPULAR',
    features: [
      '3 AI Marketing Workforces',
      'Unlimited AI Employees',
      '50 Engagement Runs / month',
      'Business Brain (up to 500 entries)',
      'Human Approval Workflow',
      'Full Audit Trail',
      'Mission Control Dashboard',
      'Advanced Analytics',
      'CTO Agent — Atlas',
      'Priority support',
    ],
    cta: 'Get started',
    checkoutHref: '/api/checkout/start?plan=grow',
  },
  {
    tier: 'SCALE',
    price: '$1,499',
    period: '/ month',
    description: 'For organizations deploying AI across multiple departments.',
    highlight: false,
    badge: null,
    features: [
      'Unlimited AI Workforces',
      'Unlimited AI Employees',
      'Unlimited Engagement Runs',
      'Business Brain (unlimited entries)',
      'Human Approval Workflow',
      'Full Audit Trail',
      'Mission Control Dashboard',
      'Advanced Analytics',
      'CTO Agent — Atlas',
      'Revenue Analytics',
      'Custom Workforce configuration',
      'Dedicated support',
    ],
    cta: 'Get started',
    checkoutHref: '/api/checkout/start?plan=scale',
  },
]

const COMPARISON_ROWS = [
  { feature: 'AI Marketing Workforces', build: '1', grow: '3', scale: 'Unlimited' },
  { feature: 'AI Employees', build: '3', grow: 'Unlimited', scale: 'Unlimited' },
  { feature: 'Engagement Runs / month', build: '10', grow: '50', scale: 'Unlimited' },
  { feature: 'Business Brain entries', build: '50', grow: '500', scale: 'Unlimited' },
  { feature: 'Human Approval Workflow', build: '✓', grow: '✓', scale: '✓' },
  { feature: 'Full Audit Trail', build: '✓', grow: '✓', scale: '✓' },
  { feature: 'Mission Control Dashboard', build: '✓', grow: '✓', scale: '✓' },
  { feature: 'Advanced Analytics', build: '—', grow: '✓', scale: '✓' },
  { feature: 'CTO Agent — Atlas', build: '—', grow: '✓', scale: '✓' },
  { feature: 'Revenue Analytics', build: '—', grow: '—', scale: '✓' },
  { feature: 'Custom Workforce configuration', build: '—', grow: '—', scale: '✓' },
  { feature: 'Support', build: 'Email', grow: 'Priority email', scale: 'Dedicated' },
]

const FAQS = [
  {
    q: 'Can I change my plan at any time?',
    a: 'Yes. You can upgrade or downgrade your plan at any time from your Billing dashboard. Upgrades take effect immediately. Downgrades take effect at the start of your next billing cycle.',
  },
  {
    q: 'What counts as an Engagement Run?',
    a: 'An Engagement Run is one complete execution of a Workforce — from brief to final deliverable. A run that produces multiple content pieces (e.g., a blog post + social variants) counts as one run.',
  },
  {
    q: 'What happens if I exceed my run limit?',
    a: 'If you reach your monthly run limit, new runs are paused until your next billing cycle. You can upgrade your plan at any time to immediately increase your limit.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Every new account receives a complimentary first Engagement Run so you can see your AI team in action before committing. No credit card required to sign up.',
  },
  {
    q: 'Do you offer annual billing?',
    a: 'Annual billing with a discount is on our roadmap. Contact us at team@koolerr.com if you would like to discuss a custom arrangement.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards via Stripe. Your payment information is never stored on Koolerr servers — it is held securely by Stripe.',
  },
  {
    q: 'Can I cancel my subscription?',
    a: 'Yes. You can cancel at any time from your Billing dashboard. Your access continues until the end of your current billing period. We do not charge cancellation fees.',
  },
]

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Pricing
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Replace your agency. Not your budget.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Three packages built for businesses at every stage. No setup fees, no hidden costs,
              cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Plan cards */}
      <section className="bg-background pb-20 sm:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.tier}
                className={`relative rounded-xl ${plan.highlight ? 'bg-foreground text-background shadow-xl' : 'border border-border bg-card'} flex flex-col`}
              >
                {plan.badge && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-background px-4 py-1 text-xs font-extrabold uppercase tracking-widest text-foreground shadow-sm">
                    {plan.badge}
                  </span>
                )}
                <div className="p-6 pb-0">
                  <p
                    className={`text-xs font-extrabold uppercase tracking-widest ${plan.highlight ? 'opacity-50' : 'text-muted-foreground'}`}
                  >
                    {plan.tier}
                  </p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    <span
                      className={`text-sm ${plan.highlight ? 'opacity-50' : 'text-muted-foreground'}`}
                    >
                      {plan.period}
                    </span>
                  </div>
                  <p
                    className={`mt-3 text-sm leading-relaxed ${plan.highlight ? 'opacity-70' : 'text-muted-foreground'}`}
                  >
                    {plan.description}
                  </p>
                </div>

                <ul className="flex-1 space-y-2.5 p-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-emerald-400' : 'text-emerald-500'}`}
                      >
                        ✓
                      </span>
                      <span
                        className={`text-sm ${plan.highlight ? 'opacity-80' : 'text-foreground'}`}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="p-6 pt-0">
                  <Link
                    href={plan.checkoutHref}
                    className={`block w-full rounded-lg py-3 text-center text-sm font-extrabold transition-opacity hover:opacity-90 ${
                      plan.highlight
                        ? 'bg-background text-foreground'
                        : 'bg-foreground text-background'
                    }`}
                  >
                    {plan.cta} →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            All plans include a complimentary first Engagement Run. No credit card required to sign
            up.
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-muted/40 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Compare all plans
            </h2>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border bg-background shadow-sm">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="divide-x divide-border">
                  <th className="py-4 pl-6 pr-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Feature
                  </th>
                  {['BUILD', 'GROW', 'SCALE'].map((t) => (
                    <th
                      key={t}
                      className="px-6 py-4 text-center text-xs font-extrabold uppercase tracking-wider text-foreground"
                    >
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} className="divide-x divide-border hover:bg-muted/30">
                    <td className="py-3.5 pl-6 pr-4 text-sm font-medium text-foreground">
                      {row.feature}
                    </td>
                    {[row.build, row.grow, row.scale].map((val, i) => (
                      <td
                        key={i}
                        className={`px-6 py-3.5 text-center text-sm ${
                          val === '✓'
                            ? 'font-bold text-emerald-500'
                            : val === '—'
                              ? 'text-muted-foreground'
                              : 'font-medium text-foreground'
                        }`}
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Pricing questions
            </h2>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-border bg-background">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-sm font-semibold text-foreground">
                  {faq.q}
                  <span className="flex-shrink-0 text-muted-foreground transition-transform group-open:rotate-180">
                    ↓
                  </span>
                </summary>
                <div className="border-t border-border px-6 pb-5 pt-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-foreground py-20 text-background sm:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Start your AI marketing team today.
          </h2>
          <p className="mt-4 text-base leading-relaxed opacity-70">
            Choose a plan, complete checkout in minutes, and your AI workforce is ready to run.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/api/checkout/start?plan=build"
              className="w-full rounded-lg bg-background px-8 py-3.5 text-center text-sm font-extrabold text-foreground transition-opacity hover:opacity-90 sm:w-auto"
            >
              Get started →
            </Link>
            <Link
              href="/contact"
              className="w-full rounded-lg border border-background/30 px-8 py-3.5 text-center text-sm font-semibold text-background hover:border-background/60 sm:w-auto"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
