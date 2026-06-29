import Link from 'next/link'
import { TowerHealthBadge } from '../../_components/TowerHealthBadge'
import { TowerHealthCalc } from '../../_components/TowerHealthCalc'

export default function ApiHealthPage() {
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
            <span className="text-foreground">API Health</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">API Health</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Response times, error rates, and availability across all platform API routes.
          </p>
        </div>
        <TowerHealthBadge status="not-configured" />
      </div>

      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
        <p className="text-sm font-medium text-foreground">No API Monitoring Configured</p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
          API health monitoring tracks response times, error rates, and availability across all
          platform routes. Connect an external monitoring service to enable this metric.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Supported integrations: Datadog, New Relic, Sentry, Uptime Robot
        </p>
      </div>

      <TowerHealthCalc
        description="API health would track the following once a monitoring service is connected:"
        rules={[
          'Healthy when all route response times are within acceptable thresholds.',
          'Warning when error rates exceed baseline or response times degrade.',
          'Critical when routes are returning 5xx errors or are unavailable.',
        ]}
      />
    </div>
  )
}
