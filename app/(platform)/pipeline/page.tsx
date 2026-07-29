import Link from 'next/link'
import { CampaignCreator } from '../_components/campaign-creator'

/**
 * /pipeline — preserved for backward compatibility (Experience Phase 13 Slice C).
 *
 * "Pipeline" is no longer an everyday navigation destination; customers create
 * campaigns from the Campaigns page via the "New campaign" modal. This route
 * still resolves and renders the same creation flow (now the shared
 * CampaignCreator) so existing links and bookmarks keep working.
 */
export default function PipelinePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Start a campaign</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell me what you&apos;d like your marketing to accomplish, and I&apos;ll take it from
          there.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <CampaignCreator />
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-xs font-medium text-foreground">What you&apos;ll get</p>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>A content plan tailored to your business and audience</li>
          <li>Ready-to-post captions, hashtags, and a posting schedule</li>
          <li>Images and video for your posts</li>
          <li>A summary you can review before anything goes out</li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          <Link href="/runs" className="text-primary hover:underline">
            See your campaigns →
          </Link>
        </p>
      </div>
    </div>
  )
}
