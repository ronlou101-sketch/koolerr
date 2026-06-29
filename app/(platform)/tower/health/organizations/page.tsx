import Link from 'next/link'
import { getOrganizationsHealthDetail } from '../health-data'
import { TowerHealthBadge } from '../../_components/TowerHealthBadge'
import { TowerHealthCalc } from '../../_components/TowerHealthCalc'
import { TowerHealthCard } from '../../_components/TowerHealthCard'
import { TowerHealthAction } from '../../_components/TowerHealthAction'

export const dynamic = 'force-dynamic'

export default async function OrganizationsHealthPage() {
  const data = await getOrganizationsHealthDetail()

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
            <span className="text-foreground">Organizations</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Active Organizations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All customer organizations provisioned on the Koolerr platform.
          </p>
        </div>
        <TowerHealthBadge status={data.overall} fetchedAt={data.fetchedAt} />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Contributing Factors</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <TowerHealthCard
            title="Active Organizations"
            status="healthy"
            value={String(data.active)}
            detail={`${data.active} organization${data.active !== 1 ? 's' : ''} with active status`}
          />
          <TowerHealthCard
            title="Inactive Organizations"
            status={data.inactive > 0 ? 'warning' : 'healthy'}
            value={String(data.inactive)}
            detail={`${data.inactive} organization${data.inactive !== 1 ? 's' : ''} not in active status`}
          />
          <TowerHealthCard
            title="New This Week"
            status="healthy"
            value={String(data.recentlyCreated)}
            detail="Organizations created in the last 7 days"
          />
          <TowerHealthCard
            title="Total"
            status="healthy"
            value={String(data.total)}
            detail={`${data.total} organization${data.total !== 1 ? 's' : ''} provisioned in total`}
          />
        </div>
      </section>

      <TowerHealthCalc
        description="Organization health reflects the count and status of provisioned customer organizations."
        rules={[
          'Healthy when the organizations table is accessible and returns results.',
          'Critical if the organizations table is inaccessible.',
          'Inactive organizations may indicate churned or misconfigured accounts — they appear as Warning.',
        ]}
      />

      <TowerHealthAction
        label="Manage Organizations"
        href="/tower/orgs"
        description="View all organizations, their subscription status, and activity."
      />
    </div>
  )
}
