import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { businessBrainService } from '@/domains/business-brain'
import type { BusinessMemoryType } from '@/shared/types'

/**
 * Business Brain page.
 *
 * Shows all stored Business Memories organized by type. This is the
 * customer's view into what their workforce knows about the business.
 * Read-only in Phase 1 — editing and memory management are Phase 2 scope.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.3, §2.4 — Business Brain.
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

  const result = await businessBrainService.queryMemory({
    organizationId: ctx.organizationId,
    limit: 200,
  })

  if (!result.ok) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">Business Brain</h1>
        <p className="text-sm text-destructive">Could not load memories: {result.error.message}</p>
      </div>
    )
  }

  const { memories, totalCount } = result.value

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
      )}
    </div>
  )
}
