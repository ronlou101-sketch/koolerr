/**
 * Publishing Domain — Public Interface
 *
 * Owns durable customer publish jobs: the model, idempotent enqueue, atomic
 * claim, retry/terminal transitions, AND execution (upload to YouTube via
 * `executePublishJob`) for publishing an approved video deliverable to a
 * connected channel (YouTube first).
 *
 * NOTE: distinct from `domains/ai-workforce/publishing` (the pipeline
 * package-generation department).
 */

export * from './types'
export { assertPublishable } from './eligibility'
export {
  publishJobsService,
  PublishJobsService,
  PUBLISH_JOB_MAX_ATTEMPTS,
  _configurePublishJobsRepository,
  type IPublishJobsService,
  type PublishJobsDeps,
} from './service'
export type { IPublishJobsRepository } from './repository'
export { InMemoryPublishJobsRepository } from './in-memory-repository'
export { SupabasePublishJobsRepository } from './supabase-repository'
export { executePublishJob, type PublishExecutorDeps } from './executor'
