import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { deliverablesService } from '@/domains/deliverables'
import type { Deliverable } from '@/shared/types'
import { partitionDeliverables } from './_lib/partition'
import { EmptyState } from '../_components/empty-state'

const TYPE_LABELS: Record<string, string> = {
  video_script: 'Video Script',
  video: 'Video',
  image: 'Image',
  blog_post: 'Blog Post',
  advertisement: 'Advertisement',
  email: 'Email',
  proposal: 'Proposal',
  report: 'Report',
  strategy: 'Strategy',
  hiring_packet: 'Hiring Packet',
  customer_response: 'Customer Response',
  implementation_plan: 'Implementation Plan',
  code_review: 'Code Review',
  milestone_report: 'Milestone Report',
  blocker_report: 'Blocker Report',
  coordination_brief: 'Coordination Brief',
  github_issue_draft: 'GitHub Issue Draft',
  v1_readiness_report: 'V1 Readiness Report',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-destructive/10 text-destructive',
  published: 'bg-green-100 text-green-700',
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? 'bg-muted text-muted-foreground'
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {TYPE_LABELS[type] ?? type}
    </span>
  )
}

function DeliverableRow({ d }: { d: Deliverable }) {
  const date = new Date(d.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link
      href={`/deliverables/${d.id}`}
      className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-5 py-4 transition-colors hover:bg-muted/40"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{d.title}</p>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{d.id}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <TypeBadge type={d.type} />
        <StatusBadge status={d.status} />
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
    </Link>
  )
}

function Section({
  title,
  deliverables,
  empty,
}: {
  title: string
  deliverables: Deliverable[]
  empty: string
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">
        {title}
        {deliverables.length > 0 && (
          <span className="ml-1.5 text-muted-foreground">({deliverables.length})</span>
        )}
      </h2>
      {deliverables.length === 0 ? (
        <EmptyState message={empty} />
      ) : (
        <div className="space-y-2">
          {deliverables.map((d) => (
            <DeliverableRow key={d.id} d={d} />
          ))}
        </div>
      )}
    </section>
  )
}

export default async function DeliverablesPage() {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  const result = await deliverablesService.listDeliverables({
    organizationId: ctx.organizationId,
  })

  const all = result.ok ? result.value : []
  const { scripts, videos, images, documents } = partitionDeliverables(all)

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Deliverables</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything your AI workforce produces — scripts, images, videos, and reports.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/creative"
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Generate Image
          </Link>
        </div>
      </div>

      <Section
        title="Video Scripts"
        deliverables={scripts}
        empty="No video scripts yet. Launch the pipeline to generate scripts."
      />

      <Section
        title="Videos"
        deliverables={videos}
        empty="No videos yet. Open a Video Script and click Generate Video."
      />

      <Section
        title="Images"
        deliverables={images}
        empty="No images yet. Use the Generate Image button above."
      />

      <Section
        title="Reports & Documents"
        deliverables={documents}
        empty="No reports or documents yet. Completed pipeline runs deliver them here."
      />
    </div>
  )
}
