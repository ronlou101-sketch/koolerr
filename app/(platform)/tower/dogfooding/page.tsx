import Link from 'next/link'
import { createSessionServerClient } from '@/shared/lib/supabase-session'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DogfoodingDashboardPage() {
  const supabase = await createSessionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user?.email !== 'ronlou101@gmail.com') notFound()

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/tower" className="hover:text-foreground">
              Tower Control
            </Link>
            <span>/</span>
            <span className="text-foreground">Dogfooding</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">
            Internal Marketing Department
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Autonomous marketing for Koolerr — 8 AI agents, 5-stage pipeline, Meta-ready
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 dark:border-amber-800 dark:bg-amber-950">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
              Phase 1 — Planning Only
            </span>
          </div>
        </div>
      </div>

      {/* Quickstart */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Get Started</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/tower/dogfooding/objectives/new"
            className="group rounded-lg border border-border bg-card p-5 hover:border-foreground/20 hover:shadow-sm"
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-foreground">New Objective</p>
              <span className="text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                →
              </span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Define a marketing objective and trigger the 5-agent pipeline to produce a full
              campaign plan automatically.
            </p>
            <div className="mt-4 inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
              Create Objective
            </div>
          </Link>

          <Link
            href="/tower/dogfooding/objectives"
            className="group rounded-lg border border-border bg-card p-5 hover:border-foreground/20 hover:shadow-sm"
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-foreground">View Objectives</p>
              <span className="text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                →
              </span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Review all marketing objectives and their pipeline status — from draft to active
              campaign plans.
            </p>
          </Link>

          <Link
            href="/tower/dogfooding/campaigns"
            className="group rounded-lg border border-border bg-card p-5 hover:border-foreground/20 hover:shadow-sm"
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-foreground">View Campaigns</p>
              <span className="text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                →
              </span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Browse all AI-generated campaigns with copy variants and creative direction. Ready for
              Meta execution in Phase 2.
            </p>
          </Link>
        </div>
      </section>

      {/* Agent Pipeline */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">5-Stage Agent Pipeline</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Triggered when you run a pipeline on an objective. Runs autonomously end-to-end.
          </p>
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          {[
            {
              step: '01',
              agent: 'Marketing Researcher',
              id: 'marketing-researcher',
              action: 'market_research',
              output: 'ICP analysis, market angles, competitive insights',
              provider: 'Manus / OpenAI',
            },
            {
              step: '02',
              agent: 'Marketing Strategist',
              id: 'marketing-strategist',
              action: 'create_campaign_strategy',
              output: 'Campaign structure, targeting, channel mix, budget split',
              provider: 'OpenAI',
            },
            {
              step: '03',
              agent: 'Marketing CMO',
              id: 'marketing-cmo',
              action: 'create_marketing_plan',
              output: 'Full marketing plan with messaging pillars and KPIs',
              provider: 'OpenAI',
            },
            {
              step: '04',
              agent: 'Marketing Copywriter',
              id: 'marketing-copywriter',
              action: 'write_ad_copy',
              output: '3 ad copy variants per campaign — headline, body, CTA',
              provider: 'OpenAI',
            },
            {
              step: '05',
              agent: 'Marketing Creative Director',
              id: 'marketing-creative-director',
              action: 'create_creative_direction',
              output: 'Higgsfield image prompts + visual strategy per campaign',
              provider: 'OpenAI',
            },
          ].map((stage, i, arr) => (
            <div
              key={stage.step}
              className={`flex items-start gap-4 p-4 ${i < arr.length - 1 ? 'border-b border-border' : ''}`}
            >
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {stage.step}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{stage.agent}</p>
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                    {stage.id}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{stage.output}</p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Action: <span className="font-mono">{stage.action}</span> · Provider:{' '}
                  {stage.provider}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Phase 2 Preview */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Phase 2 — Meta Execution</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Meta Connection',
              description:
                'OAuth connection to Meta Business Manager, ad account, and Facebook Pixel.',
              href: '/tower/dogfooding/settings',
            },
            {
              title: 'Media Buyer Agent',
              description: 'marketing-media-buyer will execute campaign plans via Meta Graph API.',
              href: '/tower/dogfooding/settings',
            },
            {
              title: 'Performance Loop',
              description:
                'Analyst + Optimizer agents pull metrics and apply learnings automatically.',
              href: '/tower/dogfooding/settings',
            },
          ].map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-lg border border-dashed border-border bg-card p-4 hover:border-border/80"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{card.title}</p>
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  Phase 2
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{card.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
