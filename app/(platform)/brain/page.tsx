import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { businessBrainService } from '@/domains/business-brain'
import type { BusinessMemoryType } from '@/shared/types'

/**
 * Business Brain page — updated for Phase 2.
 *
 * Shows all stored Business Memories organized by type, plus a Business
 * Intelligence summary (patterns, gaps, cross-cutting themes) derived
 * from synthesizeInsights() — Phase 2 Milestone 3.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.3, §2.4, §2.5 — Business Brain.
 * See docs/adr/ADR-015-business-brain-intelligence.md.
 */

const TYPE_LABELS: Record<BusinessMemoryType, string> = {
  company_identity: 'Company Identity',
  brand: 'Brand Voice',
  product: 'Products',
  service: 'Services',
  pricing: 'Pricing',
  policy: 'Policies',
  sop: 'SOPs',
  customer: 'Customers',
  asset: 'Assets',
  knowledge: 'Knowledge',
  preference: 'Preferences',
  decision: 'Decisions',
}

const TYPE_ORDER: BusinessMemoryType[] = [
  'company_identity',
  'brand',
  'product',
  'service',
  'knowledge',
  'preference',
  'decision',
  'pricing',
  'policy',
  'sop',
  'customer',
  'asset',
]

export default async function BrainPage() {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  const [result, intelligenceResult] = await Promise.all([
    businessBrainService.queryMemory({
      organizationId: ctx.organizationId,
      limit: 200,
    }),
    businessBrainService.synthesizeInsights(ctx.organizationId),
  ])

  const intelligence = intelligenceResult.ok ? intelligenceResult.value : null

  if (!result.ok) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">Business Brain</h1>
        <p className="text-sm text-destructive">Could not load memories: {result.error.message}</p>
      </div>
    )
  }

  const { memories, totalCount } = result.value

  // Brain health metrics (computed from fetched memories — limit 200)
  const documentedTypeCount = new Set(memories.map((m) => m.type)).size
  const coveragePct = Math.round((documentedTypeCount / 12) * 100)
  const lastUpdatedAt =
    memories.length > 0
      ? memories.reduce(
          (latest, m) => (m.updatedAt > latest ? m.updatedAt : latest),
          memories[0].updatedAt
        )
      : null

  // Pipeline campaign topics — knowledge memories contributed by engagement runs
  const campaignTopics = memories
    .filter(
      (m) =>
        m.source.startsWith('engagement_run:') &&
        m.type === 'knowledge' &&
        typeof m.content.objective === 'string'
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10)

  // Group memories by type.
  const grouped = new Map<BusinessMemoryType, typeof memories>()
  for (const memory of memories) {
    const existing = grouped.get(memory.type) ?? []
    grouped.set(memory.type, [...existing, memory])
  }

  const presentTypes = TYPE_ORDER.filter((t) => grouped.has(t))

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Business Brain</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalCount === 0
              ? 'No memories stored yet.'
              : `${totalCount} ${totalCount === 1 ? 'memory' : 'memories'} — what your workforce knows about your business.`}
          </p>
        </div>
        {totalCount === 0 && (
          <Link
            href="/onboarding"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add context
          </Link>
        )}
      </div>

      {totalCount === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Your Business Brain is empty. Complete onboarding to give your workforce context.
          </p>
          <Link
            href="/onboarding"
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Start onboarding
          </Link>
        </div>
      ) : (
        <>
          {/* Brain Health — coverage and last updated */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <span className="text-sm font-semibold text-foreground">
              {coveragePct}% type coverage
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              {documentedTypeCount} of 12 knowledge types documented
            </span>
            {lastUpdatedAt && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">
                  Last updated {lastUpdatedAt.toLocaleDateString()}
                </span>
              </>
            )}
          </div>

          {/* Business Intelligence summary — Phase 2 Milestone 3 */}
          {intelligence && intelligence.insights.length > 0 && (
            <section className="rounded-lg border border-border bg-muted/30 p-5">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Brain Intelligence</h2>
              <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>{intelligence.trends.totalMemories} memories total</span>
                {intelligence.trends.mostDocumented && (
                  <span>
                    Strongest area:{' '}
                    <strong className="text-foreground">
                      {TYPE_LABELS[intelligence.trends.mostDocumented] ??
                        intelligence.trends.mostDocumented}
                    </strong>
                  </span>
                )}
                {intelligence.trends.undocumentedTypes.length > 0 && (
                  <span>
                    {intelligence.trends.undocumentedTypes.length} types not yet documented
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {intelligence.insights
                  .filter((i) => i.type !== 'gap')
                  .map((insight, idx) => (
                    <div
                      key={idx}
                      className={`rounded-md px-3 py-2 text-xs ${
                        insight.type === 'pattern'
                          ? 'bg-green-50 text-green-800'
                          : 'bg-blue-50 text-blue-800'
                      }`}
                    >
                      <span className="font-medium">{insight.title}:</span> {insight.finding}
                    </div>
                  ))}
                {intelligence.insights.filter((i) => i.type === 'gap').length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      {intelligence.insights.filter((i) => i.type === 'gap').length} coverage gaps
                    </summary>
                    <div className="mt-2 space-y-1">
                      {intelligence.insights
                        .filter((i) => i.type === 'gap')
                        .map((gap, idx) => (
                          <div
                            key={idx}
                            className="rounded-md bg-yellow-50 px-3 py-2 text-xs text-yellow-800"
                          >
                            {gap.finding}
                          </div>
                        ))}
                    </div>
                  </details>
                )}
              </div>
            </section>
          )}

          {/* Campaign Topics — what the AI workforce has produced content for */}
          {campaignTopics.length > 0 && (
            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="mb-1 text-sm font-semibold text-foreground">
                Campaign Topics Learned
              </h2>
              <p className="mb-3 text-xs text-muted-foreground">
                Topics your AI workforce has produced content for via the pipeline.
              </p>
              <div className="space-y-2">
                {campaignTopics.map((topic, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2"
                  >
                    <span className="text-sm text-foreground">
                      {topic.content.objective as string}
                    </span>
                    <span className="ml-4 shrink-0 text-xs text-muted-foreground">
                      {topic.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Memory list by type */}
          <div className="space-y-6">
            {presentTypes.map((type) => {
              const typeMemories = grouped.get(type)!
              return (
                <section key={type}>
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {TYPE_LABELS[type]}
                  </h2>
                  <div className="space-y-3">
                    {typeMemories.map((memory) => (
                      <div key={memory.id} className="rounded-lg border border-border bg-card p-4">
                        <div className="space-y-2">
                          {Object.entries(memory.content).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-xs font-medium capitalize text-muted-foreground">
                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                              </span>
                              <p className="mt-0.5 text-sm text-foreground">{String(value)}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center gap-3 border-t border-border pt-2">
                          <span className="text-xs text-muted-foreground">
                            Source: {memory.source}
                          </span>
                          <span className="text-xs text-muted-foreground">v{memory.version}</span>
                          <span className="text-xs text-muted-foreground">
                            {memory.updatedAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
