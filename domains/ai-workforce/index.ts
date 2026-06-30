// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  DepartmentId,
  Department,
  ProviderId,
  ProviderStatus,
  ProviderCapability,
  Provider,
  EmployeeStatus,
  EmployeePriority,
  AIEmployee,
  WorkflowStage,
  ExecutionStrategy,
  RetryStrategy,
  FallbackStrategy,
  WorkflowStep,
  WorkforcePipeline,
  HealthStatus,
  ProviderHealth,
  DepartmentHealth,
  ExecutionQueueHealth,
  WorkforceHealth,
} from './types'

// ─── Provider Registry ────────────────────────────────────────────────────────
export {
  PROVIDER_REGISTRY,
  getProvider,
  getProvidersByDepartment,
  getActiveProviders,
  getConfiguredProviders,
} from './providers'

// ─── Department Registry ──────────────────────────────────────────────────────
export { DEPARTMENT_REGISTRY, getDepartment, getDepartmentsInOrder } from './departments'

// ─── Workforce Registry ───────────────────────────────────────────────────────
export {
  WORKFORCE_REGISTRY,
  getEmployee,
  getEmployeesByDepartment,
  getActiveEmployees,
} from './employees'

// ─── Orchestration ────────────────────────────────────────────────────────────
export {
  CONTENT_PRODUCTION_PIPELINE,
  getStepsByDepartment,
  getRequiredCapabilities,
  getApprovalGates,
  getStepDependencies,
} from './orchestrator'

// ─── Health ───────────────────────────────────────────────────────────────────
export { getWorkforceHealth } from './health'

// ─── Research Department ──────────────────────────────────────────────────────
export type {
  BusinessProfile,
  ResearchBrief,
  ResearchJob,
  ResearchJobStatus,
  ResearchError,
  ResearchErrorCode,
  ResearchRequest,
  IResearchDepartmentService,
} from './research'
export {
  ResearchDepartmentService,
  researchDepartment,
  buildResearchPrompt,
  parseResearchBrief,
} from './research'
