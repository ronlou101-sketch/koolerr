import Link from 'next/link'
import { getCompanyMemoryData } from './company-memory-data'
import type {
  MemoryObject,
  BusinessPattern,
  MemorySignal,
  LearningTrend,
} from './company-memory-data'

export const dynamic = 'force-dynamic'

const SIGNAL_BORDER: Record<MemorySignal, string> = {
  positive: 'border-emerald-200 dark:border-emerald-800',
  negative: 'border-red-200 dark:border-red-800',
  warning: 'border-amber-200 dark:border-amber-800',
  neutral: 'border-border',
}

const SIGNAL_BADGE: Record<MemorySignal, string> = {
  positive: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  negative: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  neutral: 'bg-muted text-muted-foreground',
}

const SIGNAL_LABEL: Record<MemorySignal, string> = {
  positive: 'Win',
  negative: 'Failure',
  warning: 'Warning',
  neutral: 'Neutral',
}

const IMPACT_BADGE: Record<BusinessPattern['impact'], string> = {
  positive: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  negative: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  neutral: 'bg-muted text-muted-foreground',
}

const FREQ_BADGE: Record<BusinessPattern['frequency'], string> = {
  recurring: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  'one-time': 'bg-muted text-muted-foreground',
  trend: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
}

const TREND_LABEL: Record<LearningTrend, string> = {
  improving: '↑ Improving',
  stable: '→ Stable',
  declining: '↓ Declining',
  'insufficient-data': '— No data',
}

const PRIORITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  low: 'bg-muted text-muted-foreground',
}

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

function MemoryCard({ obj }: { obj: MemoryObject }) {
  return (
    <div className={`rounded-lg border bg-card p-4 ${SIGNAL_BORDER[obj.signal]}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{obj.title}</p>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SIGNAL_BADGE[obj.signal]}`}
        >
          {SIGNAL_LABEL[obj.signal]}
        </span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{obj.summary}</p>

      <div className="mt-3 grid grid-cols-1 gap-2 border-t border-border/50 pt-3 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Evidence</p>
          <ul className="space-y-0.5">
            {obj.evidence.map((e, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-muted-foreground/40" />
                {e}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Business Impact</p>
            <p className="mt-0.5 text-xs text-foreground">{obj.businessImpact}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Next Action</p>
            <p className="mt-0.5 text-xs text-foreground">{obj.recommendedNextAction}</p>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Confidence:{' '}
          <span className={`font-medium ${scoreColor(obj.confidence)}`}>{obj.confidence}%</span>
        </span>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          {obj.category}
        </span>
      </div>
    </div>
  )
}

export default async function CompanyMemoryPage() {
  const memory = await getCompanyMemoryData()
  const { intelligenceScore: score } = memory

  const briefTime = new Date(memory.generatedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  const scoreComponents = [
    { label: 'Platform Health', value: score.platformHealth },
    { label: 'Revenue Health', value: score.revenueHealth },
    { label: 'Support Health', value: score.supportHealth },
    { label: 'Growth Health', value: score.growthHealth },
    { label: 'Execution Health', value: score.executionHealth },
    { label: 'Automation Health', value: score.automationHealth },
    { label: 'Learning Progress', value: score.learningProgress },
    { label: 'Decision Backlog', value: score.founderDecisionBacklog },
  ]

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
            <span className="text-foreground">Company Memory</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Company Memory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Institutional memory and learning engine — derived from live platform signals
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Generated {briefTime} · Refreshes on load</p>
      </div>

      {/* Company Intelligence Score */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Company Intelligence Score</h2>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {/* Overall score hero */}
          <div className="border-b border-border p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Overall Intelligence Score
                </p>
                <p
                  className={`mt-1 text-4xl font-semibold tabular-nums ${scoreColor(score.overall)}`}
                >
                  {score.overall}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{score.note}</p>
              </div>
              <div className="flex-shrink-0">
                <div className={`h-2 w-32 overflow-hidden rounded-full bg-muted`}>
                  <div
                    className={`h-full rounded-full ${scoreBg(score.overall)}`}
                    style={{ width: `${score.overall}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Component breakdown */}
          <div className="divide-y divide-border">
            {scoreComponents.map(({ label, value }) => (
              <div key={label} className="flex items-center gap-4 px-5 py-2.5">
                <p className="w-40 flex-shrink-0 text-xs text-muted-foreground">{label}</p>
                <div className="flex flex-1 items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${scoreBg(value)}`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span
                    className={`w-8 text-right text-xs font-semibold tabular-nums ${scoreColor(value)}`}
                  >
                    {value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border bg-muted/20 px-5 py-2.5">
            <p className="text-xs text-muted-foreground">
              Weighted composite derived from live platform signals — no fabricated metrics. Higher
              Decision Backlog score means fewer items waiting for founder approval.
            </p>
          </div>
        </div>
      </section>

      {/* Executive Memory */}
      {memory.executiveMemory.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Executive Memory</h2>
          <p className="text-xs text-muted-foreground">
            Top signals — wins and failures shaping the current company state
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {memory.executiveMemory.map((obj) => (
              <MemoryCard key={obj.id} obj={obj} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Wins + Recent Failures */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Recent Wins{' '}
            <span className="ml-1 font-normal text-muted-foreground">
              ({memory.recentWins.length})
            </span>
          </h2>
          <div className="space-y-3">
            {memory.recentWins.map((obj) => (
              <MemoryCard key={obj.id} obj={obj} />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Recent Failures{' '}
            <span className="ml-1 font-normal text-muted-foreground">
              ({memory.recentFailures.length})
            </span>
          </h2>
          {memory.recentFailures.length === 0 ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-6 dark:border-emerald-800 dark:bg-emerald-950/20">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
                No failures detected
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                No negative signals in the current platform snapshot
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {memory.recentFailures.map((obj) => (
                <MemoryCard key={obj.id} obj={obj} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Pattern Detection */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Pattern Detection{' '}
          <span className="ml-1 font-normal text-muted-foreground">
            ({memory.patterns.length} pattern{memory.patterns.length !== 1 ? 's' : ''} detected)
          </span>
        </h2>
        {memory.patterns.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">No recurring patterns detected</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Platform signals normal — connect more integrations to detect deeper patterns
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="divide-y divide-border">
              {memory.patterns.map((pat) => (
                <div key={pat.id} className="p-4">
                  <div className="flex flex-wrap items-start gap-2">
                    <p className="flex-1 text-sm font-medium text-foreground">{pat.title}</p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${IMPACT_BADGE[pat.impact]}`}
                    >
                      {pat.impact}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${FREQ_BADGE[pat.frequency]}`}
                    >
                      {pat.frequency}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{pat.pattern}</p>
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 border-t border-border/40 pt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Evidence: </span>
                        {pat.evidence}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Action: </span>
                        {pat.recommendation}
                      </p>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      Confidence:{' '}
                      <span className={`font-medium ${scoreColor(pat.confidence)}`}>
                        {pat.confidence}%
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Lessons / Problems / Pending */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Lessons Learned</h2>
          <ul className="space-y-2">
            {memory.lessonsLearned.map((lesson, i) => (
              <li
                key={i}
                className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2.5 dark:border-emerald-900 dark:bg-emerald-950/10"
              >
                <p className="text-xs leading-relaxed text-foreground">{lesson}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Recurring Problems</h2>
          {memory.recurringProblems.length === 0 ? (
            <div className="rounded-lg border border-border bg-card px-3 py-4">
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                No recurring problems detected
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {memory.recurringProblems.map((problem, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-red-200 bg-red-50/50 px-3 py-2.5 dark:border-red-900 dark:bg-red-950/10"
                >
                  <p className="text-xs leading-relaxed text-foreground">{problem}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Pending Lessons</h2>
          <ul className="space-y-2">
            {memory.pendingLessons.map((lesson, i) => (
              <li key={i} className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                <p className="text-xs leading-relaxed text-muted-foreground">{lesson}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Growth Insights */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Growth Insights</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {memory.growthMemory.map((obj) => (
            <MemoryCard key={obj.id} obj={obj} />
          ))}
        </div>
      </section>

      {/* Support Insights */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Support Insights</h2>
          <Link
            href="/tower/support"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Support center →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {memory.supportMemory.map((obj) => (
            <MemoryCard key={obj.id} obj={obj} />
          ))}
        </div>
      </section>

      {/* Engineering Insights */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Engineering Insights</h2>
          <Link href="/tower/cto" className="text-xs text-muted-foreground hover:text-foreground">
            CTO operations →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {memory.engineeringMemory.map((obj) => (
            <MemoryCard key={obj.id} obj={obj} />
          ))}
        </div>
      </section>

      {/* Marketing Insights */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Marketing Insights</h2>
        <div className="rounded-lg border border-dashed border-border bg-card px-4 py-4">
          <p className="text-sm font-medium text-foreground">
            Marketing intelligence derived from growth signals
          </p>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Marketing-specific memory (campaign performance, content conversion, channel
            attribution) requires a CRM or marketing automation integration. Current signals: Growth
            Health is{' '}
            <span className={`font-medium ${scoreColor(memory.intelligenceScore.growthHealth)}`}>
              {memory.intelligenceScore.growthHealth}
            </span>
            . See Growth Insights above for acquisition signals.{' '}
            <Link
              href="/tower/marketing"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Marketing dashboard →
            </Link>
          </p>
        </div>
      </section>

      {/* Revenue Insights */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Revenue Insights</h2>
          <Link
            href="/tower/revenue"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Revenue dashboard →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {memory.revenueMemory.map((obj) => (
            <MemoryCard key={obj.id} obj={obj} />
          ))}
        </div>
      </section>

      {/* AI Workforce Learning */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">AI Workforce Learning</h2>
          <Link
            href="/tower/agents"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Agent registry →
          </Link>
        </div>

        {/* Automation memory */}
        {memory.automationMemory.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {memory.automationMemory.map((obj) => (
              <MemoryCard key={obj.id} obj={obj} />
            ))}
          </div>
        )}

        {/* Agent learning table */}
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border bg-muted/30 px-4 py-2.5">
            <p className="text-xs font-medium text-foreground">Agent Learning Records</p>
            <p className="text-xs text-muted-foreground">
              Historical success rates require an{' '}
              <code className="rounded bg-muted px-1 font-mono text-xs">
                agent_execution_history
              </code>{' '}
              table — showing current signals only
            </p>
          </div>
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
                  Learning Score
                </th>
                <th className="hidden px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">
                  Avg Confidence
                </th>
                <th className="hidden px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground lg:table-cell">
                  Trend
                </th>
                <th className="hidden px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground xl:table-cell">
                  Historical Success
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {memory.agentLearning.map((agent) => (
                <tr key={agent.agentId}>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-foreground">{agent.agentName}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {agent.note}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                    {agent.domain}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="hidden h-1 w-12 overflow-hidden rounded-full bg-muted sm:block">
                        <div
                          className={`h-full rounded-full ${scoreBg(agent.learningScore)}`}
                          style={{ width: `${agent.learningScore}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-semibold tabular-nums ${scoreColor(agent.learningScore)}`}
                      >
                        {agent.learningScore}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-right md:table-cell">
                    <span
                      className={`text-xs font-medium ${
                        agent.avgConfidence >= 80
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : agent.avgConfidence >= 65
                            ? 'text-amber-700 dark:text-amber-400'
                            : agent.avgConfidence > 0
                              ? 'text-red-700 dark:text-red-400'
                              : 'text-muted-foreground'
                      }`}
                    >
                      {agent.avgConfidence > 0 ? `${agent.avgConfidence}%` : '—'}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-right text-xs text-muted-foreground lg:table-cell">
                    {TREND_LABEL[agent.trend]}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-xs text-muted-foreground xl:table-cell">
                    No history
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Learning Objectives */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Next Learning Objectives{' '}
          <span className="ml-1 font-normal text-muted-foreground">
            ({memory.learningObjectives.length})
          </span>
        </h2>
        <div className="space-y-2">
          {memory.learningObjectives.map((obj) => (
            <div key={obj.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{obj.objective}</p>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[obj.priority]}`}
                >
                  {obj.priority}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Now: </span>
                  {obj.currentState}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Target: </span>
                  {obj.targetState}
                </p>
              </div>
              {obj.blockedBy && (
                <p className="mt-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                  ⚠ Blocked by: {obj.blockedBy}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Founder Decision History */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Founder Decision History</h2>
        <div className="rounded-lg border border-dashed border-border bg-card px-4 py-5">
          <p className="text-sm font-medium text-foreground">
            Decision history requires a persistence layer
          </p>
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Previous founder approvals, rejections, outcomes, and decision patterns are not yet
            persisted. Once a{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              founder_decisions
            </code>{' '}
            table is added, this section will show: approval rate by agent, rejection patterns,
            time-to-decision averages, decision accuracy over time, and outcomes of past approved
            actions. All other sections above derive their insights from live data only.
          </p>
          <div className="mt-3 flex gap-3">
            <Link
              href="/tower/approvals"
              className="inline-flex items-center rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              Current approval queue →
            </Link>
            <Link
              href="/tower/founder-intelligence"
              className="inline-flex items-center rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              Founder intelligence →
            </Link>
          </div>
        </div>
      </section>

      {/* Memory Timeline */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Memory Timeline</h2>
        <p className="text-xs text-muted-foreground">
          Synthesized signal timeline — patterns, wins, and failures in order of business impact
        </p>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="divide-y divide-border">
            {[
              ...memory.recentFailures.map((o) => ({ ...o, timeLabel: 'Active' })),
              ...memory.patterns
                .filter((p) => p.impact === 'negative')
                .map((p) => ({
                  id: `timeline-${p.id}`,
                  title: p.title,
                  signal: 'negative' as const,
                  timeLabel: p.frequency,
                })),
              ...memory.recentWins.slice(0, 3).map((o) => ({ ...o, timeLabel: 'Active' })),
              ...memory.patterns
                .filter((p) => p.impact === 'positive')
                .map((p) => ({
                  id: `timeline-pos-${p.id}`,
                  title: p.title,
                  signal: 'positive' as const,
                  timeLabel: p.frequency,
                })),
            ]
              .slice(0, 12)
              .map((item, i) => (
                <div key={`${item.id}-${i}`} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                      item.signal === 'positive'
                        ? 'bg-emerald-500'
                        : item.signal === 'negative'
                          ? 'bg-red-500'
                          : item.signal === 'warning'
                            ? 'bg-amber-400'
                            : 'bg-muted-foreground/30'
                    }`}
                  />
                  <p className="flex-1 text-xs text-foreground">{item.title}</p>
                  <span className="flex-shrink-0 text-xs text-muted-foreground">
                    {item.timeLabel}
                  </span>
                </div>
              ))}
          </div>
          <div className="border-t border-border bg-muted/20 px-4 py-2.5">
            <p className="text-xs text-muted-foreground">
              Temporal timeline requires a history persistence layer — showing current signal
              priority order derived from live data
            </p>
          </div>
        </div>
      </section>

      {/* Architecture note */}
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-4">
        <p className="text-xs font-medium text-foreground">How Company Memory works</p>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          All memory is derived from live platform signals on each page load — engagement runs,
          subscriptions, support tickets, audit events, and workforce data. No data is fabricated.
          Historical memory (decision outcomes, agent improvement over time, pattern frequency
          across days) will become available once persistence tables are added. The intelligence
          score is a weighted composite of{' '}
          <Link
            href="/tower/business-brain"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Business Brain scores
          </Link>{' '}
          and live execution signals.
        </p>
      </div>
    </div>
  )
}
