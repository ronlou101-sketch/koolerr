import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { approvalWorkflowService } from '@/shared/approval'
import { deliverablesService } from '@/domains/deliverables'
import { resolveReviewFormAction } from './actions'

interface Props {
  searchParams: Promise<{ resolved?: string }>
}

const TYPE_LABELS: Record<string, string> = {
  video_script: 'Video script',
  video: 'Video',
  image: 'Image',
  blog_post: 'Blog post',
  advertisement: 'Advertisement',
  email: 'Email',
  proposal: 'Proposal',
  report: 'Report',
  strategy: 'Strategy',
  customer_response: 'Customer response',
}

const SEND_BACK_REASONS = ['Off-brand', 'Wrong audience', 'Change the wording', 'Other'] as const

type ReviewItem =
  | { kind: 'action'; id: string; label: string; detail: string; expiresAt?: Date }
  | { kind: 'deliverable'; id: string; title: string; typeLabel: string }

/**
 * Review — the single place a customer says yes to finished work.
 *
 * Unifies two existing sources into one queue: proposed Digital-Employee
 * actions (ApprovalRequests) and deliverables awaiting review. Presentation +
 * aggregation only — decisions are handled by the existing services via
 * resolveReviewFormAction. One item is in focus at a time; the rest are listed
 * as "up next" so the customer makes one decision at a time.
 */
export default async function ReviewPage({ searchParams }: Props) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  const { resolved } = await searchParams

  const [approvalsResult, deliverablesResult] = await Promise.all([
    approvalWorkflowService.listPending(ctx.organizationId, ctx.tenantId),
    deliverablesService.listDeliverables({ organizationId: ctx.organizationId }),
  ])

  const pendingActions = approvalsResult.ok ? approvalsResult.value : []
  const pendingDeliverables = (deliverablesResult.ok ? deliverablesResult.value : []).filter(
    (d) => d.status === 'pending_review'
  )

  const items: ReviewItem[] = [
    ...pendingActions.map((a) => ({
      kind: 'action' as const,
      id: a.id,
      label: a.action.replace(/_/g, ' '),
      detail: a.description,
      expiresAt: a.expiresAt,
    })),
    ...pendingDeliverables.map((d) => ({
      kind: 'deliverable' as const,
      id: d.id,
      title: d.title,
      typeLabel: TYPE_LABELS[d.type] ?? d.type,
    })),
  ]

  const focus = items[0]
  const upNext = items.slice(1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Review</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Give the final yes on the work your team has finished.
        </p>
      </div>

      {resolved && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            resolved === 'approved'
              ? 'bg-green-50 text-green-700'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {resolved === 'approved'
            ? 'Approved — nice work.'
            : 'Sent back — your team will revise it.'}
        </div>
      )}

      {!focus ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            You&apos;re all caught up — nothing&apos;s waiting on you.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            I&apos;ll bring things here as soon as they&apos;re ready for your yes.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-xs font-medium text-muted-foreground">
            Ready for your review — {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>

          {/* Focus item */}
          <div className="rounded-lg border border-yellow-200 bg-card p-5">
            {focus.kind === 'action' ? (
              <div>
                <span className="inline-block rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium capitalize text-yellow-700">
                  {focus.label}
                </span>
                <p className="mt-2 text-sm font-medium text-foreground">{focus.detail}</p>
                {focus.expiresAt && (
                  <p className="mt-1 text-xs text-yellow-600">
                    Please decide by {focus.expiresAt.toLocaleDateString()}.
                  </p>
                )}
              </div>
            ) : (
              <div>
                <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {focus.typeLabel}
                </span>
                <p className="mt-2 text-sm font-medium text-foreground">{focus.title}</p>
                <Link
                  href={`/deliverables/${focus.id}`}
                  className="mt-1 inline-block text-xs text-primary hover:underline"
                >
                  Open to view →
                </Link>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-start gap-3 border-t border-border pt-4">
              {/* Approve */}
              <form action={resolveReviewFormAction}>
                <input type="hidden" name="kind" value={focus.kind} />
                <input type="hidden" name="id" value={focus.id} />
                <input type="hidden" name="decision" value="approved" />
                <button
                  type="submit"
                  className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  Approve
                </button>
              </form>

              {/* Send back (with reason chips) */}
              <details className="group">
                <summary className="cursor-pointer rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                  Send back
                </summary>
                <form action={resolveReviewFormAction} className="mt-3 space-y-3">
                  <input type="hidden" name="kind" value={focus.kind} />
                  <input type="hidden" name="id" value={focus.id} />
                  <input type="hidden" name="decision" value="rejected" />
                  <fieldset>
                    <legend className="text-xs text-muted-foreground">
                      What should we change? (optional)
                    </legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {SEND_BACK_REASONS.map((reason) => (
                        <label
                          key={reason}
                          className="cursor-pointer rounded-full border border-border px-3 py-1 text-xs text-muted-foreground has-[:checked]:border-foreground has-[:checked]:font-medium has-[:checked]:text-foreground"
                        >
                          <input type="radio" name="reason" value={reason} className="sr-only" />
                          {reason}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <button
                    type="submit"
                    className="rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2"
                  >
                    Send it back
                  </button>
                </form>
              </details>
            </div>
          </div>

          {/* Up next */}
          {upNext.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Up next ({upNext.length})
              </p>
              <div className="divide-y divide-border rounded-lg border border-border bg-card">
                {upNext.map((item) => (
                  <div key={item.id} className="px-4 py-3">
                    <p className="truncate text-sm text-foreground">
                      {item.kind === 'action' ? item.detail : item.title}
                    </p>
                    <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                      {item.kind === 'action' ? item.label : item.typeLabel}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
