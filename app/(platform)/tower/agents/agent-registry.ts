import { getExecutiveData } from '../executive/executive-data'
import { buildAgentTasks, AGENT_NAMES } from './agent-tasks'
import type { AgentId, AgentTask } from './agent-tasks'
import type { ExecutiveData } from '../executive/executive-data'

export type AgentStatus = 'active' | 'attention-required' | 'idle' | 'not-configured'
export type AgentHealth = 'healthy' | 'warning' | 'critical' | 'not-configured'

export interface AgentRecord {
  id: AgentId
  name: string
  role: string
  currentResponsibility: string
  status: AgentStatus
  health: AgentHealth
  lastExecution: string | null
  pendingTaskCount: number
  lastRecommendation: string | null
}

export interface AgentRegistryData {
  agents: AgentRecord[]
  generatedAt: string
}

const AGENT_DEFINITIONS: Record<AgentId, { role: string; currentResponsibility: string }> = {
  cto: {
    role: 'Chief Technology Officer',
    currentResponsibility:
      'Monitoring platform health, infrastructure gaps, AI Workforce reliability, and technical debt backlog',
  },
  cfo: {
    role: 'Chief Financial Officer',
    currentResponsibility:
      'Tracking billing health, subscription status, revenue signals, and payment failure recovery',
  },
  cmo: {
    role: 'Chief Marketing Officer',
    currentResponsibility:
      'Managing marketing stack configuration, growth funnel visibility, and customer acquisition strategy',
  },
  'customer-success': {
    role: 'Customer Success Director',
    currentResponsibility:
      'Monitoring customer health scores, onboarding completion, churn signals, and expansion readiness',
  },
  'support-manager': {
    role: 'Support Manager',
    currentResponsibility:
      'Overseeing ticket management, AI triage configuration, and support platform setup',
  },
  'content-director': {
    role: 'Content Director',
    currentResponsibility:
      'Managing knowledge base health, product documentation coverage, and feedback intake systems',
  },
}

function deriveAgentRecord(id: AgentId, tasks: AgentTask[], data: ExecutiveData): AgentRecord {
  const { health, revenue, actionQueue } = data
  const def = AGENT_DEFINITIONS[id]
  const agentTasks = tasks.filter((t) => t.agentId === id)
  const hasCritical = agentTasks.some((t) => t.priority === 'critical')
  const hasHigh = agentTasks.some((t) => t.priority === 'high')
  const generatedAt = data.generatedAt

  let agentHealth: AgentHealth
  let agentStatus: AgentStatus
  let lastExecution: string | null = null

  switch (id) {
    case 'cto': {
      lastExecution = generatedAt
      if (health.overall === 'critical' || hasCritical) {
        agentHealth = 'critical'
        agentStatus = 'attention-required'
      } else if (health.overall === 'warning' || hasHigh) {
        agentHealth = 'warning'
        agentStatus = 'attention-required'
      } else {
        agentHealth = 'healthy'
        agentStatus = 'active'
      }
      break
    }

    case 'cfo': {
      lastExecution = generatedAt
      if (!revenue.stripeConnected) {
        agentHealth = 'not-configured'
        agentStatus = 'attention-required'
      } else if (revenue.pastDue > 0) {
        agentHealth = 'warning'
        agentStatus = 'attention-required'
      } else {
        agentHealth = 'healthy'
        agentStatus = 'active'
      }
      break
    }

    case 'cmo': {
      // Marketing has no connected data source yet
      agentHealth = 'not-configured'
      agentStatus = 'not-configured'
      lastExecution = null
      break
    }

    case 'customer-success': {
      lastExecution = generatedAt
      const noCustomers = actionQueue.some((a) => a.id === 'no-customers')
      if (noCustomers) {
        agentHealth = 'warning'
        agentStatus = 'attention-required'
      } else {
        agentHealth = 'healthy'
        agentStatus = 'active'
      }
      break
    }

    case 'support-manager': {
      agentHealth = 'not-configured'
      agentStatus = 'not-configured'
      lastExecution = null
      break
    }

    case 'content-director': {
      agentHealth = 'not-configured'
      agentStatus = 'not-configured'
      lastExecution = null
      break
    }
  }

  const lastRecommendation = agentTasks[0]?.description ?? null

  return {
    id,
    name: AGENT_NAMES[id],
    role: def.role,
    currentResponsibility: def.currentResponsibility,
    status: agentStatus,
    health: agentHealth,
    lastExecution,
    pendingTaskCount: agentTasks.length,
    lastRecommendation,
  }
}

export function buildAgentRegistry(tasks: AgentTask[], data: ExecutiveData): AgentRecord[] {
  const agentIds: AgentId[] = [
    'cto',
    'cfo',
    'cmo',
    'customer-success',
    'support-manager',
    'content-director',
  ]
  return agentIds.map((id) => deriveAgentRecord(id, tasks, data))
}

export async function getAgentRegistry(): Promise<AgentRegistryData> {
  const data = await getExecutiveData()
  const tasks = buildAgentTasks(data)
  return {
    agents: buildAgentRegistry(tasks, data),
    generatedAt: data.generatedAt,
  }
}
