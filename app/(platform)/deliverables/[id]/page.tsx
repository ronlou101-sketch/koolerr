import { notFound, redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { deliverablesService } from '@/domains/deliverables'
import type { DeliverableId } from '@/shared/types'
import { approveDeliverable, rejectDeliverable } from './actions'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ approved?: string; rejected?: string }>
}

const STATUS_LABELS = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  published: 'Published',
} as const

const STATUS_COLORS = {
  draft: 'bg-muted text-muted-foreground',
  pending_review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-destructive/10 text-destructive',
  published: 'bg-green-100 text-green-700',
} as const

/**
 * Deliverable review page.
 * Customers read the output produced by their Content Workforce and
 * approve or reject it before it is considered complete.
 */
export default async function DeliverablePage({ params, searchParams }: Props) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  const { id } = await params
  const { approved, rejected } = await searchParams

  const result = await deliverablesService.getDeliverable(id as DeliverableId, ctx.organizationId)

  if (!result.ok) notFound()

  const deliverable = result.value
  const body = deliverable.content.body as string | undefined
  const brief = deliverable.content.contentBrief as string | undefined
  const draft = deliverable.content.draft as string | undefined

  const isPendingReview = deliverable.status === 'pending_review'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{deliverable.title}</h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{deliverable.id}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[deliverable.status]}`}
        >
          {STATUS_LABELS[deliverable.status]}
        </span>
      </div>

      {(approved || rejected) && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            approved ? 'bg-green-50 text-green-700' : 'bg-destructive/10 text-destructive'
          }`}
        >
          {approved
            ? 'Deliverable approved. Well done, workforce!'
            : 'Deliverable rejected. The team will be notified.'}
        </div>
      )}

      {body && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-foreground">Final Content</h2>
          <div className="rounded-lg border border-border bg-card p-4">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {body}
            </pre>
          </div>
        </section>
      )}

      {brief && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
            Content Brief (strategist output)
          </summary>
          <div className="mt-2 rounded-lg border border-border bg-muted/30 p-4">
            <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
              {brief}
            </pre>
          </div>
        </details>
      )}

      {draft && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
            First Draft (copywriter output)
          </summary>
          <div className="mt-2 rounded-lg border border-border bg-muted/30 p-4">
            <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
              {draft}
            </pre>
          </div>
        </details>
      )}

      {isPendingReview && (
        <section className="space-y-4 rounded-lg border border-border bg-card p-6">
          <h2 className="text-sm font-medium text-foreground">Your Decision</h2>
          <div className="flex flex-wrap gap-3">
            <form action={approveDeliverable.bind(null, deliverable.id)}>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Approve
              </button>
            </form>

            <form
              action={async (formData: FormData) => {
                'use server'
                const feedback = formData.get('feedback') as string
                await rejectDeliverable(deliverable.id, feedback)
              }}
              className="flex items-center gap-2"
            >
              <input
                name="feedback"
                type="text"
                placeholder="Rejection reason (optional)"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="submit"
                className="rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2"
              >
                Reject
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  )
}
