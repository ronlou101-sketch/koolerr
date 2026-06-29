import Link from 'next/link'
import { getExecutiveData } from '../executive/executive-data'

export const dynamic = 'force-dynamic'

interface AutomationOpportunity {
  id: string
  title: string
  category: string
  currentState: string
  estimatedHoursSaved: string
  difficulty: 'Low' | 'Medium' | 'High'
  suggestedAgent: string
  businessImpact: string
  liveContext?: string
  href?: string
}

const DIFFICULTY_BADGE: Record<string, string> = {
  Low: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  Medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  High: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
}

export default async function AutomationOpportunitiesPage() {
  const data = await getExecutiveData()
  const { revenue, actionQueue, newCustomers } = data

  const hasNoCustomers = actionQueue.some((a) => a.id === 'no-customers')
  const hasFailedRuns = actionQueue.some((a) => a.id === 'failed-runs')

  const opportunities: AutomationOpportunity[] = [
    {
      id: 'approval-triage',
      title: 'AI Workforce Approval Triage',
      category: 'AI Operations',
      currentState: 'You review and approve every AI-generated deliverable manually.',
      estimatedHoursSaved: '3–8h / week',
      difficulty: 'Medium',
      suggestedAgent: 'Review Agent with configurable auto-approve thresholds per deliverable type',
      businessImpact: 'Eliminates approval bottleneck and accelerates customer delivery SLA',
      liveContext: hasFailedRuns
        ? 'Failed runs detected — investigate before automating approvals'
        : undefined,
      href: '/approvals',
    },
    {
      id: 'billing-dunning',
      title: 'Past-Due Subscription Recovery',
      category: 'Revenue',
      currentState:
        revenue.pastDue > 0
          ? `${revenue.pastDue} subscription${revenue.pastDue !== 1 ? 's are' : ' is'} currently past due and require manual follow-up.`
          : 'Manual follow-up is required when customers hit payment failures.',
      estimatedHoursSaved: '1–3h / month',
      difficulty: 'Low',
      suggestedAgent: 'Stripe dunning automation + recovery email sequence via Resend',
      businessImpact: 'Recovers churned revenue automatically without founder involvement',
      liveContext:
        revenue.pastDue > 0
          ? `${revenue.pastDue} past-due subscription${revenue.pastDue !== 1 ? 's' : ''} require immediate action`
          : undefined,
      href: '/tower/health/billing',
    },
    {
      id: 'customer-onboarding',
      title: 'Customer Onboarding Sequence',
      category: 'Customer Success',
      currentState: hasNoCustomers
        ? 'No customers yet — design the onboarding sequence before acquiring the first customer.'
        : 'New customers may receive manual onboarding. No automated sequence is confirmed.',
      estimatedHoursSaved: '5–10h / new customer',
      difficulty: 'Medium',
      suggestedAgent:
        'Onboarding Workflow Agent (welcome email, setup checklist, first-run guidance)',
      businessImpact:
        'Reduces time-to-value for customers and removes founder bottleneck as customers scale',
      liveContext:
        newCustomers.orgsLast24h > 0
          ? `${newCustomers.orgsLast24h} new organization${newCustomers.orgsLast24h !== 1 ? 's' : ''} joined in the last 24 hours`
          : undefined,
      href: '/tower/customer-success',
    },
    {
      id: 'daily-platform-review',
      title: 'Daily Platform Health Digest',
      category: 'Operations',
      currentState: 'You visit Morning Brief manually each day to review platform status.',
      estimatedHoursSaved: '30m / day (compounded at scale)',
      difficulty: 'Low',
      suggestedAgent:
        'Scheduled Digest Agent — sends Morning Brief summary to email or Slack at 8am daily',
      businessImpact: 'Ensures you are always informed even if you forget to open Tower Control',
      href: '/tower/morning-brief',
    },
    {
      id: 'failed-run-escalation',
      title: 'Failed AI Run Escalation',
      category: 'AI Operations',
      currentState: 'Failed engagement runs surface in Tower Control only when you actively check.',
      estimatedHoursSaved: '2–5h / incident',
      difficulty: 'Low',
      suggestedAgent:
        'Alert Agent — detects failed runs, sends immediate notification, logs for review',
      businessImpact: 'Reduces mean time to detection and resolution of AI Workforce failures',
      liveContext: hasFailedRuns
        ? 'Failed runs currently active — this automation would have alerted you immediately'
        : undefined,
      href: '/tower/runs',
    },
    {
      id: 'marketing-reporting',
      title: 'Weekly Marketing Performance Report',
      category: 'Growth',
      currentState:
        'Marketing metrics are not yet connected. No automated reporting is possible until integrations are configured.',
      estimatedHoursSaved: '2–4h / week (once marketing is connected)',
      difficulty: 'Medium',
      suggestedAgent:
        'Marketing Report Agent — aggregates GA4, email platform, and CRM data into weekly digest',
      businessImpact: 'Gives consistent growth visibility without manual data pulling each week',
      href: '/tower/marketing',
    },
    {
      id: 'lead-qualification',
      title: 'Inbound Lead Qualification',
      category: 'Sales',
      currentState: 'Inbound leads require manual review and qualification before follow-up.',
      estimatedHoursSaved: '4–8h / week',
      difficulty: 'High',
      suggestedAgent:
        'Lead Qualification Agent — scores leads by ICP fit and sends personalized intro',
      businessImpact:
        'Shortens the sales cycle and ensures no qualified lead slips through the cracks',
      href: '/tower/marketing',
    },
    {
      id: 'churn-signals',
      title: 'Customer Churn Signal Detection',
      category: 'Customer Success',
      currentState:
        'No system monitors for early churn signals such as low engagement, repeated errors, or support contact.',
      estimatedHoursSaved: 'Revenue retention equivalent to 1–2 customers / month',
      difficulty: 'High',
      suggestedAgent:
        'Retention Agent — monitors engagement patterns and triggers proactive outreach before the customer decides to cancel',
      businessImpact: 'Prevents churn before it becomes a lost customer',
      href: '/tower/customer-success',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/tower" className="hover:text-foreground">
              Tower Control
            </Link>
            <span>/</span>
            <span className="text-foreground">Automation</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">
            Automation Opportunities
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Repetitive founder work identified for AI agent automation
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {opportunities.length}
          </p>
          <p className="text-xs text-muted-foreground">opportunities identified</p>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-sm font-medium text-foreground">How this works</p>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Tower Control identifies repetitive tasks you currently do manually and suggests AI agents
          that could handle them. Each opportunity shows estimated time saved, implementation
          difficulty, and the agent type best suited to automate it. Live platform data is used
          where available to surface the most impactful items first.
        </p>
      </div>

      {/* Opportunity cards */}
      <div className="space-y-3">
        {opportunities.map((opp) => (
          <div key={opp.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {opp.category}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_BADGE[opp.difficulty]}`}
                >
                  {opp.difficulty} difficulty
                </span>
                <span className="text-xs font-medium text-foreground">
                  {opp.estimatedHoursSaved}
                </span>
              </div>
              {opp.href && (
                <Link
                  href={opp.href}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  View →
                </Link>
              )}
            </div>

            <p className="mt-2 text-sm font-medium text-foreground">{opp.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{opp.currentState}</p>

            {opp.liveContext && (
              <div className="mt-2 flex items-start gap-1.5 rounded-md bg-amber-50 px-3 py-2 dark:bg-amber-950/30">
                <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                <p className="text-xs text-amber-800 dark:text-amber-300">{opp.liveContext}</p>
              </div>
            )}

            <div className="mt-3 grid gap-3 border-t border-border/50 pt-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Suggested Agent
                </p>
                <p className="mt-1 text-xs text-foreground">{opp.suggestedAgent}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Business Impact
                </p>
                <p className="mt-1 text-xs text-foreground">{opp.businessImpact}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
