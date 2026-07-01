/**
 * Video Production Department — Public Interface
 *
 * The Video Production Department is the fourth active AI department in the
 * AI Workforce. It consumes a CreativeBrief and produces a VideoProductionBrief —
 * the complete production package consumed by the rendering pipeline.
 *
 * Plan generation: OpenAI / Anthropic (text-capable providers via buildProviderOrder)
 * Phase 5 rendering: HeyGen (spokesperson video), Higgsfield (cinematic video),
 *                    ElevenLabs (voice synthesis)
 *
 * Usage:
 *   import { videoProductionDepartment } from '@/domains/ai-workforce/video-production'
 *   const result = await videoProductionDepartment.planProduction(request)
 */

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
} from './types'

export type { IVideoProductionDepartmentService } from './service'
export { VideoProductionDepartmentService, videoProductionDepartment } from './service'
export {
  buildVideoProductionPrompt,
  parseVideoProductionBrief,
  VIDEO_PRODUCTION_SYSTEM_CONTEXT,
} from './prompt'
export { getVideoProductionDepartmentHealth } from './health'
