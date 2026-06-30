import Link from 'next/link'
import { getBrainData } from './brain-data'
import type { BrainScore, ObjectiveStatus, CompanyScores } from './brain-data'

export const dynamic = 'force-dynamic'

function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-700 dark:text-emerald-400'
  if (score >= 45) return 'text-amber-700 dark:text-amber-400'
  return 'text-red-700 dark:text-red-400'
}

function scoreBg(score: number): string {
  if (score >= 70) return 'bg-emerald-500'
  if (score >= 45) return 'bg-amber-400'
  return 'bg-red-500'
}

function scoreRing(score: number): string {
  if (score >= 70) return 'ring-emerald-200 dark:ring-emerald-800'
  if (score >= 45) return 'ring-amber-200 dark:ring-amber-800'
  return 'ring-red-200 dark:ring-red-800'
}

const TREND_SYMBOL: Record<string, string> = {
  up: '↑',
  down: '↓',
  stable: '→',
  unknown: '—',
}

const TREND_COLOR: Record<string, string> = {
  up: 'text-emerald-600 dark:text-emerald-400',
  down: 'text-red-600 dark:text-red-400',
  stable: 'text-muted-foreground',
  unknown: 'text-muted-foreground/60',
}

const OBJECTIVE_STATUS: Record<ObjectiveStatus, { label: string; badge: string; border: string }> =
  {
    'on-track': {
      label: 'On Track',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    'at-risk': {
      label: 'At Risk',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
    },
    blocked: {
      label: 'Blocked',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800',
    },
    'insufficient-data': {
      label: 'Insufficient Data',
      badge: 'bg-muted text-muted-foreground',
      border: 'border-border',
    },
  }

const CONFIDENCE_BADGE = {
  high: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  low: 'bg-muted text-muted-foreground',
}

const SIGNAL_TYPE_BADGE = {
  pattern: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  trend: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  anomaly: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
}

function ScoreCard({
  label,
  score,
  trend,
  large,
}: {
  label: string
  score: BrainScore
  trend?: boolean
  large?: boolean
}) {
  return (
    <div
      className={`rounded-lg border border-border bg-card p-4 ${large ? 'ring-2 ' + scoreRing(score.score) : ''}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p
          className={`font-semibold tabular-nums ${large ? 'text-3xl' : 'text-2xl'} ${scoreColor(score.score)}`}
        >
          {score.score}
        </p>
        <div className="flex flex-col items-end gap-0.5">
          {trend !== false && (
            <span className={`text-xs font-semibold ${TREND_COLOR[score.trend]}`}>
              {TREND_SYMBOL[score.trend]}
            </span>
          )}
          <div className={`h-1.5 w-16 overflow-hidden rounded-full bg-muted`}>
            <div
              className={`h-full rounded-full ${scoreBg(score.score)}`}
              style={{ width: `${score.score}%` }}
            />
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{score.note}</p>
    </div>
  )
}

function scoresAsArray(scores: CompanyScores) {
  return [
    { label: 'Growth', key: 'growth', score: scores.growth },
    { label: 'Operational', key: 'operational', score: scores.operational },
    { label: 'Customer Success', key: 'customerSuccess', score: scores.customerSuccess },
    { label: 'Financial', key: 'financial', score: scores.financial },
    { label: 'AI Efficiency', key: 'aiEfficiency', score: scores.aiEfficiency },
    { label: 'Risk', key: 'risk', score: scores.risk },
    { label: 'Confidence', key: 'confidence', score: scores.confidence },
  ]
}

export default async function BusinessBrainPage() {
  const { scores, reasoning, objectives, agentCoordination, learningSignals, generatedAt } =
    await getBrainData()

  const briefTime = new Date(generatedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  const scoreList = scoresAsArray(scores)

  const biggestOpportunity = objectives
    .filter((o) => o.status === 'at-risk' || o.status === 'blocked')
    .sort((a, b) => b.score - a.score)[0]

  const biggestRisk = objectives
    .filter((o) => o.status === 'blocked' || o.status === 'at-risk')
    .sort((a, b) => a.score - b.score)[0]

  const activeCollaborations = agentCoordination.filter((a) => a.collaboratingWith.length > 0)
  const blockedAgents = agentCoordination.filter((a) => a.blockedBy !== null)
  const totalAgentTasks = agentCoordination.reduce((s, a) => s + a.pendingTasks, 0)
  const totalWaiting = agentCoordination.reduce((s, a) => s + a.waitingApproval, 0)

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
            <span className="text-foreground">Business Brain</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Business Brain</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Executive intelligence — synthesizing all platform signals into a single company view
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Generated {briefTime} · Refreshes on load</p>
      </div>

      {/* Overall + subscores */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Company Health Scores</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Overall — large */}
          <div className="sm:col-span-2 lg:col-span-1">
            <ScoreCard label="Overall Company Score" score={scores.overall} large />
          </div>
          {scoreList.slice(0, 3).map(({ label, score }) => (
            <ScoreCard key={label} label={label} score={score} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {scoreList.slice(3).map(({ label, score }) => (
            <ScoreCard key={label} label={label} score={score} />
          ))}
        </div>
      </div>

      {/* Executive Reasoning */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Executive Reasoning</h2>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="max-w-2xl text-sm font-medium text-foreground">{reasoning.belief}</p>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CONFIDENCE_BADGE[reasoning.confidenceLevel]}`}
              >
                {reasoning.confidenceLevel} confidence
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{reasoning.why}</p>

            <div className="mt-4 grid grid-cols-1 gap-4 border-t border-border/50 pt-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Supporting Evidence
                </p>
                <ul className="space-y-1.5">
                  {reasoning.evidence.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-muted-foreground/40" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Recommended Actions
                </p>
                <ul className="space-y-1.5">
                  {reasoning.recommendedActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="text-foreground">{action}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 rounded-md border border-border/50 bg-muted/30 px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Estimated impact: </span>
                    {reasoning.estimatedImpact}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Objectives */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Company Objectives</h2>
          {biggestOpportunity && (
            <p className="text-xs text-muted-foreground">
              Priority:{' '}
              <span className="font-medium text-foreground">{biggestOpportunity.title}</span>
            </p>
          )}
        </div>
        <div className="space-y-2">
          {objectives.map((obj) => {
            const statusCfg = OBJECTIVE_STATUS[obj.status]
            return (
              <div key={obj.id} className={`rounded-lg border bg-card p-4 ${statusCfg.border}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.badge}`}
                    >
                      {statusCfg.label}
                    </span>
                    <p className="text-sm font-medium text-foreground">{obj.title}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${scoreBg(obj.score)}`}
                          style={{ width: `${obj.score}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${scoreColor(obj.score)}`}>
                        {obj.score}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{obj.signal}</p>
                {obj.blockingIssue && (
                  <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                    ⚠ {obj.blockingIssue}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {obj.relatedAgents.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Key signals strip */}
      {(biggestOpportunity || biggestRisk) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {biggestOpportunity && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-400">
                Biggest Opportunity
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">{biggestOpportunity.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{biggestOpportunity.signal}</p>
            </div>
          )}
          {biggestRisk && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-800 dark:text-red-400">
                Biggest Risk
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">{biggestRisk.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {biggestRisk.blockingIssue ?? biggestRisk.signal}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Agent Coordination */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Agent Coordination</h2>
          <Link
            href="/tower/agents"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Agent registry →
          </Link>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: 'Active Agents',
              value: agentCoordination.filter((a) => a.pendingTasks > 0).length,
            },
            { label: 'Total Tasks', value: totalAgentTasks },
            {
              label: 'Waiting Approval',
              value: totalWaiting,
              color: totalWaiting > 0 ? 'text-amber-700 dark:text-amber-400' : undefined,
            },
            { label: 'Collaborations', value: activeCollaborations.length },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p
                className={`mt-1.5 text-xl font-semibold tabular-nums ${color ?? 'text-foreground'}`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Agent
                </th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                  Current Priority
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Tasks
                </th>
                <th className="hidden px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">
                  Blocked
                </th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground lg:table-cell">
                  Collaborating
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {agentCoordination.map((rec) => (
                <tr key={rec.agentId}>
                  <td className="px-4 py-3 text-xs font-medium text-foreground">{rec.agentName}</td>
                  <td className="hidden max-w-xs px-4 py-3 sm:table-cell">
                    <p className="truncate text-xs text-muted-foreground">
                      {rec.currentPriority ?? 'No active tasks'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-semibold tabular-nums text-foreground">
                      {rec.pendingTasks}
                    </span>
                    {rec.waitingApproval > 0 && (
                      <span className="ml-1.5 text-xs text-amber-700 dark:text-amber-400">
                        ({rec.waitingApproval} waiting)
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-right md:table-cell">
                    <span className="text-xs text-muted-foreground">{rec.blockedBy ?? '—'}</span>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {rec.collaboratingWith.length > 0 ? rec.collaboratingWith.join(', ') : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {blockedAgents.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              {blockedAgents.length} agent{blockedAgents.length !== 1 ? 's' : ''} blocked on founder
              approval —{' '}
              <Link href="/tower/approvals" className="font-medium underline underline-offset-2">
                review queue
              </Link>
            </p>
          </div>
        )}
      </section>

      {/* Learning Engine */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Learning Engine</h2>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border bg-muted/30 px-4 py-2.5">
            <p className="text-xs text-muted-foreground">
              Current platform signals — approval history tracking requires a persistence layer
            </p>
          </div>
          <div className="divide-y divide-border">
            {learningSignals.map((signal, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <span
                  className={`mt-0.5 flex-shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium ${SIGNAL_TYPE_BADGE[signal.type]}`}
                >
                  {signal.type}
                </span>
                <p className="text-xs text-foreground">{signal.signal}</p>
                {signal.count > 0 && (
                  <span className="ml-auto flex-shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                    {signal.count}×
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-border bg-muted/20 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Future capability: as you approve or reject agent recommendations, the Brain learns
              your preferences and adjusts its recommendations. Requires a founder decisions
              persistence table.
            </p>
          </div>
        </div>
      </section>

      {/* Philosophy note */}
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-4">
        <p className="text-xs font-medium text-foreground">How the Business Brain works</p>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          All scores and reasoning are derived from live platform data — no fabricated metrics. The
          Brain synthesizes signals from Platform Health, Billing, AI Workforce, Support, and Audit
          into a single executive view. Scores update on every page load. Agent coordination maps
          task priorities to company objectives. The learning engine will grow more accurate as more
          historical decisions are recorded. Do not change agent behavior automatically — all
          recommendations pass through the{' '}
          <Link
            href="/tower/approvals"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Approval Queue
          </Link>{' '}
          before execution.
        </p>
      </div>
    </div>
  )
}
