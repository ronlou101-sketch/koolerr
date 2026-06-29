import Link from 'next/link'
import { getUsersHealthDetail } from '../health-data'
import { TowerHealthBadge } from '../../_components/TowerHealthBadge'
import { TowerHealthCalc } from '../../_components/TowerHealthCalc'
import { TowerHealthCard } from '../../_components/TowerHealthCard'
import { TowerHealthAction } from '../../_components/TowerHealthAction'

export const dynamic = 'force-dynamic'

export default async function UsersHealthPage() {
  const data = await getUsersHealthDetail()

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
            <span className="text-foreground">Users</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Active Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All authenticated users provisioned across all organizations.
          </p>
        </div>
        <TowerHealthBadge status={data.overall} fetchedAt={data.fetchedAt} />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Contributing Factors</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TowerHealthCard
            title="Total Platform Users"
            status="healthy"
            value={String(data.total)}
            detail={`${data.total} user${data.total !== 1 ? 's' : ''} provisioned across all organizations`}
          />
        </div>
      </section>

      <TowerHealthCalc
        description="User health reflects the total count of provisioned users across all organizations."
        rules={[
          'Healthy when the users table is accessible and returns a count.',
          'Critical if the users table query fails.',
          'User count alone does not determine health — it is informational only.',
        ]}
      />

      <TowerHealthAction
        label="Manage Users"
        href="/tower/users"
        description="View all provisioned users and their organization memberships."
      />
    </div>
  )
}
