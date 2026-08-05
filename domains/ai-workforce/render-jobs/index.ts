/**
 * Render Jobs Domain — Public Interface
 *
 * The durable model for per-asset render jobs (ADR-025 §5): idempotent, resumable,
 * retryable, and claimable with bounded concurrency. This module owns job state
 * only — it never invokes a render provider (the render path in render.ts does).
 *
 * Usage:
 *   import { renderJobsService } from '@/domains/ai-workforce/render-jobs'
 *
 * See docs/adr/ADR-025-campaign-rendering.md §5.
 */
export * from './types'
export {
  RenderJobsService,
  renderJobsService,
  _configureRenderJobsRepository,
  RENDER_JOB_MAX_ATTEMPTS,
} from './service'
export type { IRenderJobsService } from './service'
export type { IRenderJobsRepository } from './repository'
export { InMemoryRenderJobsRepository } from './in-memory-repository'
export { SupabaseRenderJobsRepository } from './supabase-repository'
