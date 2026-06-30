import Link from 'next/link'
import { getOptimizationData } from './optimization-data'
import type { OptimizationRecommendation, OptimizationPriority } from './optimization-data'

export const dynamic = 'force-dynamic'

const PRIORITY_BADGE: Record<OptimizationPriority, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  low: 'bg-muted text-muted-foreground',
}

const PRIORITY_BORDER: Record<OptimizationPriority, string> = {
  critical: 'border-red-200 dark:border-red-800',
  high: 'border-amber-200 dark:border-amber-800',
  medium: 'border-border',
  low: 'border-border',
}

const WORKLOAD_BADGE = {
  increase: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  maintain: 'bg-muted text-muted-foreground',
  reduce: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
}

const WORKLOAD_LABEL = {
  increase: 'Increase workload',
  maintain: 'Maintain workload',
  reduce: 'Reduce workload',
}

function scoreColor(n: number): string {
  if (n >= 70) return 'text-emerald-700 dark:text-emerald-400'
  if (n >= 45) return 'text-amber-700 dark:text-amber-400'
  return 'text-red-700 dark:text-red-400'
}

function scoreBg(n: number): string {
  if (n >= 70) return 'bg-emerald-500'
  if (n >= 45) return 'bg-amber-400'
  return 'bg-red-500'
}

function RecCard({ rec }: { rec: OptimizationRecommendation }) {
  return (
    <div className={`rounded-lg border bg-card p-4 ${PRIORITY_BORDER[rec.priority]}`}>
      <div className="flex flex-wrap items-start gap-2">
        <p className="flex-1 text-sm font-medium text-foreground">{rec.title}</p>
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[rec.priority]}`}
          >
            {rec.priority}
          </span>
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {rec.category}
          </span>
        </div>
      </div>

      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{rec.description}</p>

      <div className="mt-3 grid grid-cols-1 gap-2 border-t border-border/50 pt-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Business Impact</p>
            <p className="text-xs text-foreground">{rec.businessImpact}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Estimated ROI</p>
            <p className="text-xs text-foreground">{rec.estimatedROI}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Time Saved</p>
            <p className="text-xs text-foreground">{rec.estimatedTimeSaved}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Suggested Agent</p>
            <p className="text-xs text-foreground">{rec.suggestedAgent}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Risk</p>
            <p className="text-xs text-foreground">{rec.risk}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Next Step</p>
            <p className="text-xs text-foreground">{rec.recommendedNextStep}</p>
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-3">
        <span className="text-xs text-muted-foreground">
          Confidence:{' '}
          <span className={`font-medium ${scoreColor(rec.confidence)}`}>{rec.confidence}%</span>
        </span>
        {rec.requiresFounderApproval && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
            Requires approval
          </span>
        )}
        {rec.dependencies.length > 0 && (
          <span className="text-xs text-muted-foreground">
            Depends on: {rec.dependencies.join(', ')}
          </span>
        )}
      </div>
    </div>
  )
}

function EmptySection({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-5 dark:border-emerald-800 dark:bg-emerald-950/10">
      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">{message}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        No improvements detected in this category — platform signals are clear
      </p>
    </div>
  )
}

export default async function OptimizationPage() {
  const opt = await getOptimizationData()

  const briefTime = new Date(opt.generatedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

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
            <span className="text-foreground">Self-Optimization Center</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">
            Self-Optimization Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            What can Koolerr improve today? Highest-ROI recommendations derived from live platform
            signals.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Generated {briefTime} · Refreshes on load</p>
      </div>

      {/* Executive Optimization Summary */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Executive Optimization Summary</h2>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {/* Score hero */}
          <div className="border-b border-border p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Optimization Score
                </p>
                <p
                  className={`mt-1 text-4xl font-semibold tabular-nums ${scoreColor(opt.optimizationScore)}`}
                >
                  {opt.optimizationScore}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {opt.predictedCompanyImprovement}
                </p>
              </div>
              <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${scoreBg(opt.optimizationScore)}`}
                  style={{ width: `${opt.optimizationScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Goals + founder time */}
          <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">Today&apos;s Goal</p>
              <p className="mt-1 text-xs text-foreground">{opt.dailyImprovementGoal}</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">This Week&apos;s Goal</p>
              <p className="mt-1 text-xs text-foreground">{opt.weeklyImprovementGoal}</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">Founder Time Recoverable</p>
              <p className="mt-1 text-xs text-foreground">{opt.founderTimeSaved}</p>
            </div>
          </div>

          {/* Key signals */}
          {(opt.highestROIRecommendation ||
            opt.mostExpensiveBottleneck ||
            opt.mostValuableAutomation) && (
            <div className="border-t border-border">
              <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {opt.highestROIRecommendation && (
                  <div className="px-4 py-3">
                    <p className="text-xs font-medium text-muted-foreground">Highest ROI</p>
                    <p className="mt-1 text-xs font-medium text-foreground">
                      {opt.highestROIRecommendation.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {opt.highestROIRecommendation.estimatedROI}
                    </p>
                  </div>
                )}
                {opt.mostValuableAutomation && (
                  <div className="px-4 py-3">
                    <p className="text-xs font-medium text-muted-foreground">Best Automation</p>
                    <p className="mt-1 text-xs font-medium text-foreground">
                      {opt.mostValuableAutomation.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {opt.mostValuableAutomation.estimatedTimeSaved} saved
                    </p>
                  </div>
                )}
                {opt.mostExpensiveBottleneck && (
                  <div className="px-4 py-3">
                    <p className="text-xs font-medium text-muted-foreground">Biggest Bottleneck</p>
                    <p className="mt-1 text-xs font-medium text-foreground">
                      {opt.mostExpensiveBottleneck.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {opt.mostExpensiveBottleneck.estimatedTimeSaved} blocked
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Agent summary */}
          {(opt.mostOverloadedAgent || opt.mostUnderutilizedAgent) && (
            <div className="grid grid-cols-1 divide-y divide-border border-t border-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              {opt.mostOverloadedAgent && (
                <div className="px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">Most Loaded Agent</p>
                  <p className="mt-1 text-xs text-foreground">{opt.mostOverloadedAgent}</p>
                </div>
              )}
              {opt.mostUnderutilizedAgent && (
                <div className="px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Most Underutilized Agent
                  </p>
                  <p className="mt-1 text-xs text-foreground">{opt.mostUnderutilizedAgent}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Top Opportunities */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Top Opportunities{' '}
          <span className="ml-1 font-normal text-muted-foreground">
            ({opt.topOpportunities.length})
          </span>
        </h2>
        {opt.topOpportunities.length === 0 ? (
          <EmptySection message="No critical or high-priority opportunities detected" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {opt.topOpportunities.map((rec) => (
              <RecCard key={rec.id} rec={rec} />
            ))}
          </div>
        )}
      </section>

      {/* Highest ROI Improvements */}
      {opt.highestROI.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Highest ROI Improvements</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {opt.highestROI.map((rec) => (
              <RecCard key={rec.id} rec={rec} />
            ))}
          </div>
        </section>
      )}

      {/* Automation Candidates */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Automation Candidates{' '}
          <span className="ml-1 font-normal text-muted-foreground">
            ({opt.automationCandidates.length})
          </span>
        </h2>
        {opt.automationCandidates.length === 0 ? (
          <EmptySection message="No automation opportunities identified" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {opt.automationCandidates.map((rec) => (
              <RecCard key={rec.id} rec={rec} />
            ))}
          </div>
        )}
      </section>

      {/* Time Savings */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Time Savings</h2>
        {opt.timeSavings.length === 0 ? (
          <EmptySection message="No time savings opportunities identified" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {opt.timeSavings.map((rec) => (
              <RecCard key={rec.id} rec={rec} />
            ))}
          </div>
        )}
      </section>

      {/* Revenue Opportunities */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Revenue Opportunities</h2>
          <Link
            href="/tower/revenue"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Revenue dashboard →
          </Link>
        </div>
        {opt.revenueOpportunities.length === 0 ? (
          <EmptySection message="No revenue improvement opportunities identified" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {opt.revenueOpportunities.map((rec) => (
              <RecCard key={rec.id} rec={rec} />
            ))}
          </div>
        )}
      </section>

      {/* Cost Reduction */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Cost Reduction</h2>
        {opt.costReduction.length === 0 ? (
          <EmptySection message="No cost reduction opportunities identified" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {opt.costReduction.map((rec) => (
              <RecCard key={rec.id} rec={rec} />
            ))}
          </div>
        )}
      </section>

      {/* Support Improvements */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Support Improvements</h2>
          <Link
            href="/tower/support"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Support center →
          </Link>
        </div>
        {opt.supportImprovements.length === 0 ? (
          <EmptySection message="Support operating efficiently" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {opt.supportImprovements.map((rec) => (
              <RecCard key={rec.id} rec={rec} />
            ))}
          </div>
        )}
      </section>

      {/* Engineering Improvements */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Engineering Improvements</h2>
          <Link href="/tower/cto" className="text-xs text-muted-foreground hover:text-foreground">
            CTO operations →
          </Link>
        </div>
        {opt.engineeringImprovements.length === 0 ? (
          <EmptySection message="Engineering stack is healthy" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {opt.engineeringImprovements.map((rec) => (
              <RecCard key={rec.id} rec={rec} />
            ))}
          </div>
        )}
      </section>

      {/* Marketing Improvements */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Marketing Improvements</h2>
          <Link
            href="/tower/marketing"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Marketing →
          </Link>
        </div>
        {opt.marketingImprovements.length === 0 ? (
          <EmptySection message="No marketing improvements identified" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {opt.marketingImprovements.map((rec) => (
              <RecCard key={rec.id} rec={rec} />
            ))}
          </div>
        )}
      </section>

      {/* Billing Improvements */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Billing Improvements</h2>
          <Link
            href="/tower/billing"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Billing dashboard →
          </Link>
        </div>
        {opt.billingImprovements.length === 0 ? (
          <EmptySection message="No billing improvements identified" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {opt.billingImprovements.map((rec) => (
              <RecCard key={rec.id} rec={rec} />
            ))}
          </div>
        )}
      </section>

      {/* Growth Improvements */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Growth Improvements</h2>
          <Link
            href="/tower/growth"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Growth center →
          </Link>
        </div>
        {opt.growthImprovements.length === 0 ? (
          <EmptySection message="No growth improvements identified" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {opt.growthImprovements.map((rec) => (
              <RecCard key={rec.id} rec={rec} />
            ))}
          </div>
        )}
      </section>

      {/* Customer Success Improvements */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Customer Success Improvements</h2>
          <Link
            href="/tower/customer-success"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Customer success →
          </Link>
        </div>
        {opt.customerSuccessImprovements.length === 0 ? (
          <EmptySection message="No customer success improvements identified" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {opt.customerSuccessImprovements.map((rec) => (
              <RecCard key={rec.id} rec={rec} />
            ))}
          </div>
        )}
      </section>

      {/* Agent Optimization */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Agent Optimization</h2>
          <Link
            href="/tower/agents"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Agent registry →
          </Link>
        </div>

        {/* Efficiency table */}
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border bg-muted/30 px-4 py-2.5">
            <p className="text-xs font-medium text-foreground">Agent Efficiency Overview</p>
            <p className="text-xs text-muted-foreground">
              Historical improvement trend requires persistence — showing current signals
            </p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Agent
                </th>
                <th className="hidden px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                  Efficiency
                </th>
                <th className="hidden px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">
                  Capacity
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Workload
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {opt.agentEfficiency.map((agent) => (
                <tr key={agent.agentId}>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-foreground">{agent.agentName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{agent.domain}</p>
                    {agent.optimizationSuggestions[0] && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        → {agent.optimizationSuggestions[0]}
                      </p>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${scoreBg(agent.currentEfficiency)}`}
                          style={{ width: `${agent.currentEfficiency}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-semibold tabular-nums ${scoreColor(agent.currentEfficiency)}`}
                      >
                        {agent.currentEfficiency}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-right md:table-cell">
                    <span className={`text-xs font-medium ${scoreColor(agent.estimatedCapacity)}`}>
                      {agent.estimatedCapacity}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${WORKLOAD_BADGE[agent.recommendedWorkload]}`}
                    >
                      {WORKLOAD_LABEL[agent.recommendedWorkload]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Agent-specific recommendations */}
        {opt.agentOptimization.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {opt.agentOptimization.map((rec) => (
              <RecCard key={rec.id} rec={rec} />
            ))}
          </div>
        )}
      </section>

      {/* Risk Reduction */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Risk Reduction</h2>
        {opt.riskReduction.length === 0 ? (
          <EmptySection message="No active risks detected" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {opt.riskReduction.map((rec) => (
              <RecCard key={rec.id} rec={rec} />
            ))}
          </div>
        )}
      </section>

      {/* Optimization Timeline */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Optimization Timeline</h2>
        <p className="text-xs text-muted-foreground">
          Recommended sequencing — resolve in dependency order for maximum compound effect
        </p>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="divide-y divide-border">
            {opt.topOpportunities.slice(0, 10).map((rec, i) => (
              <div key={rec.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    rec.priority === 'critical'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                      : rec.priority === 'high'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{rec.title}</p>
                  <p className="text-xs text-muted-foreground">{rec.estimatedROI}</p>
                </div>
                <span className="flex-shrink-0 text-xs text-muted-foreground">
                  {rec.suggestedAgent}
                </span>
                {rec.requiresFounderApproval && (
                  <Link
                    href="/tower/approvals"
                    className="flex-shrink-0 text-xs text-amber-700 hover:underline dark:text-amber-400"
                  >
                    Approve →
                  </Link>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-border bg-muted/20 px-4 py-2.5">
            <p className="text-xs text-muted-foreground">
              Historical timeline requires a persistence layer — showing current priority order
              derived from live signals. Items requiring approval route to{' '}
              <Link
                href="/tower/approvals"
                className="underline underline-offset-2 hover:text-foreground"
              >
                /tower/approvals
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Architecture note */}
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-4">
        <p className="text-xs font-medium text-foreground">
          How the Self-Optimization Engine works
        </p>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          All recommendations are derived from live platform signals on each page load — no
          fabricated metrics. The engine reads Executive Data, Support Data, and Workforce Data
          (fetched once), then derives optimization candidates across 14 categories using pure
          functions. No recommendations execute automatically. All items requiring approval route
          through{' '}
          <Link
            href="/tower/approvals"
            className="underline underline-offset-2 hover:text-foreground"
          >
            the Approval Queue
          </Link>
          . Optimization history (completed improvements, success rates) will become available once
          a
          <code className="mx-1 rounded bg-muted px-1 font-mono text-xs">optimization_history</code>
          table is added.
        </p>
      </div>
    </div>
  )
}
