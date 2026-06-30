/**
 * Strategy Department — Public Interface
 *
 * The Strategy Department is the second active AI department in the AI Workforce.
 * It consumes a ResearchBrief and produces a StrategyBrief — the production
 * blueprint consumed by Video, Voice, and Creative departments.
 *
 * Primary provider: OpenAI (gpt-4o)
 * Fallback provider: Anthropic
 *
 * Usage:
 *   import { strategyDepartment } from '@/domains/ai-workforce/strategy'
 *   const result = await strategyDepartment.developStrategy(request)
 */

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
} from './types'

export type { IStrategyDepartmentService } from './service'
export { StrategyDepartmentService, strategyDepartment } from './service'
export { buildStrategyPrompt, parseStrategyBrief, STRATEGY_SYSTEM_CONTEXT } from './prompt'
