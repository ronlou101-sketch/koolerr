// ─── Department ───────────────────────────────────────────────────────────────

export type DepartmentId =
  | 'research'
  | 'strategy-copy'
  | 'video'
  | 'voice'
  | 'creative'
  | 'quality-assurance'
  | 'delivery'

export interface Department {
  id: DepartmentId
  name: string
  description: string
  mission: string
  pipelinePosition: number
  inputFrom: DepartmentId[]
  outputTo: DepartmentId[]
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export type ProviderId = 'manus' | 'openai' | 'heygen' | 'higgsfield' | 'elevenlabs'

export type ProviderStatus = 'active' | 'inactive' | 'degraded' | 'not-configured'

export type ProviderCapability =
  | 'text-generation'
  | 'deep-research'
  | 'web-search'
  | 'data-analysis'
  | 'content-strategy'
  | 'copywriting'
  | 'summarization'
  | 'image-generation'
  | 'video-generation'
  | 'voice-synthesis'
  | 'audio-generation'
  | 'qa-review'
  | 'code-generation'
  | 'translation'

export interface Provider {
  id: ProviderId
  name: string
  description: string
  departments: DepartmentId[]
  capabilities: ProviderCapability[]
  status: ProviderStatus
  supportedTasks: string[]
  configuredInEnv: boolean
}

// ─── AI Employee ──────────────────────────────────────────────────────────────

export type EmployeeStatus = 'active' | 'idle' | 'busy' | 'unavailable' | 'not-configured'

export type EmployeePriority = 'critical' | 'high' | 'medium' | 'low'

export interface AIEmployee {
  id: string
  name: string
  role: string
  description: string
  department: DepartmentId
  responsibilities: string[]
  primaryProvider: ProviderId
  fallbackProvider: ProviderId | null
  capabilities: ProviderCapability[]
  status: EmployeeStatus
  priority: EmployeePriority
}

// ─── Orchestration ────────────────────────────────────────────────────────────

export type WorkflowStage =
  | 'intake'
  | 'research'
  | 'strategy'
  | 'production'
  | 'quality-assurance'
  | 'delivery'

export type ExecutionStrategy = 'sequential' | 'parallel' | 'conditional'

export type RetryStrategy = 'none' | 'linear' | 'exponential'

export type FallbackStrategy =
  | 'provider-swap'
  | 'department-escalation'
  | 'human-escalation'
  | 'fail'

export interface WorkflowStep {
  id: string
  stage: WorkflowStage
  department: DepartmentId
  description: string
  requiredCapabilities: ProviderCapability[]
  requiresApproval: boolean
  dependencies: string[]
  retryStrategy: RetryStrategy
  fallbackStrategy: FallbackStrategy
  estimatedDuration: number
  priority: EmployeePriority
}

export interface WorkforcePipeline {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  executionStrategy: ExecutionStrategy
  requiresFounderApproval: boolean
  estimatedTotalDuration: number
}

// ─── Health ───────────────────────────────────────────────────────────────────

export type HealthStatus = 'healthy' | 'degraded' | 'critical' | 'not-configured'

export interface ProviderHealth {
  providerId: ProviderId
  status: HealthStatus
  configured: boolean
  notes: string
}

export interface DepartmentHealth {
  departmentId: DepartmentId
  status: HealthStatus
  activeEmployeeCount: number
  totalEmployeeCount: number
  configuredProviderCount: number
  totalProviderCount: number
  notes: string
}

export interface ExecutionQueueHealth {
  status: HealthStatus
  queuedJobs: number
  processingJobs: number
  failedJobs: number
}

export interface WorkforceHealth {
  overall: HealthStatus
  departments: DepartmentHealth[]
  providers: ProviderHealth[]
  executionQueue: ExecutionQueueHealth
  readyForProduction: boolean
  blockedBy: string[]
}
