/**
 * Publishing Department — Public Interface
 *
 * The Publishing Department is the fifth active AI department in the AI Workforce.
 * It consumes a VideoProductionBrief and produces a PublishingJob containing
 * one platform-optimised PublishingPackage per supported platform.
 *
 * Supported platforms: Facebook, Instagram, TikTok, YouTube Shorts, LinkedIn,
 *                      Google Business Profile
 *
 * Package generation: OpenAI (primary) / Anthropic (fallback) via buildProviderOrder()
 * Phase 6 delivery: platform API integrations (Facebook Graph, Instagram Graph,
 *                   TikTok for Business, YouTube Data API, LinkedIn API, GBP API)
 *
 * Usage:
 *   import { publishingDepartment } from '@/domains/ai-workforce/publishing'
 *   const result = await publishingDepartment.preparePackages(request)
 */

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
} from './types'

export { SUPPORTED_PLATFORMS } from './types'

export type { IPublishingDepartmentService } from './service'
export { PublishingDepartmentService, publishingDepartment } from './service'
export { buildPublishingPrompt, parsePublishingPackages, PUBLISHING_SYSTEM_CONTEXT } from './prompt'
export { getPublishingDepartmentHealth } from './health'
