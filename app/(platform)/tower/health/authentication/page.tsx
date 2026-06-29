import Link from 'next/link'
import { getAuthHealthDetail } from '../health-data'
import { TowerHealthBadge } from '../../_components/TowerHealthBadge'
import { TowerHealthCalc } from '../../_components/TowerHealthCalc'
import { TowerHealthCard } from '../../_components/TowerHealthCard'
import { TowerHealthAction } from '../../_components/TowerHealthAction'

export const dynamic = 'force-dynamic'

export default async function AuthenticationHealthPage() {
  const data = await getAuthHealthDetail()

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
            <span className="text-foreground">Authentication</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Authentication</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Supabase Auth availability and founder session validity.
          </p>
        </div>
        <TowerHealthBadge status={data.overall} fetchedAt={data.fetchedAt} />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Contributing Factors</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TowerHealthCard
            title="Founder Email Verified"
            status="healthy"
            value="Verified"
            detail="ronlou101@gmail.com matched at Tower Control layout gate"
          />
          <TowerHealthCard
            title="Session Valid"
            status="healthy"
            value="Active"
            detail="Supabase Auth session active for this request"
          />
          <TowerHealthCard
            title="Total Platform Users"
            status="healthy"
            value={String(data.userCount)}
            detail={`${data.userCount} user${data.userCount !== 1 ? 's' : ''} provisioned across all organizations`}
            href="/tower/users"
          />
        </div>
      </section>

      <TowerHealthCalc
        description="Authentication is always Healthy when this page renders — Tower Control requires verified founder identity at the layout level. Reaching this page proves auth is operational."
        rules={[
          'Healthy when the founder email is verified and the session is active.',
          'This page is unreachable if auth fails — the Tower Control layout returns 404 for non-founder sessions.',
          'Authentication failures would prevent page load entirely rather than showing a Warning or Critical state.',
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
