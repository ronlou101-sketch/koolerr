import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSessionServerClient } from '@/shared/lib/supabase-session'
import PublicHeader from '@/shared/components/public-header'
import PublicFooter from '@/shared/components/public-footer'

export const metadata: Metadata = {
  title: 'Koolerr — Your AI Marketing Team',
  description:
    'Stop buying software. Start hiring AI. Koolerr gives your business a complete AI Marketing Team — trained on your brand, working around the clock.',
}

const FEATURES = [
  {
    icon: '👥',
    title: 'AI Marketing Workforce',
    description:
      'A complete team of AI employees — Content Strategist, Copywriter, and Editor — trained on your brand and producing work that sounds like you.',
  },
  {
    icon: '🧠',
    title: 'Business Brain',
    description:
      'A living knowledge base that captures your brand voice, products, audience, and goals. Every AI employee reads it before they work.',
  },
  {
    icon: '🎛️',
    title: 'Mission Control',
    description:
      'A real-time dashboard showing exactly what your AI team is doing, what is waiting for approval, and how your content pipeline is performing.',
  },
  {
    icon: '✅',
    title: 'Human Approvals',
    description:
      'Every deliverable is routed to you for review before it is used or published. Your workforce never acts without your authorization.',
  },
  {
    icon: '📋',
    title: 'Full Audit Trail',
    description:
      'A complete record of every AI action — what was requested, what was produced, who approved it, and when. Total transparency.',
  },
  {
    icon: '⚙️',
    title: 'CTO Agent — Atlas',
    description:
      'An AI engineering orchestrator that tracks your platform health, identifies blockers, and produces implementation plans on demand.',
  },
]

const STEPS = [
  {
    step: '01',
    title: 'Build Your Business Brain',
    description:
      'Tell Koolerr about your company, brand voice, target audience, and products. Your AI workforce reads this before every task — so everything it produces sounds like you.',
  },
  {
    step: '02',
    title: 'Deploy Your AI Workforce',
    description:
      'Your team of AI employees — Content Strategist, Copywriter, Editor — immediately gets to work producing blog posts, social content, email campaigns, and more.',
  },
  {
    step: '03',
    title: 'Review, Approve, Publish',
    description:
      'Every deliverable lands in your Approvals queue. Approve what you love, request changes on anything else. Nothing goes live without your sign-off.',
  },
]

const FAQS = [
  {
    q: 'What exactly is an AI workforce?',
    a: 'An AI workforce is a team of AI employees — each with a specific role and access to your Business Brain — that collaborates to produce marketing content. Unlike a single AI tool, a Koolerr workforce coordinates across multiple specialized agents: a Content Strategist plans, a Copywriter writes, and an Editor reviews and polishes.',
  },
  {
    q: 'How is this different from ChatGPT or other AI tools?',
    a: "Most AI tools are one-shot assistants — you prompt them, they respond. Koolerr is a coordinated workforce: multiple AI employees working together on a shared objective, trained on your specific brand, with a human approval step before anything is finalized. It's the difference between asking an intern for a draft and managing a full marketing department.",
  },
  {
    q: 'Do I need technical skills to use Koolerr?',
    a: 'No. Koolerr is designed for business owners, marketing leads, and founders — not engineers. Setup takes minutes: describe your business, and your AI team is ready to work.',
  },
  {
    q: 'Will the content sound like my brand?',
    a: 'Yes — because your AI team reads your Business Brain before every task. The Brain stores your brand voice, tone guidelines, target audience, product details, and examples you provide. The more context you give it, the more on-brand your output.',
  },
  {
    q: 'Can I control what the AI does?',
    a: 'Completely. Every AI action passes through the Trust Engine. Consequential actions require your explicit approval before execution. You can also revoke any permission at any time from the Permissions dashboard.',
  },
  {
    q: 'What happens to my data?',
    a: 'Your data stays in your isolated tenant environment. It is never used to train shared models or shared with other customers. See our Privacy Policy for full details.',
  },
]

export default async function Home() {
  const supabase = await createSessionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <>
      <PublicHeader />
      <main>
        {/* Hero */}
        <section className="bg-foreground text-background">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest opacity-50">
                AI Workforce Platform
              </p>
              <h1 className="text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                Stop buying software. <span className="opacity-60">Start hiring AI.</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed opacity-70 sm:text-xl">
                Koolerr gives your business a complete AI Marketing Team — a Content Strategist,
                Copywriter, and Editor trained on your brand, working around the clock to produce
                content that converts.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/signup"
                  className="w-full rounded-lg bg-background px-8 py-3.5 text-center text-sm font-extrabold text-foreground transition-opacity hover:opacity-90 sm:w-auto"
                >
                  Start hiring AI →
                </Link>
                <Link
                  href="/pricing"
                  className="w-full rounded-lg border border-background/30 px-8 py-3.5 text-center text-sm font-semibold text-background transition-colors hover:border-background/60 sm:w-auto"
                >
                  View pricing
                </Link>
              </div>
              <p className="mt-5 text-xs opacity-40">No credit card required · Cancel anytime</p>
            </div>
          </div>
        </section>

        {/* Value strip */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                { label: 'Trained on your brand', sub: 'Not generic AI output' },
                { label: 'Human approval on every deliverable', sub: 'You stay in control' },
                { label: 'Full audit trail', sub: 'Every AI action logged' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <span className="mt-0.5 text-emerald-500">✓</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-muted/40 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                How it works
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Up and running in minutes
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.step} className="rounded-xl bg-background p-8 shadow-sm">
                  <p className="mb-4 text-4xl font-extrabold text-foreground/10">{s.step}</p>
                  <h3 className="mb-2 text-lg font-bold text-foreground">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="bg-background py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Platform
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Everything your AI team needs
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Koolerr is not a chat interface. It is a complete AI workforce platform — built for
                businesses that want consistent, brand-aligned content without the agency fees.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-xl border border-border bg-card p-6">
                  <p className="mb-3 text-2xl">{f.icon}</p>
                  <h3 className="mb-2 text-base font-bold text-foreground">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/features"
                className="text-sm font-semibold text-foreground transition-opacity hover:opacity-60"
              >
                See all features →
              </Link>
            </div>
          </div>
        </section>

        {/* AI Workforce showcase */}
        <section className="bg-foreground py-20 text-background sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest opacity-50">
                  Your AI team
                </p>
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Real roles. AI-powered.
                </h2>
                <p className="mt-4 text-base leading-relaxed opacity-70">
                  Each AI employee has a name, a role, and a direct read on your Business Brain.
                  They execute complete workflows, pass work to each other, and only surface output
                  when it&apos;s ready for your review.
                </p>
                <ul className="mt-8 space-y-3">
                  {[
                    { role: 'Content Strategist', desc: 'Research, planning, audience insights' },
                    { role: 'Copywriter', desc: 'Long-form, social, email, ad copy' },
                    { role: 'Editor', desc: 'Quality review, brand consistency, final polish' },
                    {
                      role: 'CTO Agent — Atlas',
                      desc: 'Platform health, implementation plans, launch tracking',
                    },
                  ].map((e) => (
                    <li key={e.role} className="flex items-start gap-3">
                      <span className="mt-0.5 flex-shrink-0 text-emerald-400">✓</span>
                      <div>
                        <span className="text-sm font-semibold">{e.role}</span>
                        <span className="mx-1.5 opacity-30">·</span>
                        <span className="text-sm opacity-60">{e.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual mockup */}
              <div className="rounded-xl border border-background/10 bg-background/5 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-semibold uppercase tracking-widest opacity-50">
                    Content Workforce — Active
                  </span>
                </div>
                {[
                  {
                    name: 'Alex',
                    role: 'Content Strategist',
                    status: 'Researching audience insights…',
                    active: true,
                  },
                  {
                    name: 'Jordan',
                    role: 'Copywriter',
                    status: 'Waiting for brief from Alex',
                    active: false,
                  },
                  {
                    name: 'Sam',
                    role: 'Editor',
                    status: 'Last run: Blog Post — approved',
                    active: false,
                    done: true,
                  },
                ].map((emp) => (
                  <div
                    key={emp.name}
                    className="mb-3 rounded-lg border border-background/10 bg-background/5 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">{emp.name}</p>
                        <p className="text-xs opacity-50">{emp.role}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          emp.done
                            ? 'bg-emerald-400/20 text-emerald-300'
                            : emp.active
                              ? 'bg-background/15 text-background'
                              : 'bg-background/10 opacity-50'
                        }`}
                      >
                        {emp.done ? 'Ready' : emp.active ? 'Working' : 'Waiting'}
                      </span>
                    </div>
                    <p className="mt-2 text-xs opacity-50">{emp.status}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing teaser */}
        <section className="bg-background py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Pricing
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Replace your agency. Not your budget.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Three packages built for businesses at every stage.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                {
                  tier: 'BUILD',
                  price: '$99',
                  desc: 'For small businesses ready to market consistently with AI.',
                  highlight: false,
                },
                {
                  tier: 'GROW',
                  price: '$499',
                  desc: 'For businesses ready to scale growth with a full AI workforce.',
                  highlight: true,
                },
                {
                  tier: 'SCALE',
                  price: '$1,499',
                  desc: 'For organizations deploying AI across multiple departments.',
                  highlight: false,
                },
              ].map((p) => (
                <div
                  key={p.tier}
                  className={`relative rounded-xl p-6 ${p.highlight ? 'bg-foreground text-background' : 'border border-border bg-card'}`}
                >
                  {p.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-background px-4 py-1 text-xs font-extrabold uppercase tracking-widest text-foreground shadow-sm">
                      MOST POPULAR
                    </span>
                  )}
                  <p
                    className={`text-xs font-extrabold uppercase tracking-widest ${p.highlight ? 'opacity-50' : 'text-muted-foreground'}`}
                  >
                    {p.tier}
                  </p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">{p.price}</span>
                    <span
                      className={`text-sm ${p.highlight ? 'opacity-50' : 'text-muted-foreground'}`}
                    >
                      / month
                    </span>
                  </div>
                  <p
                    className={`mt-3 text-sm leading-relaxed ${p.highlight ? 'opacity-70' : 'text-muted-foreground'}`}
                  >
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Compare all plans →
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-muted/40 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="mb-12 text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                FAQ
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Common questions
              </h2>
            </div>
            <div className="space-y-2">
              {FAQS.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-xl border border-border bg-background"
                >
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

        {/* Final CTA */}
        <section className="bg-foreground py-20 text-background sm:py-28">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Your AI team is ready to start.
            </h2>
            <p className="mt-4 text-base leading-relaxed opacity-70">
              Set up your Business Brain in minutes. Your first run is on us.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="w-full rounded-lg bg-background px-8 py-3.5 text-center text-sm font-extrabold text-foreground transition-opacity hover:opacity-90 sm:w-auto"
              >
                Start hiring AI →
              </Link>
              <Link
                href="/contact"
                className="w-full rounded-lg border border-background/30 px-8 py-3.5 text-center text-sm font-semibold text-background transition-colors hover:border-background/60 sm:w-auto"
              >
                Talk to us
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  )
}
