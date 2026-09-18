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
 * Canonical customer-visible total is intelligence.trends.totalMemories only.
 * queryMemory is capped and must not be presented as the org total.
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
  visual_identity: 'Brand Ambassador',
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

/** UUID-shaped values lead the default Brain list with engineering residue. */
const UUID_VALUE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Dogfooding source strings are operator residue; the default view uses a plain label. */
function displayMemorySource(source: string): string {
  if (source.startsWith('dogfooding')) return 'Internal check'
  return source
}

/**
 * Soften default-view memory fields: hide UUID leads, relabel dogfooding
 * domains, and show ISO timestamps as dates instead of raw strings.
 */
function displayContentValue(value: unknown): string | null {
  const raw = String(value)
  if (UUID_VALUE.test(raw)) return null
  if (raw.startsWith('dogfooding')) return 'Internal check'
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const parsed = new Date(raw)
    return Number.isNaN(parsed.getTime()) ? raw : parsed.toLocaleDateString()
  }
  if (raw === 'running') return 'In progress'
  if (raw === 'completed') return 'Finished'
  return raw
}

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
  const canonicalTotal =
    intelligence && typeof intelligence.trends.totalMemories === 'number'
      ? intelligence.trends.totalMemories
      : null

  if (!result.ok) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">Business Brain</h1>
        <p className="text-sm text-destructive">Could not load memories: {result.error.message}</p>
      </div>
    )
  }

  const { memories } = result.value

  // Type coverage comes from intelligence when the canonical total exists.
  // The capped queryMemory list is labeled as this view only.
  const documentedTypeCount = intelligence
    ? Object.keys(intelligence.trends.countsByType).length
    : new Set(memories.map((m) => m.type)).size
  const catalogSize = intelligence
    ? documentedTypeCount + intelligence.trends.undocumentedTypes.length
    : TYPE_ORDER.length
  const coveragePct = catalogSize === 0 ? 0 : Math.round((documentedTypeCount / catalogSize) * 100)
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
  const isEmptyBrain = canonicalTotal === 0

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Business Brain</h1>
          {canonicalTotal === null ? (
            <p className="mt-1 text-sm text-destructive">
              Could not load the full Business Brain total. This page will not estimate a total from
              a partial list.
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              {canonicalTotal === 0
                ? 'No memories stored yet.'
                : `${canonicalTotal} ${canonicalTotal === 1 ? 'memory' : 'memories'} — what your workforce knows about your business.`}
            </p>
          )}
        </div>
        {isEmptyBrain && (
          <Link
            href="/onboarding"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add context
          </Link>
        )}
      </div>

      {isEmptyBrain ? (
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
              {!intelligence && ' in this view'}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              {documentedTypeCount} of {catalogSize} knowledge types documented
              {!intelligence && ' in this view'}
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
                      {insight.type === 'pattern' && (
                        <p className="mt-1 opacity-80">
                          This is a subset for this knowledge type — not a second Business Brain
                          total.
                        </p>
                      )}
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
            {canonicalTotal !== null && memories.length > 0 && memories.length < canonicalTotal && (
              <p className="text-xs text-muted-foreground">
                Showing {memories.length} memories in this view — not a second total.
              </p>
            )}
            {presentTypes.map((type) => {
              const typeMemories = grouped.get(type)!
              return (
                <section key={type}>
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {TYPE_LABELS[type]}
                  </h2>
                  <div className="space-y-3">
                    {typeMemories.map((memory) => {
                      const visibleEntries = Object.entries(memory.content)
                        .map(([key, value]) => [key, displayContentValue(value)] as const)
                        .filter((entry): entry is readonly [string, string] => entry[1] !== null)
                      return (
                        <div
                          key={memory.id}
                          className="rounded-lg border border-border bg-card p-4"
                        >
                          <div className="space-y-2">
                            {visibleEntries.length === 0 ? (
                              <p className="text-sm text-muted-foreground">Stored system record.</p>
                            ) : (
                              visibleEntries.map(([key, value]) => (
                                <div key={key}>
                                  <span className="text-xs font-medium capitalize text-muted-foreground">
                                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                  </span>
                                  <p className="mt-0.5 text-sm text-foreground">{value}</p>
                                </div>
                              ))
                            )}
                          </div>
                          <div className="mt-3 flex items-center gap-3 border-t border-border pt-2">
                            <span className="text-xs text-muted-foreground">
                              Source: {displayMemorySource(memory.source)}
                            </span>
                            <span className="text-xs text-muted-foreground">v{memory.version}</span>
                            <span className="text-xs text-muted-foreground">
                              {memory.updatedAt.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )
                    })}
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
