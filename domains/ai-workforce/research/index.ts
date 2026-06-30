/**
 * Research Department — Public Interface
 *
 * The Research Department is the first active AI employee department in the
 * AI Workforce. It accepts a BusinessProfile and produces a structured
 * ResearchBrief consumed by downstream departments (Strategy & Copy first).
 *
 * Primary provider: Manus (autonomous research agent)
 * Fallback provider: OpenAI
 *
 * Usage:
 *   import { researchDepartment } from '@/domains/ai-workforce/research'
 *   const result = await researchDepartment.conductResearch(request)
 */

export type {
  BusinessProfile,
  ResearchBrief,
  ResearchJob,
  ResearchJobStatus,
  ResearchError,
  ResearchErrorCode,
  ResearchRequest,
} from './types'

export type { IResearchDepartmentService } from './service'
export { ResearchDepartmentService, researchDepartment } from './service'
export { buildResearchPrompt, parseResearchBrief, RESEARCH_SYSTEM_CONTEXT } from './prompt'
