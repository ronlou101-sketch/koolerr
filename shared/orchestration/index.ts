/**
 * Orchestration Engine — Public Interface
 *
 * Coordinates multi-step, multi-agent workflows. Manages dependency
 * resolution, step sequencing, failure recovery, and progress tracking.
 *
 * The engine coordinates execution. Digital Employees perform the work.
 * Business logic does not live here.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.13 — Orchestration Engine.
 */

export * from './types'
export { orchestrationEngine, _configureOrchestrationRepository } from './engine'
export type { IOrchestrationRepository } from './repository'
export { InMemoryOrchestrationRepository } from './in-memory-repository'
export { SupabaseOrchestrationRepository } from './supabase-repository'
