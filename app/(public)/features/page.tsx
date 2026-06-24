import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Features — Koolerr',
  description:
    'Explore every capability of the Koolerr AI Workforce Platform — from the Business Brain to Mission Control, Approvals, and the CTO Agent.',
}

const SECTIONS = [
  {
    id: 'ai-workforce',
    badge: 'AI Workforce',
    title: 'A complete marketing team, powered by AI',
    description:
      'Koolerr deploys a coordinated team of AI employees — each with a defined role, set of responsibilities, and direct access to your Business Brain. They work together, hand off tasks to each other, and only surface output when it is ready for your review.',
    items: [
      {
        title: 'Content Strategist',
        description:
          'Researches your audience, analyzes trends, and produces briefs that guide every piece of content your team creates.',
      },
      {
        title: 'Copywriter',
        description:
          'Turns briefs into finished copy — blog posts, email campaigns, social content, product descriptions, and ad copy — all in your brand voice.',
      },
      {
        title: 'Editor',
        description:
          'Reviews every deliverable against your brand guidelines, corrects inconsistencies, and polishes copy before it reaches you for approval.',
      },
    ],
    comingSoon: false,
  },
  {
    id: 'business-brain',
    badge: 'Business Brain',
    title: 'Your brand knowledge, centralized and always current',
    description:
      'The Business Brain is the knowledge layer that powers every AI employee on your platform. Think of it as your brand playbook — always available, always accurate, and read by every AI before it works.',
    items: [
      {
        title: 'Brand Voice & Tone',
        description:
          'Store your writing style guidelines, tone preferences, and example content so every AI employee sounds exactly like your brand.',
      },
      {
        title: 'Products & Audience',
        description:
          'Document your product catalog, value propositions, customer segments, and pain points to keep all AI output strategically aligned.',
      },
      {
        title: 'Living Knowledge Base',
        description:
          'Add new information at any time — your AI team picks it up immediately on the next run without any retraining required.',
      },
    ],
    comingSoon: false,
  },
  {
    id: 'mission-control',
    badge: 'Mission Control',
    title: 'Real-time visibility into your AI workforce',
    description:
      'Mission Control gives you a live view of everything happening across your AI platform — active runs, pending approvals, workforce status, and recent deliverables — all in one dashboard.',
    items: [
      {
        title: 'Live Run Monitoring',
        description:
          'See every active Engagement Run in real time — which employee is working, what stage it is at, and how long it has been running.',
      },
      {
        title: 'Approval Queue',
        description:
          'All deliverables waiting for your review are surfaced here. Approve or request revisions without leaving Mission Control.',
      },
      {
        title: 'Workforce Status',
        description:
          'At a glance: which Workforces are active, which are idle, and whether any require your attention.',
      },
    ],
    comingSoon: false,
  },
  {
    id: 'analytics',
    badge: 'Analytics',
    title: 'Measure what your AI workforce produces',
    description:
      'Koolerr tracks your AI workforce output over time so you can see what is working, identify patterns, and make informed decisions about how to deploy your AI team.',
    items: [
      {
        title: 'Output Volume',
        description:
          'Track how many Engagement Runs have been completed and deliverables produced.',
      },
      {
        title: 'Approval Rates',
        description:
          'See what percentage of AI output you are approving vs. requesting revisions on — a direct signal of Business Brain quality.',
      },
      {
        title: 'Usage Tracking',
        description:
          'Monitor your AI usage against your plan limits so you are never surprised at billing time.',
      },
    ],
    comingSoon: false,
  },
  {
    id: 'morning-brief',
    badge: 'Morning Brief',
    title: 'Your AI team, briefing you every morning',
    description:
      'Start every day with a curated summary of what your AI workforce produced overnight, what is waiting for your approval, and what your CTO Agent recommends you focus on today.',
    items: [
      {
        title: 'Overnight Production Summary',
        description:
          'A concise list of everything your AI team completed while you slept — with direct links to each deliverable.',
      },
      {
        title: 'Approval Priorities',
        description:
          'The Morning Brief surfaces the most time-sensitive approvals first so you can unblock your workflow in minutes.',
      },
      {
        title: "Today's Recommendations",
        description:
          'Your CTO Agent adds strategic context — what to prioritize today based on your business goals and current pipeline state.',
      },
    ],
    comingSoon: true,
  },
  {
    id: 'cto-agent',
    badge: 'Ask Your CTO',
    title: 'Engineering intelligence, always available',
    description:
      'Atlas, your CTO Agent, is an AI engineering orchestrator embedded directly in your platform. Ask it anything about your product, your launch readiness, or your next technical move — and get a structured implementation plan in response.',
    items: [
      {
        title: 'Launch Readiness Audits',
        description:
          'Atlas audits your platform state and produces a scored Launch Readiness Report — identifying blockers before they block you.',
      },
      {
        title: 'Implementation Plans',
        description:
          'Ask Atlas to plan any technical initiative and receive a phased, milestone-based implementation plan ready for execution.',
      },
      {
        title: 'Platform Health Monitoring',
        description:
          'Atlas continuously monitors your platform and surfaces risks, technical debt, and optimization opportunities proactively.',
      },
    ],
    comingSoon: false,
  },
  {
    id: 'academy',
    badge: 'Academy',
    title: 'Learn how to get the most from your AI workforce',
    description:
      'Koolerr Academy is a guided learning environment built directly into the platform — helping you and your team understand how to work with AI effectively, build a stronger Business Brain, and run more successful Engagement Runs.',
    items: [
      {
        title: 'Getting Started Tracks',
        description:
          'Step-by-step guides for setting up your Business Brain, launching your first Engagement Run, and reviewing your first deliverable.',
      },
      {
        title: 'Advanced Techniques',
        description:
          'Learn how to structure your Business Brain for maximum output quality, design effective Workforce goals, and interpret Analytics.',
      },
      {
        title: 'Role-Specific Training',
        description:
          'Tailored tracks for founders, marketing leads, and operations managers — so everyone on your team gets up to speed fast.',
      },
    ],
    comingSoon: true,
  },
  {
    id: 'ai-employees',
    badge: 'AI Employees',
    title: 'AI employees that work like your best hire',
    description:
      'Every AI employee on the Koolerr platform has a name, a defined role, a set of responsibilities, and a memory of your Business Brain. They are not prompts. They are persistent team members that show up every time you run a Workforce.',
    items: [
      {
        title: 'Persistent Identity',
        description:
          'Each AI employee has a consistent name and role that persists across every run — building familiarity and predictability in your workflow.',
      },
      {
        title: 'Role-Based Expertise',
        description:
          'AI employees specialize. Your Copywriter does not also do strategy. Your Editor does not write first drafts. Clear roles produce better output.',
      },
      {
        title: 'Approval-Gated Actions',
        description:
          'No AI employee acts without passing through the Trust Engine. Consequential actions require your explicit approval before execution.',
      },
    ],
    comingSoon: false,
  },
]

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest opacity-50">Platform</p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Everything your AI marketing team needs
            </h1>
            <p className="mt-6 text-lg leading-relaxed opacity-70">
              Koolerr is not a chat interface. It is a complete AI workforce platform — designed for
              businesses that want brand-aligned content without agency fees or prompt engineering.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="w-full rounded-lg bg-background px-8 py-3 text-center text-sm font-extrabold text-foreground transition-opacity hover:opacity-90 sm:w-auto"
              >
                Get started →
              </Link>
              <Link
                href="/pricing"
                className="w-full rounded-lg border border-background/30 px-8 py-3 text-center text-sm font-semibold text-background hover:border-background/60 sm:w-auto"
              >
                View pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature sections */}
      {SECTIONS.map((section, i) => (
        <section
          key={section.id}
          id={section.id}
          className={i % 2 === 0 ? 'bg-background py-20 sm:py-28' : 'bg-muted/40 py-20 sm:py-28'}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-12 max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {section.badge}
                </span>
                {section.comingSoon && (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Coming soon
                  </span>
                )}
              </div>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                {section.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                {section.description}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {section.items.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-border bg-background p-6 shadow-sm"
                >
                  <h3 className="mb-2 text-base font-bold text-foreground">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="bg-foreground py-20 text-background sm:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ready to hire your AI team?
          </h2>
          <p className="mt-4 text-base leading-relaxed opacity-70">
            Set up your Business Brain in minutes. Your first run is on us.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="w-full rounded-lg bg-background px-8 py-3.5 text-center text-sm font-extrabold text-foreground transition-opacity hover:opacity-90 sm:w-auto"
            >
              Start hiring AI →
            </Link>
            <Link
              href="/pricing"
              className="w-full rounded-lg border border-background/30 px-8 py-3.5 text-center text-sm font-semibold text-background hover:border-background/60 sm:w-auto"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
