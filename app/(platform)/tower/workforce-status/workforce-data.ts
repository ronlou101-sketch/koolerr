import { createServerSupabaseClient } from '@/shared/lib/supabase-server'

export type WorkforceHealth = 'healthy' | 'warning' | 'critical' | 'not-configured'

export interface WorkforceStatus {
  workforceId: string
  workforceName: string
  businessFunction: string
  workforceStatus: string
  organizationId: string
  totalRuns: number
  completedRuns: number
  failedRuns: number
  pendingRuns: number
  runningRuns: number
  awaitingApprovalRuns: number
  lastRunAt: string | null
  lastRunStatus: string | null
  lastRunObjective: string | null
  lastRunDurationMs: number | null
  lastError: string | null
  health: WorkforceHealth
}

export interface WorkforceStatusData {
  workforces: WorkforceStatus[]
  totalRunsAllWorkforces: number
  generatedAt: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildStatus(
  wfId: string,
  wfName: string,
  wfFunction: string,
  wfStatus: string,
  orgId: string,
  runsByWorkforce: Map<string, any[]>,
  workflowByRunId: Map<string, string>,
  lastErrorByWorkflowId: Map<string, string>
): WorkforceStatus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runs: any[] = runsByWorkforce.get(wfId) ?? []
  const totalRuns = runs.length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completedRuns = runs.filter((r: any) => r.status === 'completed').length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const failedRuns = runs.filter((r: any) => r.status === 'failed').length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingRuns = runs.filter((r: any) => r.status === 'pending').length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runningRuns = runs.filter((r: any) => r.status === 'running').length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awaitingRuns = runs.filter((r: any) => r.status === 'awaiting_approval').length

  const lastRun = runs[0] ?? null
  const lastRunAt = lastRun?.started_at ?? lastRun?.created_at ?? null

  let lastRunDurationMs: number | null = null
  if (lastRun?.started_at && lastRun?.completed_at) {
    lastRunDurationMs =
      new Date(lastRun.completed_at).getTime() - new Date(lastRun.started_at).getTime()
  }

  let lastError: string | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastFailedRun = runs.find((r: any) => r.status === 'failed')
  if (lastFailedRun) {
    const workflowId = workflowByRunId.get(lastFailedRun.id)
    lastError = workflowId
      ? (lastErrorByWorkflowId.get(workflowId) ??
        `Run failed: ${lastFailedRun.objective ?? 'unknown objective'}`)
      : `Run failed: ${lastFailedRun.objective ?? 'unknown objective'}`
  }

  let health: WorkforceHealth
  if (totalRuns === 0) {
    health = 'not-configured'
  } else if (failedRuns > 0 && failedRuns / totalRuns > 0.5) {
    health = 'critical'
  } else if (failedRuns > 0) {
    health = 'warning'
  } else {
    health = 'healthy'
  }

  return {
    workforceId: wfId,
    workforceName: wfName,
    businessFunction: wfFunction,
    workforceStatus: wfStatus,
    organizationId: orgId,
    totalRuns,
    completedRuns,
    failedRuns,
    pendingRuns,
    runningRuns,
    awaitingApprovalRuns: awaitingRuns,
    lastRunAt,
    lastRunStatus: lastRun?.status ?? null,
    lastRunObjective: lastRun?.objective ?? null,
    lastRunDurationMs,
    lastError,
    health,
  }
}

export async function getWorkforceStatusData(): Promise<WorkforceStatusData> {
  const db = createServerSupabaseClient()
  const generatedAt = new Date().toISOString()

  const [workforcesResult, runsResult, workflowsResult, stepsResult] = await Promise.allSettled([
    db
      .from('workforces')
      .select('id, name, business_function, status, organization_id, created_at'),
    db
      .from('engagement_runs')
      .select(
        'id, workforce_id, organization_id, status, objective, started_at, completed_at, created_at'
      )
      .order('created_at', { ascending: false }),
    db.from('workflows').select('id, engagement_run_id, status, completed_at'),
    db
      .from('workflow_steps')
      .select('workflow_id, name, error, completed_at')
      .not('error', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(200),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workforces: any[] =
    workforcesResult.status === 'fulfilled' && !workforcesResult.value.error
      ? (workforcesResult.value.data ?? [])
      : []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allRuns: any[] =
    runsResult.status === 'fulfilled' && !runsResult.value.error
      ? (runsResult.value.data ?? [])
      : []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allWorkflows: any[] =
    workflowsResult.status === 'fulfilled' && !workflowsResult.value.error
      ? (workflowsResult.value.data ?? [])
      : []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errorSteps: any[] =
    stepsResult.status === 'fulfilled' && !stepsResult.value.error
      ? (stepsResult.value.data ?? [])
      : []

  // runId → first workflow id
  const workflowByRunId = new Map<string, string>()
  for (const wf of allWorkflows) {
    if (!workflowByRunId.has(wf.engagement_run_id)) {
      workflowByRunId.set(wf.engagement_run_id, wf.id)
    }
  }

  // workflowId → most recent error message
  const lastErrorByWorkflowId = new Map<string, string>()
  for (const step of errorSteps) {
    if (!lastErrorByWorkflowId.has(step.workflow_id)) {
      lastErrorByWorkflowId.set(step.workflow_id, `${step.name}: ${step.error}`)
    }
  }

  // workforceId → runs (already ordered desc by created_at)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runsByWorkforce = new Map<string, any[]>()
  for (const run of allRuns) {
    const existing = runsByWorkforce.get(run.workforce_id) ?? []
    existing.push(run)
    runsByWorkforce.set(run.workforce_id, existing)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: WorkforceStatus[] = workforces.map((wf: any) =>
    buildStatus(
      wf.id,
      wf.name,
      wf.business_function,
      wf.status,
      wf.organization_id,
      runsByWorkforce,
      workflowByRunId,
      lastErrorByWorkflowId
    )
  )

  // Include runs that reference a workforce_id not present in the workforces table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workforceIds = new Set(workforces.map((wf: any) => wf.id))
  const orphanIds = new Set<string>()
  for (const run of allRuns) {
    if (run.workforce_id && !workforceIds.has(run.workforce_id)) {
      orphanIds.add(run.workforce_id)
    }
  }
  for (const wfId of orphanIds) {
    const runs = runsByWorkforce.get(wfId) ?? []
    result.push(
      buildStatus(
        wfId,
        wfId,
        'Unknown',
        'unknown',
        runs[0]?.organization_id ?? '',
        runsByWorkforce,
        workflowByRunId,
        lastErrorByWorkflowId
      )
    )
  }

  return {
    workforces: result,
    totalRunsAllWorkforces: allRuns.length,
    generatedAt,
  }
}
