import Link from 'next/link'
import { getPredictionData } from './prediction-data'
import type {
  Prediction,
  TimeHorizon,
  CompanyMomentum,
  ForecastedWorkload,
} from './prediction-data'

export const dynamic = 'force-dynamic'

const PRIORITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  low: 'bg-muted text-muted-foreground',
}

const PRIORITY_BORDER: Record<string, string> = {
  critical: 'border-red-200 dark:border-red-800',
  high: 'border-amber-200 dark:border-amber-800',
  medium: 'border-border',
  low: 'border-border',
}

const RISK_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  low: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
}

const HORIZON_LABEL: Record<TimeHorizon, string> = {
  today: 'Today',
  'this-week': 'This Week',
  'next-week': 'Next Week',
  'this-month': 'This Month',
  'next-month': 'Next Month',
  'next-quarter': 'Next Quarter',
}

const MOMENTUM_CONFIG: Record<CompanyMomentum, { label: string; color: string; dot: string }> = {
  accelerating: {
    label: 'Accelerating',
    color: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  growing: {
    label: 'Growing',
    color: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-400',
  },
  stable: {
    label: 'Stable',
    color: 'text-foreground',
    dot: 'bg-muted-foreground/40',
  },
  slowing: {
    label: 'Slowing',
    color: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-400',
  },
  declining: {
    label: 'Declining',
    color: 'text-red-700 dark:text-red-400',
    dot: 'bg-destructive',
  },
}

const WORKLOAD_CONFIG: Record<ForecastedWorkload, { label: string; badge: string }> = {
  light: {
    label: 'Light',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
  moderate: {
    label: 'Moderate',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  },
  heavy: {
    label: 'Heavy',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  },
  overloaded: {
    label: 'Overloaded',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  },
}

function confidenceColor(n: number): string {
  if (n >= 80) return 'text-emerald-700 dark:text-emerald-400'
  if (n >= 60) return 'text-amber-700 dark:text-amber-400'
  return 'text-red-700 dark:text-red-400'
}

function ConfBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full ${value >= 75 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

function PredCard({ pred }: { pred: Prediction }) {
  return (
    <div className={`rounded-lg border bg-card p-4 ${PRIORITY_BORDER[pred.priority]}`}>
      <div className="flex flex-wrap items-start gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[pred.priority]}`}
        >
          {pred.priority}
        </span>
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {HORIZON_LABEL[pred.timeHorizon]}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${RISK_BADGE[pred.riskLevel]}`}
        >
          {pred.riskLevel} risk
        </span>
        <span
          className={`ml-auto text-xs font-medium tabular-nums ${confidenceColor(pred.confidence)}`}
        >
          {pred.confidence}% confidence
        </span>
      </div>

      <p className="mt-2 text-sm font-medium text-foreground">{pred.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{pred.description}</p>

      <p className="mt-2 text-xs text-foreground">
        <span className="font-medium">Business Impact: </span>
        {pred.businessImpact}
      </p>

      <p className="mt-1 text-xs text-foreground">
        <span className="font-medium">Next Step: </span>
        {pred.recommendedNextStep}
      </p>

      {pred.supportingSignals.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {pred.supportingSignals.map((signal, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {signal}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Agent: {pred.suggestedAgent}</span>
        {pred.requiresFounderApproval && (
          <Link
            href="/tower/approvals"
            className="ml-auto text-xs font-medium text-amber-700 hover:underline dark:text-amber-400"
          >
            Requires approval →
          </Link>
        )}
      </div>
    </div>
  )
}

function EmptyForecast({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-5 text-center">
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  )
}

export default async function PredictionsPage() {
  const data = await getPredictionData()

  const briefTime = new Date(data.generatedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  const momentumCfg = MOMENTUM_CONFIG[data.companyMomentum]

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/tower" className="hover:text-foreground">
              Tower Control
            </Link>
            <span>/</span>
            <span className="text-foreground">Predictive Intelligence</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">
            Predictive Intelligence Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Forward-looking forecasts derived from live platform signals — updated on every load
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Generated {briefTime} · Refreshes on load</p>
      </div>

      {/* Forecast Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: 'Forecast Confidence',
            value: `${data.overallForecastConfidence}%`,
            color: confidenceColor(data.overallForecastConfidence),
          },
          {
            label: 'Company Momentum',
            value: momentumCfg.label,
            color: momentumCfg.color,
          },
          {
            label: 'Emerging Risks',
            value: data.emergingRisks.length,
            color:
              data.emergingRisks.length > 0 ? 'text-red-700 dark:text-red-400' : 'text-foreground',
          },
          {
            label: 'Emerging Opportunities',
            value: data.emergingOpportunities.length,
            color:
              data.emergingOpportunities.length > 0
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-muted-foreground',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className={`mt-2 text-xl font-semibold tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Business Trajectory */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Business Trajectory</h2>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${momentumCfg.dot}`} />
            <span className={`text-sm font-semibold ${momentumCfg.color}`}>
              {momentumCfg.label}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-foreground">{data.businessTrajectory}</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: 'Weekly Focus', text: data.predictedWeeklyFocus },
              { label: 'Monthly Focus', text: data.predictedMonthlyFocus },
              { label: 'Quarter Outlook', text: data.predictedQuarterOutlook },
            ].map(({ label, text }) => (
              <div key={label} className="rounded-md border border-border/50 bg-muted/20 p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
                <p className="text-xs leading-relaxed text-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Executive Forecast */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Executive Forecast</h2>
        {data.executiveForecast.length === 0 ? (
          <EmptyForecast message="No executive-level predictions at this time." />
        ) : (
          <div className="space-y-3">
            {data.executiveForecast.map((p) => (
              <PredCard key={p.id} pred={p} />
            ))}
          </div>
        )}
      </section>

      {/* Revenue Forecast */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Revenue Forecast</h2>
        {data.revenueForecast.length === 0 ? (
          <EmptyForecast message="No revenue predictions at this time." />
        ) : (
          <div className="space-y-3">
            {data.revenueForecast.map((p) => (
              <PredCard key={p.id} pred={p} />
            ))}
          </div>
        )}
      </section>

      {/* Growth Forecast */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Growth Forecast</h2>
        {data.growthForecast.length === 0 ? (
          <EmptyForecast message="No growth predictions at this time." />
        ) : (
          <div className="space-y-3">
            {data.growthForecast.map((p) => (
              <PredCard key={p.id} pred={p} />
            ))}
          </div>
        )}
      </section>

      {/* Operations Forecast */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Operations Forecast</h2>
        {data.operationalForecast.length === 0 ? (
          <EmptyForecast message="No operational predictions at this time." />
        ) : (
          <div className="space-y-3">
            {data.operationalForecast.map((p) => (
              <PredCard key={p.id} pred={p} />
            ))}
          </div>
        )}
      </section>

      {/* Support Forecast */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Support Forecast</h2>
        {data.supportForecast.length === 0 ? (
          <EmptyForecast message="No support predictions at this time." />
        ) : (
          <div className="space-y-3">
            {data.supportForecast.map((p) => (
              <PredCard key={p.id} pred={p} />
            ))}
          </div>
        )}
      </section>

      {/* Engineering Forecast */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Engineering Forecast</h2>
        {data.engineeringForecast.length === 0 ? (
          <EmptyForecast message="No engineering predictions at this time." />
        ) : (
          <div className="space-y-3">
            {data.engineeringForecast.map((p) => (
              <PredCard key={p.id} pred={p} />
            ))}
          </div>
        )}
      </section>

      {/* AI Workforce Forecast */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">AI Workforce Forecast</h2>
        {data.workforceForecast.length === 0 ? (
          <EmptyForecast message="No workforce predictions at this time." />
        ) : (
          <div className="space-y-3">
            {data.workforceForecast.map((p) => (
              <PredCard key={p.id} pred={p} />
            ))}
          </div>
        )}
      </section>

      {/* Approval Forecast */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Approval Forecast</h2>
        {data.approvalForecast.length === 0 ? (
          <EmptyForecast message="No approval predictions at this time." />
        ) : (
          <div className="space-y-3">
            {data.approvalForecast.map((p) => (
              <PredCard key={p.id} pred={p} />
            ))}
          </div>
        )}
      </section>

      {/* Risk Forecast */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Risk Forecast</h2>
        {data.riskForecast.length === 0 ? (
          <EmptyForecast message="No risk predictions at this time." />
        ) : (
          <div className="space-y-3">
            {data.riskForecast.map((p) => (
              <PredCard key={p.id} pred={p} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Bottlenecks */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Upcoming Bottlenecks</h2>
        {data.upcomingBottlenecks.length === 0 ? (
          <EmptyForecast message="No bottlenecks predicted — platform is flowing." />
        ) : (
          <div className="space-y-3">
            {data.upcomingBottlenecks.map((p) => (
              <PredCard key={p.id} pred={p} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Opportunities */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Upcoming Opportunities</h2>
        {data.upcomingOpportunities.length === 0 ? (
          <EmptyForecast message="No opportunities identified yet." />
        ) : (
          <div className="space-y-3">
            {data.upcomingOpportunities.map((p) => (
              <PredCard key={p.id} pred={p} />
            ))}
          </div>
        )}
      </section>

      {/* Forecast Timeline */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Forecast Timeline</h2>
        {data.forecastTimeline.length === 0 ? (
          <EmptyForecast message="No forecast timeline available." />
        ) : (
          <div className="space-y-3">
            {data.forecastTimeline.map((event) => (
              <div key={event.timeHorizon} className="rounded-lg border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">{event.label}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${confidenceColor(event.confidence)}`}>
                      {event.confidence}% avg confidence
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {event.predictions.length} prediction
                      {event.predictions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <ConfBar value={event.confidence} />
                <div className="mt-3 space-y-1.5">
                  {event.predictions.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                          p.priority === 'critical'
                            ? 'bg-red-500'
                            : p.priority === 'high'
                              ? 'bg-amber-400'
                              : 'bg-muted-foreground/40'
                        }`}
                      />
                      <p className="text-xs text-foreground">{p.title}</p>
                    </div>
                  ))}
                  {event.predictions.length > 3 && (
                    <p className="pl-3.5 text-xs text-muted-foreground">
                      +{event.predictions.length - 3} more prediction
                      {event.predictions.length - 3 !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Confidence Distribution */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Confidence Distribution</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: 'High Confidence',
              note: '≥75%',
              value: data.confidenceDistribution.high,
              color: 'text-emerald-700 dark:text-emerald-400',
            },
            {
              label: 'Medium Confidence',
              note: '50–74%',
              value: data.confidenceDistribution.medium,
              color: 'text-amber-700 dark:text-amber-400',
            },
            {
              label: 'Low Confidence',
              note: '<50%',
              value: data.confidenceDistribution.low,
              color: 'text-red-700 dark:text-red-400',
            },
          ].map(({ label, note, value, color }) => (
            <div key={label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className={`mt-2 text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{note}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Overall Forecast Confidence</p>
            <span
              className={`text-xs font-semibold ${confidenceColor(data.overallForecastConfidence)}`}
            >
              {data.overallForecastConfidence}%
            </span>
          </div>
          <ConfBar value={data.overallForecastConfidence} />
          <p className="mt-2 text-xs text-muted-foreground">
            Confidence is derived from signal strength, data completeness, and historical pattern
            reliability. Low confidence predictions indicate emerging signals with insufficient
            data.
          </p>
        </div>
      </section>

      {/* AI Workforce Prediction Breakdown */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Agent Capacity Forecast</h2>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Agent
                </th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                  Domain
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Capacity
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Workload
                </th>
                <th className="hidden px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.agentForecasts.map((agent) => {
                const wlCfg = WORKLOAD_CONFIG[agent.forecastedWorkload]
                return (
                  <tr key={agent.agentId}>
                    <td className="px-4 py-3 text-xs font-medium text-foreground">
                      {agent.agentName}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                      {agent.domain}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-xs font-semibold ${confidenceColor(agent.predictedCapacity)}`}
                      >
                        {agent.predictedCapacity}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${wlCfg.badge}`}
                      >
                        {wlCfg.label}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-right text-xs text-muted-foreground md:table-cell">
                      {agent.trendForecast}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* Per-agent details */}
        <div className="space-y-2">
          {data.agentForecasts
            .filter(
              (a) =>
                a.expectedBottlenecks[0] !== 'No predicted bottlenecks' ||
                a.futureDelegationOpportunities[0] !== 'No delegation gaps identified'
            )
            .slice(0, 3)
            .map((agent) => (
              <div key={agent.agentId} className="rounded-lg border border-border bg-card p-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground">{agent.agentName}</p>
                  <span
                    className={`text-xs text-muted-foreground ${confidenceColor(agent.predictionConfidence)}`}
                  >
                    {agent.predictionConfidence}% confidence
                  </span>
                </div>
                {agent.expectedBottlenecks[0] !== 'No predicted bottlenecks' && (
                  <div className="mb-1">
                    <p className="text-xs text-muted-foreground">
                      Bottleneck: {agent.expectedBottlenecks[0]}
                    </p>
                  </div>
                )}
                {agent.futureDelegationOpportunities[0] !== 'No delegation gaps identified' && (
                  <p className="text-xs text-muted-foreground">
                    Delegation: {agent.futureDelegationOpportunities[0]}
                  </p>
                )}
              </div>
            ))}
        </div>
      </section>

      {/* Prediction History placeholder */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Prediction History</h2>
        <div className="rounded-lg border border-dashed border-border bg-card px-4 py-5">
          <p className="text-sm text-muted-foreground">Prediction history requires persistence</p>
          <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-muted-foreground">
            Prediction accuracy tracking, forecast improvement trends, and historical comparison
            require a prediction log store. Current predictions are derived fresh on every load from
            live signals. Accuracy measurement will become available once a persistence layer is
            connected and predictions accumulate over time.
          </p>
        </div>
      </section>

      {/* Architecture note */}
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-4">
        <p className="text-xs font-medium text-foreground">How predictive intelligence works</p>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          All predictions are derived from live platform signals on every page load — no historical
          data store is required. The engine reads current state (health, revenue, customers,
          support tickets, workforce, agent queue) and applies signal-based forecasting logic to
          project likely future states. Confidence scores reflect signal strength and data
          completeness. Predictions with low confidence indicate emerging patterns that need more
          data before reliable forecasting is possible. No fabricated data. No fake projections.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          <Link href="/tower/optimization" className="hover:text-foreground">
            View Self-Optimization Engine →
          </Link>{' '}
          ·{' '}
          <Link href="/tower/business-brain" className="hover:text-foreground">
            View Business Brain →
          </Link>
        </p>
      </div>
    </div>
  )
}
