import Link from 'next/link'
import { getDatabaseHealthDetail } from '../health-data'
import { TowerHealthBadge } from '../../_components/TowerHealthBadge'
import { TowerHealthCalc } from '../../_components/TowerHealthCalc'
import { TowerHealthCard } from '../../_components/TowerHealthCard'

export const dynamic = 'force-dynamic'

export default async function DatabaseHealthPage() {
  const data = await getDatabaseHealthDetail()

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
            <span className="text-foreground">Database</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Database</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Core table accessibility and row counts across all platform schemas.
          </p>
        </div>
        <TowerHealthBadge status={data.overall} fetchedAt={data.fetchedAt} />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Contributing Factors</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.tables.map((table) => (
            <TowerHealthCard
              key={table.name}
              title={table.name}
              status={table.accessible ? 'healthy' : 'critical'}
              value={table.accessible ? String(table.count ?? 0) : 'Error'}
              detail={
                table.accessible ? `${table.count ?? 0} rows accessible` : 'Table query failed'
              }
            />
          ))}
        </div>
      </section>

      <TowerHealthCalc
        description="Database status is derived from the accessibility of all core platform tables using the service-role connection."
        rules={[
          'Healthy when all core table queries succeed without errors.',
          'Critical if any table is inaccessible — this indicates a database connection failure or misconfigured RLS policy.',
          'Row counts are informational and do not affect health status.',
        ]}
      />
    </div>
  )
}
