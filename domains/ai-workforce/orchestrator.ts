import type { WorkforcePipeline, WorkflowStep, DepartmentId, ProviderCapability } from './types'

// Standard full-service content production pipeline.
// Reflects the flow: Customer → Business Brain → Research → Strategy →
// Production (Video / Voice / Creative) → QA → Delivery.
export const CONTENT_PRODUCTION_PIPELINE: WorkforcePipeline = {
  id: 'content-production-v1',
  name: 'Content Production Pipeline',
  description: 'Full-service content production from customer brief to final delivery',
  executionStrategy: 'sequential',
  requiresFounderApproval: false,
  estimatedTotalDuration: 3600,
  steps: [
    {
      id: 'intake',
      stage: 'intake',
      department: 'research',
      description: 'Receive and validate customer brief; seed Business Brain with context',
      requiredCapabilities: ['summarization'],
      requiresApproval: false,
      dependencies: [],
      retryStrategy: 'linear',
      fallbackStrategy: 'human-escalation',
      estimatedDuration: 60,
      priority: 'high',
    },
    {
      id: 'research',
      stage: 'research',
      department: 'research',
      description: 'Market research, competitive analysis, audience insights, trend synthesis',
      requiredCapabilities: ['deep-research', 'web-search', 'data-analysis'],
      requiresApproval: false,
      dependencies: ['intake'],
      retryStrategy: 'exponential',
      fallbackStrategy: 'provider-swap',
      estimatedDuration: 900,
      priority: 'high',
    },
    {
      id: 'strategy',
      stage: 'strategy',
      department: 'strategy-copy',
      description: 'Content strategy, messaging framework, production briefs for all departments',
      requiredCapabilities: ['content-strategy', 'text-generation'],
      requiresApproval: true,
      dependencies: ['research'],
      retryStrategy: 'linear',
      fallbackStrategy: 'provider-swap',
      estimatedDuration: 600,
      priority: 'high',
    },
    {
      id: 'copywriting',
      stage: 'production',
      department: 'strategy-copy',
      description: 'Long-form content, scripts, ad copy, and all written deliverables',
      requiredCapabilities: ['copywriting', 'text-generation'],
      requiresApproval: false,
      dependencies: ['strategy'],
      retryStrategy: 'linear',
      fallbackStrategy: 'provider-swap',
      estimatedDuration: 900,
      priority: 'high',
    },
    {
      id: 'video-production',
      stage: 'production',
      department: 'video',
      description: 'AI video production — spokesperson, cinematic, and social formats',
      requiredCapabilities: ['video-generation'],
      requiresApproval: false,
      dependencies: ['strategy'],
      retryStrategy: 'exponential',
      fallbackStrategy: 'provider-swap',
      estimatedDuration: 1200,
      priority: 'medium',
    },
    {
      id: 'voice-production',
      stage: 'production',
      department: 'voice',
      description: 'AI voice and audio production from approved copy',
      requiredCapabilities: ['voice-synthesis'],
      requiresApproval: false,
      dependencies: ['copywriting'],
      retryStrategy: 'exponential',
      fallbackStrategy: 'fail',
      estimatedDuration: 600,
      priority: 'medium',
    },
    {
      id: 'quality-assurance',
      stage: 'quality-assurance',
      department: 'quality-assurance',
      description: 'Full output review — brand alignment, accuracy, tone, delivery standards',
      requiredCapabilities: ['qa-review'],
      requiresApproval: true,
      dependencies: ['copywriting', 'video-production', 'voice-production'],
      retryStrategy: 'linear',
      fallbackStrategy: 'human-escalation',
      estimatedDuration: 600,
      priority: 'critical',
    },
    {
      id: 'delivery',
      stage: 'delivery',
      department: 'delivery',
      description: 'Package and deliver all approved outputs to the customer',
      requiredCapabilities: ['text-generation'],
      requiresApproval: false,
      dependencies: ['quality-assurance'],
      retryStrategy: 'linear',
      fallbackStrategy: 'human-escalation',
      estimatedDuration: 300,
      priority: 'high',
    },
  ],
}

export function getStepsByDepartment(
  pipeline: WorkforcePipeline,
  departmentId: DepartmentId
): WorkflowStep[] {
  return pipeline.steps.filter((s) => s.department === departmentId)
}

export function getRequiredCapabilities(pipeline: WorkforcePipeline): ProviderCapability[] {
  const all = pipeline.steps.flatMap((s) => s.requiredCapabilities)
  return [...new Set(all)]
}

export function getApprovalGates(pipeline: WorkforcePipeline): WorkflowStep[] {
  return pipeline.steps.filter((s) => s.requiresApproval)
}

export function getStepDependencies(pipeline: WorkforcePipeline, stepId: string): WorkflowStep[] {
  const step = pipeline.steps.find((s) => s.id === stepId)
  if (!step) return []
  return pipeline.steps.filter((s) => step.dependencies.includes(s.id))
}
