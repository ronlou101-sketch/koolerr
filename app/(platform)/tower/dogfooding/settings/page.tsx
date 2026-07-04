import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSessionServerClient } from '@/shared/lib/supabase-session'

export const dynamic = 'force-dynamic'

export default async function DogfoodingSettingsPage() {
  const supabase = await createSessionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user?.email !== 'ronlou101@gmail.com') notFound()

  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/tower" className="hover:text-foreground">
            Tower Control
          </Link>
          <span>/</span>
          <Link href="/tower/dogfooding" className="hover:text-foreground">
            Dogfooding
          </Link>
          <span>/</span>
          <span className="text-foreground">Settings</span>
        </div>
        <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Dogfooding Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Phase 2 integrations — Meta Business Manager, performance targets, and optimization rules.
        </p>
      </div>

      {/* Meta Integration */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Meta Business Integration</h2>
        <div className="rounded-lg border border-dashed border-border bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Facebook & Instagram Ads</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect your Meta Business Manager to enable autonomous ad execution. The
                marketing-media-buyer agent will create and manage campaigns via the Meta Graph API.
              </p>
            </div>
            <span className="flex-shrink-0 rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              Phase 2
            </span>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-md bg-muted/50 p-4">
              <p className="text-xs font-medium text-foreground">Required credentials</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>· META_APP_ID — Facebook App ID</li>
                <li>· META_APP_SECRET — Facebook App Secret</li>
                <li>· META_AD_ACCOUNT_ID — Ad Account ID (act_xxxxxxxxx)</li>
                <li>· META_PAGE_ID — Facebook Page ID</li>
                <li>· META_PIXEL_ID — Facebook Pixel ID (optional but recommended)</li>
              </ul>
            </div>
            <button
              disabled
              className="cursor-not-allowed rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground opacity-50"
            >
              Connect Meta — Available in Phase 2
            </button>
          </div>
        </div>
      </section>

      {/* Agent Registry */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Internal Marketing Agents</h2>
        <div className="overflow-hidden rounded-lg border border-border">
          {[
            { id: 'marketing-cmo', phase: '1', role: 'Creates marketing plans' },
            { id: 'marketing-researcher', phase: '1', role: 'ICP and market research' },
            { id: 'marketing-strategist', phase: '1', role: 'Campaign strategy' },
            { id: 'marketing-copywriter', phase: '1', role: 'Ad copy variants' },
            {
              id: 'marketing-creative-director',
              phase: '1',
              role: 'Creative direction + Higgsfield prompts',
            },
            { id: 'marketing-media-buyer', phase: '2', role: 'Meta API campaign execution' },
            { id: 'marketing-analyst', phase: '2', role: 'Performance analytics and reporting' },
            {
              id: 'marketing-optimizer',
              phase: '2',
              role: 'Campaign optimisation and A/B testing',
            },
          ].map((agent, i, arr) => (
            <div
              key={agent.id}
              className={`flex items-center justify-between gap-4 p-4 ${i < arr.length - 1 ? 'border-b border-border' : ''}`}
            >
              <div>
                <p className="font-mono text-xs text-foreground">{agent.id}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{agent.role}</p>
              </div>
              <span
                className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                  agent.phase === '1'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                Phase {agent.phase}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
