/**
 * Creative Department — Public Interface
 *
 * The Creative Department is the third active AI department in the AI Workforce.
 * It consumes a StrategyBrief and produces a CreativeBrief — the production
 * blueprint consumed by the Video, Voice, and publishing pipeline.
 *
 * Brief generation: OpenAI / Anthropic (text-capable providers)
 * Phase 4 media production: HeyGen (spokesperson video), Higgsfield (cinematic video),
 *                           ElevenLabs (voice synthesis)
 *
 * Usage:
 *   import { creativeDepartment } from '@/domains/ai-workforce/creative'
 *   const result = await creativeDepartment.createBrief(request)
 */

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
} from './types'

export type { ICreativeDepartmentService } from './service'
export { CreativeDepartmentService, creativeDepartment } from './service'
export { buildCreativePrompt, parseCreativeBrief, CREATIVE_SYSTEM_CONTEXT } from './prompt'
export { getCreativeDepartmentHealth } from './health'
