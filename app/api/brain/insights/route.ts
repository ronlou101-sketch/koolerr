import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { businessBrainService } from '@/domains/business-brain'

const TOTAL_MEMORY_TYPES = 12

/**
 * GET /api/brain/insights
 *
 * Returns on-demand Brain health metrics and pipeline campaign topics.
 * Calls synthesizeInsights() and listAllMemories() in parallel.
 * Used by the dashboard Brain health widget and the /brain intelligence layer.
 */
export async function GET() {
  const ctx = await getRequestPlatformContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [insightResult, memoriesResult] = await Promise.all([
    businessBrainService.synthesizeInsights(ctx.organizationId),
    businessBrainService.listAllMemories(ctx.organizationId),
  ])

  if (!insightResult.ok) {
    return NextResponse.json({ error: insightResult.error.message }, { status: 500 })
  }
  if (!memoriesResult.ok) {
    return NextResponse.json({ error: memoriesResult.error.message }, { status: 500 })
  }

  const report = insightResult.value
  const memories = memoriesResult.value

  const documentedTypeCount = Object.keys(report.trends.countsByType).length
  const coveragePct = Math.round((documentedTypeCount / TOTAL_MEMORY_TYPES) * 100)

  const lastUpdatedAt =
    memories.length > 0
      ? memories
          .reduce(
            (latest, m) => (m.updatedAt > latest ? m.updatedAt : latest),
            memories[0].updatedAt
          )
          .toISOString()
      : null

  const campaignTopics = memories
    .filter(
      (m) =>
        m.source.startsWith('engagement_run:') &&
        m.type === 'knowledge' &&
        typeof m.content.objective === 'string'
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10)
    .map((m) => ({
      objective: m.content.objective as string,
      createdAt: m.createdAt.toISOString(),
    }))

  return NextResponse.json({
    totalMemories: report.trends.totalMemories,
    coveragePct,
    lastUpdatedAt,
    mostDocumented: report.trends.mostDocumented,
    insights: report.insights.map((i) => ({ type: i.type, title: i.title, finding: i.finding })),
    campaignTopics,
  })
}
