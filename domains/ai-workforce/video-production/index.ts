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
  VideoScript,
  VideoProductionDepartmentHealth,
  VideoProductionProviderReadiness,
  VideoProductionProviderStatus,
} from './types'

export type {
  IVideoProductionDepartmentService,
  SpokespersonVideoRenderRequest,
  WriteScriptRequest,
} from './service'
export { VideoProductionDepartmentService, videoProductionDepartment } from './service'
export type { RenderError, RenderErrorCode, RenderJobResult } from '../render'
export {
  buildVideoProductionPrompt,
  buildVideoScriptPrompt,
  parseVideoProductionBrief,
  parseVideoScript,
  VIDEO_PRODUCTION_SYSTEM_CONTEXT,
  VIDEO_SCRIPT_WRITER_SYSTEM_CONTEXT,
} from './prompt'
export { buildSkippedVideoProductionBrief, VIDEO_SKIPPED_NOTE } from './skip'
export { getVideoProductionDepartmentHealth } from './health'
