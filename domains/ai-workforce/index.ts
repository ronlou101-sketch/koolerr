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

// ─── Strategy Department ──────────────────────────────────────────────────────
export type {
  CustomerPersona,
  ContentCalendarEntry,
  WeeklyPostingSchedule,
  StrategyBrief,
  StrategyJob,
  StrategyJobStatus,
  StrategyError,
  StrategyErrorCode,
  StrategyRequest,
  IStrategyDepartmentService,
} from './strategy'
export {
  StrategyDepartmentService,
  strategyDepartment,
  buildStrategyPrompt,
  parseStrategyBrief,
} from './strategy'

// ─── Creative Department ──────────────────────────────────────────────────────
export type {
  CreativeBrief,
  CreativeJob,
  CreativeJobStatus,
  CreativeError,
  CreativeErrorCode,
  CreativeRequest,
  CreativeDepartmentHealth,
  CreativeProviderReadiness,
  CreativeProviderStatus,
  ICreativeDepartmentService,
} from './creative'
export {
  CreativeDepartmentService,
  creativeDepartment,
  buildCreativePrompt,
  parseCreativeBrief,
  getCreativeDepartmentHealth,
} from './creative'

// ─── Video Production Department ─────────────────────────────────────────────
export type {
  VideoProductionBrief,
  VideoProductionJob,
  VideoProductionJobStatus,
  VideoProductionError,
  VideoProductionErrorCode,
  VideoProductionRequest,
  VideoProductionDepartmentHealth,
  VideoProductionProviderReadiness,
  VideoProductionProviderStatus,
  IVideoProductionDepartmentService,
} from './video-production'
export {
  VideoProductionDepartmentService,
  videoProductionDepartment,
  buildVideoProductionPrompt,
  parseVideoProductionBrief,
  getVideoProductionDepartmentHealth,
} from './video-production'

// ─── Approval Department ─────────────────────────────────────────────────────
export type {
  ApprovalOutcome,
  ApprovalDecision,
  ApprovalJob,
  ApprovalJobStatus,
  ApprovalError,
  ApprovalErrorCode,
  ApprovalRequest,
  ApprovalDepartmentHealth,
  ApprovalProviderReadiness,
  ApprovalProviderStatus,
  IApprovalDepartmentService,
} from './approval'
export {
  ApprovalDepartmentService,
  approvalDepartment,
  buildApprovalPrompt,
  parseApprovalDecision,
  getApprovalDepartmentHealth,
} from './approval'

// ─── Publishing Department ────────────────────────────────────────────────────
export type {
  SupportedPlatform,
  PublishingPackage,
  PublishingJob,
  PublishingJobStatus,
  PublishingError,
  PublishingErrorCode,
  PublishingRequest,
  PublishingDepartmentHealth,
  PublishingProviderReadiness,
  PublishingProviderStatus,
  IPublishingDepartmentService,
} from './publishing'
export {
  SUPPORTED_PLATFORMS,
  PublishingDepartmentService,
  publishingDepartment,
  buildPublishingPrompt,
  parsePublishingPackages,
  getPublishingDepartmentHealth,
} from './publishing'
