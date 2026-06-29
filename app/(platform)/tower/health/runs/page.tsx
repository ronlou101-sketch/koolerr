import Link from 'next/link'
import { getRunsHealthDetail } from '../health-data'
import { TowerHealthBadge } from '../../_components/TowerHealthBadge'
import { TowerHealthCalc } from '../../_components/TowerHealthCalc'
import { TowerHealthCard } from '../../_components/TowerHealthCard'
import { TowerHealthAction } from '../../_components/TowerHealthAction'

export const dynamic = 'force-dynamic'

export default async function RunsHealthPage() {
  const data = await getRunsHealthDetail()

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/tower" className="hover:text-foreground">
              Tower Control
            </Link>
            <span>/</span>
            <Link href="/tower/health" className="hover:text-foreground">
              System Health
            </Link>
            <span>/</span>
            <span className="text-foreground">Engagement Runs</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Engagement Runs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI Workforce execution status across all organizations.
          </p>
        </div>
        <TowerHealthBadge status={data.overall} fetchedAt={data.fetchedAt} />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Status Breakdown</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <TowerHealthCard
            title="Running"
            status="healthy"
            value={String(data.running)}
            detail="Engagement Runs currently in progress"
          />
          <TowerHealthCard
            title="Pending"
            status="healthy"
            value={String(data.pending)}
            detail="Engagement Runs queued and waiting to start"
          />
          <TowerHealthCard
            title="Awaiting Approval"
            status="healthy"
            value={String(data.awaitingApproval)}
            detail="Deliverables pending customer review"
          />
          <TowerHealthCard
            title="Completed"
            status="healthy"
            value={String(data.completed)}
            detail="Successfully completed Engagement Runs"
          />
          <TowerHealthCard
            title="Failed"
            status={data.failed > 0 ? 'warning' : 'healthy'}
            value={String(data.failed)}
            detail={
              data.failed > 0
                ? `${data.failed} run${data.failed !== 1 ? 's' : ''} did not complete successfully`
                : 'No failed runs'
            }
          />
          <TowerHealthCard
            title="Rejected"
            status="healthy"
            value={String(data.rejected)}
            detail="Runs rejected by customers during review"
          />
          <TowerHealthCard
            title="Total All Time"
            status="healthy"
            value={String(data.total)}
            detail="Total Engagement Runs across all organizations"
          />
        </div>
      </section>

      <TowerHealthCalc
        description="Engagement Run health reflects the execution reliability of AI Workforce tasks across all organizations."
        rules={[
          'Healthy when no runs have failed status.',
          'Warning when failed runs exist — each failed run represents an incomplete AI task that may require investigation.',
          'Rejected runs are not counted as failures — they represent customer decisions during the approval workflow.',
          'Critical if the engagement_runs table is inaccessible.',
        ]}
      />

      <TowerHealthAction
        label="Manage Runs"
        href="/tower/runs"
        description="View all Engagement Runs, their status, and deliverable outputs."
      />
    </div>
  )
}
