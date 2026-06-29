import Link from 'next/link'
import { TowerHealthBadge } from '../../_components/TowerHealthBadge'
import { TowerHealthCalc } from '../../_components/TowerHealthCalc'

export default function DeploymentsHealthPage() {
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
            <span className="text-foreground">Deployments</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Recent Deployments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vercel production deployment history and rollback availability.
          </p>
        </div>
        <TowerHealthBadge status="not-configured" />
      </div>

      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
        <p className="text-sm font-medium text-foreground">Vercel API Not Connected</p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
          Deployment tracking requires the Vercel API to be connected. This would surface production
          deployment history, build status, and enable rollback from within Tower Control.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          To enable: add VERCEL_API_TOKEN and VERCEL_PROJECT_ID environment variables
        </p>
      </div>

      <TowerHealthCalc
        description="Deployment health would track the following once the Vercel API is connected:"
        rules={[
          'Healthy when the most recent deployment succeeded.',
          'Warning when a recent deployment failed or is taking longer than expected.',
          'Critical when the production deployment is in a failed state.',
        ]}
      />
    </div>
  )
}
